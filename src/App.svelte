<script lang="ts">
    import { onMount } from "svelte";
    import WeekView from "./lib/components/WeekView.svelte";
    import FloatingNav from "./lib/components/FloatingNav.svelte";
    import AddActivityModal from "./lib/components/AddActivityModal.svelte";
    import SettingsSheet from "./lib/components/SettingsSheet.svelte";
    import ExportSheet from "./lib/components/ExportSheet.svelte";
    import SyncConflictDialog from "./lib/components/SyncConflictDialog.svelte";
    import { currentWeek, currentYear } from "./lib/stores/week";
    import { subscriptions } from "./lib/stores/ical";
    import { activities } from "./lib/stores/activities";
    import { formatDateRange } from "./lib/utils/date";
    import WeekPicker from "./lib/components/WeekPicker.svelte";
    import { getWeekNumber } from "./lib/utils/date";
    import type {
        CalendarItem,
        SyncConflict,
        ConflictResolution,
    } from "./lib/types/index";

    let isDesktop =
        typeof window !== "undefined" ? window.innerWidth >= 768 : false;
    let showAddActivity = false;
    let showSettings = false;
    let showWeekPicker = false;
    let showExport = false;
    let isSyncing = false;
    let showConflictDialog = false;
    let pendingConflicts: SyncConflict[] = [];
    let pendingSyncData: Map<
        string,
        { subscription: any; items: CalendarItem[] }
    > = new Map();

    const REFRESH_INTERVAL_HOURS = 24; // Auto-refresh if data is older than 24 hours

    function handleResize() {
        isDesktop = window.innerWidth >= 768;
    }

    function handleOpenAddActivity() {
        showAddActivity = true;
    }

    function handleCloseAddActivity() {
        showAddActivity = false;
    }

    function handleOpenSettings() {
        showSettings = true;
    }

    function handleWeekSelected(
        event: CustomEvent<{ week: number; year: number }>,
    ) {
        currentWeek.set(event.detail.week);
        currentYear.set(event.detail.year);
        showWeekPicker = false;
    }

    function handleOpenExport() {
        showExport = true;
    }

    // iCal parsing functions
    function parseICalToCalendarItems(
        iCalText: string,
        subscriptionId: string,
    ): CalendarItem[] {
        const items: CalendarItem[] = [];
        const lines = iCalText.split("\n");
        let currentEvent: any = null;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // Handle line folding
            while (i + 1 < lines.length && lines[i + 1].match(/^[\t ]/)) {
                i++;
                line += lines[i].substring(1);
            }

            const trimmed = line.trim();

            if (trimmed === "BEGIN:VEVENT") {
                currentEvent = {
                    sourceId: subscriptionId,
                    source: "ical",
                    description: "",
                };
            } else if (trimmed === "END:VEVENT" && currentEvent) {
                if (currentEvent.summary && currentEvent.dtstart) {
                    const item = buildCalendarItem(currentEvent);
                    if (item) items.push(item);
                }
                currentEvent = null;
            } else if (currentEvent) {
                const colonIndex = trimmed.indexOf(":");
                if (colonIndex === -1) continue;

                const field = trimmed.substring(0, colonIndex);
                const value = trimmed.substring(colonIndex + 1);

                if (field === "SUMMARY") {
                    currentEvent.summary = decodeICalText(value);
                } else if (field.startsWith("DTSTART")) {
                    currentEvent.dtstart = value;
                } else if (field.startsWith("DTEND")) {
                    currentEvent.dtend = value;
                } else if (field === "UID") {
                    currentEvent.uid = value;
                } else if (field === "DESCRIPTION") {
                    currentEvent.description = decodeICalText(value);
                }
            }
        }

        return items;
    }

    function buildCalendarItem(event: any): CalendarItem | null {
        try {
            const dtstart = event.dtstart || "";
            const dtend = event.dtend || dtstart;

            const isAllDay = !dtstart.includes("T");
            const startDate = extractDate(dtstart);
            const endDate = extractDate(dtend);
            const startTime = isAllDay ? "09:00" : extractTime(dtstart);
            const endTime = isAllDay ? "17:00" : extractTime(dtend);

            if (!startDate) return null;

            const dateObj = new Date(
                parseInt(startDate.substring(0, 4)),
                parseInt(startDate.substring(4, 6)) - 1,
                parseInt(startDate.substring(6, 8)),
            );

            const day = (dateObj.getDay() + 6) % 7;
            const week = getWeekNumber(dateObj);
            const year = dateObj.getFullYear();

            const id = event.uid
                ? `${event.sourceId}-${event.uid.replace(/[^a-zA-Z0-9-]/g, "")}`
                : `${event.sourceId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const now = Date.now();

            return {
                id,
                summary: event.summary,
                description: event.description,
                dtstart,
                dtend,
                startDate,
                endDate,
                startTime,
                endTime,
                day,
                week,
                year,
                isAllDay,
                source: "ical",
                sourceId: event.sourceId,
                uid: event.uid,
                createdAt: now,
                lastModified: now,
            };
        } catch (err) {
            console.error("Error building calendar item:", err);
            return null;
        }
    }

    function extractDate(iCalDateTime: string): string {
        if (iCalDateTime.includes("T")) {
            return iCalDateTime.split("T")[0];
        }
        return iCalDateTime;
    }

    function extractTime(iCalDateTime: string): string {
        if (!iCalDateTime.includes("T")) {
            return "09:00";
        }

        const timePart = iCalDateTime.split("T")[1];
        const cleanTime = timePart.replace("Z", "");
        const hours = cleanTime.substring(0, 2);
        const minutes = cleanTime.substring(2, 4);

        return `${hours}:${minutes}`;
    }

    function decodeICalText(text: string): string {
        return text
            .replace(/\\n/g, "\n")
            .replace(/\\,/g, ",")
            .replace(/\\;/g, ";")
            .replace(/\\\\/g, "\\");
    }

    async function refreshSubscription(
        subscriptionId: string,
        skipConflictCheck = false,
    ) {
        try {
            const subscription = $subscriptions.find(
                (s) => s.id === subscriptionId,
            );
            if (!subscription || !subscription.enabled) return;

            console.log(`Fetching iCal subscription: ${subscription.name}`);

            const response = await fetch(subscription.url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            const calendarItems = parseICalToCalendarItems(
                text,
                subscriptionId,
            );

            // Find old items from this subscription
            const oldActivities = $activities.filter(
                (a) => a.sourceId === subscriptionId && a.source === "ical",
            );

            // Detect conflicts: items that have been locally modified
            if (!skipConflictCheck) {
                const conflicts: SyncConflict[] = [];
                const subscriptionLastFetched = subscription.lastFetched || 0;

                for (const oldActivity of oldActivities) {
                    // Check if item was modified after the last sync
                    const wasModifiedLocally =
                        oldActivity.lastModified > subscriptionLastFetched;

                    // Check if item has local overrides
                    const hasLocalOverrides =
                        oldActivity.localOverrides &&
                        Object.keys(oldActivity.localOverrides).length > 0;

                    if (wasModifiedLocally || hasLocalOverrides) {
                        // Find corresponding incoming item
                        const incomingItem = calendarItems.find(
                            (item) => item.uid === oldActivity.uid,
                        );

                        conflicts.push({
                            localItem: oldActivity,
                            incomingItem: incomingItem || null,
                            subscriptionName: subscription.name,
                        });
                    }
                }

                // If there are conflicts, store the sync data and show dialog
                if (conflicts.length > 0) {
                    pendingConflicts = [...pendingConflicts, ...conflicts];
                    pendingSyncData.set(subscriptionId, {
                        subscription,
                        items: calendarItems,
                    });
                    showConflictDialog = true;
                    return; // Don't proceed with sync until user resolves conflicts
                }
            }

            // No conflicts or user chose to proceed - apply sync
            for (const oldActivity of oldActivities) {
                activities.removeActivity(oldActivity.id);
            }

            // Add new calendar items
            for (const item of calendarItems) {
                activities.addActivity(item);
            }

            // Update subscription metadata
            subscriptions.updateSubscription({
                ...subscription,
                lastFetched: Date.now(),
            });

            console.log(
                `Successfully fetched ${calendarItems.length} items from ${subscription.name}`,
            );
        } catch (error) {
            console.error(
                `Failed to refresh subscription ${subscriptionId}:`,
                error,
            );
        }
    }

    function handleConflictResolution(event: CustomEvent<ConflictResolution>) {
        const resolution = event.detail;

        if (resolution === "keep-local") {
            // Smart partial sync: keep modified items, but sync everything else
            for (const [subscriptionId, data] of pendingSyncData.entries()) {
                const { subscription, items: calendarItems } = data;

                // Get IDs of items that have conflicts (modified locally)
                const conflictedItemIds = new Set(
                    pendingConflicts
                        .filter((c) => c.localItem.sourceId === subscriptionId)
                        .map((c) => c.localItem.id),
                );

                // Get all current items from this subscription
                const oldActivities = $activities.filter(
                    (a) => a.sourceId === subscriptionId && a.source === "ical",
                );

                // Remove old items that are NOT conflicted
                for (const oldActivity of oldActivities) {
                    if (!conflictedItemIds.has(oldActivity.id)) {
                        activities.removeActivity(oldActivity.id);
                    }
                }

                // Add new items from sync that don't match conflicted items
                for (const item of calendarItems) {
                    // Check if this incoming item matches a conflicted local item by UID
                    const isConflicted = pendingConflicts.some(
                        (c) =>
                            c.localItem.sourceId === subscriptionId &&
                            c.localItem.uid === item.uid,
                    );

                    // Only add if not conflicted
                    if (!isConflicted) {
                        activities.addActivity(item);
                    }
                }

                // Update subscription metadata
                subscriptions.updateSubscription({
                    ...subscription,
                    lastFetched: Date.now(),
                });
            }
            console.log("Kept local changes, synced non-conflicted items");
        } else if (resolution === "use-synced") {
            // Discard local changes - perform sync without conflict check
            for (const [subscriptionId, _data] of pendingSyncData.entries()) {
                refreshSubscription(subscriptionId, true);
            }
            console.log("Discarded local changes, applied synced data");
        }

        // Clear pending data
        pendingConflicts = [];
        pendingSyncData.clear();
        showConflictDialog = false;
    }

    function handleConflictDialogClose() {
        // User closed dialog without choosing - treat as "keep local"
        pendingConflicts = [];
        pendingSyncData.clear();
        showConflictDialog = false;
    }

    async function autoRefreshSubscriptions() {
        const now = Date.now();
        const refreshThreshold = REFRESH_INTERVAL_HOURS * 60 * 60 * 1000;

        for (const subscription of $subscriptions) {
            if (!subscription.enabled) continue;

            const needsRefresh =
                !subscription.lastFetched ||
                now - subscription.lastFetched > refreshThreshold;

            if (needsRefresh) {
                await refreshSubscription(subscription.id);
            }
        }
    }

    async function handleRefreshSubscriptions() {
        if (isSyncing) return; // Prevent multiple simultaneous syncs

        isSyncing = true;
        console.log("Manual refresh triggered");

        try {
            // Refresh all enabled subscriptions regardless of last fetch time
            for (const subscription of $subscriptions) {
                if (subscription.enabled) {
                    await refreshSubscription(subscription.id);
                }
            }
        } finally {
            isSyncing = false;
        }
    }

    onMount(() => {
        // Auto-refresh subscriptions on app start if they're outdated
        autoRefreshSubscriptions();
    });
</script>

<svelte:window on:resize={handleResize} />

<main class="h-screen bg-background text-foreground overflow-hidden">
    {#if isDesktop}
        <!-- Desktop Layout -->
        <div class="max-w-7xl mx-auto px-4 py-0 h-screen flex flex-col">
            <!-- Desktop Header -->
            <div class="m-4 flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <h1 class="text-4xl font-bold">📅 Wochenschau</h1>
                    <button
                        on:click={() => (showWeekPicker = true)}
                        class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        aria-label="Pick week"
                        title="Pick week"
                    >
                        <svg
                            class="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M8 7V3m8 4V3m-9 8h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                        <span class="text-sm font-semibold">
                            W{$currentWeek} • {formatDateRange(
                                $currentWeek,
                                $currentYear,
                            )}
                        </span>
                    </button>
                </div>
                <div class="flex gap-2">
                    <button
                        on:click={handleRefreshSubscriptions}
                        disabled={isSyncing}
                        class="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Refresh calendar subscriptions"
                        title="Sync calendars"
                    >
                        <svg
                            class="w-5 h-5 {isSyncing ? 'animate-spin' : ''}"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                        {isSyncing ? "Syncing..." : "Sync"}
                    </button>
                    <button
                        on:click={handleOpenAddActivity}
                        class="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
                    >
                        + Add Activity
                    </button>
                    <button
                        on:click={handleOpenExport}
                        class="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                        aria-label="Export weekly agenda"
                        title="Export as image"
                    >
                        <svg
                            class="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                        </svg>
                        Export
                    </button>
                    <button
                        on:click={handleOpenSettings}
                        class="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                        aria-label="Open settings"
                    >
                        <svg
                            class="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                        Settings
                    </button>
                </div>
            </div>

            <!-- Week View -->
            <div class="flex-1 overflow-hidden">
                <WeekView {isDesktop} />
            </div>
        </div>
    {:else}
        <!-- Mobile Layout -->
        <div class="h-screen flex flex-col pb-0 relative overflow-hidden">
            <!-- Mobile Header -->
            <div
                class="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-background/80 to-transparent px-4 py-3 flex items-center justify-between pointer-events-none backdrop-blur-lg"
                style="mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%);"
            >
                <h1 class="text-2xl font-bold pointer-events-auto">
                    📅 Wochenschau
                </h1>
                <button
                    on:click={handleRefreshSubscriptions}
                    disabled={isSyncing}
                    class="pointer-events-auto p-2 rounded-lg active:bg-muted transition-colors disabled:opacity-50"
                    aria-label="Sync calendars"
                    title={isSyncing ? "Syncing..." : "Sync calendars"}
                >
                    <svg
                        class="w-6 h-6 {isSyncing ? 'animate-spin' : ''}"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                </button>
            </div>

            <!-- Week View -->
            <div class="flex-1 overflow-hidden">
                <WeekView {isDesktop} />
            </div>
            <!-- Floating Navigation Bar -->
            <FloatingNav
                on:openAddActivity={handleOpenAddActivity}
                on:openSettings={handleOpenSettings}
                on:openExport={handleOpenExport}
            />
        </div>
    {/if}
</main>

<!-- Modals/Sheets -->
{#if showAddActivity}
    <AddActivityModal on:close={handleCloseAddActivity} {isDesktop} />
{/if}

{#if showSettings}
    <SettingsSheet on:close={() => (showSettings = false)} {isDesktop} />
{/if}

{#if showWeekPicker}
    <WeekPicker
        {isDesktop}
        currentWeek={$currentWeek}
        currentYear={$currentYear}
        on:weekSelected={handleWeekSelected}
        on:close={() => (showWeekPicker = false)}
    />
{/if}

{#if showExport}
    <ExportSheet on:close={() => (showExport = false)} {isDesktop} />
{/if}

<!-- Sync Conflict Dialog -->
{#if showConflictDialog}
    <SyncConflictDialog
        conflicts={pendingConflicts}
        {isDesktop}
        on:resolve={handleConflictResolution}
        on:close={handleConflictDialogClose}
    />
{/if}

<style>
    :global(body) {
        margin: 0;
        padding: 0;
    }
</style>
