<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { templates } from "../stores/templates";
    import { subscriptions } from "../stores/ical";
    import { activities } from "../stores/activities";
    import { bibleVerse } from "../stores/bibleVerse";
    import { exportSettings, FONT_FAMILIES } from "../stores/exportSettings";
    import type {
        ActivityTemplate,
        ICalSubscription,
        CalendarItem,
    } from "../types/index";
    import { getWeekNumber } from "../utils/date";
    import IconButton from "./IconButton.svelte";
    import Button from "./Button.svelte";
    import DefaultBackgroundSelector from "./DefaultBackgroundSelector.svelte";
    import SwipeableSheet from "./SwipeableSheet.svelte";
    import SettingIcon from "./SettingIcon.svelte";
    import RangeSlider from "./RangeSlider.svelte";
    import {
        refreshStatus,
        refreshProgress,
        refreshSummary,
    } from "../stores/refreshStatus";
    import SyncConflictDialog from "./SyncConflictDialog.svelte";
    import type { SyncConflict, ConflictResolution } from "../types/index";

    export let isDesktop = false;

    const dispatch = createEventDispatcher();
    const APP_VERSION = "1.0.0";

    type SettingType = "templates" | "ical" | "export" | "bibleVerse" | "about";

    interface SettingItem {
        id: SettingType;
        label: string;
        icon: string;
        description: string;
    }

    const settingItems: SettingItem[] = [
        {
            id: "templates",
            label: "Activity Templates",
            icon: "star",
            description: `${$templates.length} template${$templates.length !== 1 ? "s" : ""}`,
        },
        {
            id: "ical",
            label: "Calendar Subscriptions",
            icon: "link",
            description: `${$subscriptions.length} subscription${$subscriptions.length !== 1 ? "s" : ""}`,
        },
        {
            id: "export",
            label: "Export Settings",
            icon: "palette",
            description: "Customize export appearance",
        },
        {
            id: "bibleVerse",
            label: "Bible Verse of the Day",
            icon: "book",
            description: $bibleVerse.enabled ? "Enabled" : "Disabled",
        },
        {
            id: "about",
            label: "About",
            icon: "info",
            description: `Version ${APP_VERSION}`,
        },
    ];

    // Mobile: currently selected setting (null = showing list)
    let selectedSetting: SettingType | null = isDesktop ? "export" : null;

    // Template state
    let showNewTemplate = false;
    let newTemplate = {
        name: "",
        startTime: "09:00",
        endTime: "10:00",
    };

    // iCal state
    let showNewSubscription = false;
    let newSubscription = {
        url: "",
        name: "",
    };
    let isLoading = false;
    let error = "";
    // Global loader overlay state (derived from isLoading)
    let showGlobalLoader = false;
    $: showGlobalLoader = isLoading;

    // Conflict dialog state
    let showConflictDialog = false;
    let pendingConflicts: SyncConflict[] = [];
    let pendingDiff: {
        added: CalendarItem[];
        updated: CalendarItem[];
        removed: CalendarItem[];
        conflicts: CalendarItem[];
        subscriptionId: string;
        subscriptionName: string;
    } | null = null;

    function handleConflictResolution(event: CustomEvent<ConflictResolution>) {
        const resolution = event.detail;
        if (!pendingDiff) {
            showConflictDialog = false;
            return;
        }

        // Apply according to resolution
        const { added, updated, removed, conflicts, subscriptionId } =
            pendingDiff;

        // If keep-local: for conflict items, keep existing local (do not overwrite)
        // If use-synced: use incoming updated versions (already merged)
        // We already prepared updated items with preserved localOverrides; so both choices are safe.
        // Difference: keep-local skips replacing those conflict items.
        const updatesToApply =
            resolution === "keep-local"
                ? updated.filter((u) => !conflicts.find((c) => c.id === u.id))
                : updated;

        // Bulk apply resolved changes in one pass
        activities.bulkApplySubscriptionChanges({
            added,
            updated: updatesToApply,
            removed,
        });

        // Mark subscription refreshed
        const subscription = $subscriptions.find(
            (s) => s.id === subscriptionId,
        );
        if (subscription) {
            subscriptions.updateSubscription({
                ...subscription,
                lastFetched: Date.now(),
            });
        }

        showConflictDialog = false;
        pendingConflicts = [];
        pendingDiff = null;
        // Move to updating phase; global completion handled externally
        refreshStatus.setPhase("updating");
    }

    function handleResetExportSettings() {
        if (confirm("Reset all export settings to default?")) {
            exportSettings.reset();
        }
    }

    // Template operations
    function handleAddTemplate() {
        if (!newTemplate.name.trim()) return;

        const template: ActivityTemplate = {
            id: `template-${Date.now()}`,
            name: newTemplate.name,
            startTime: newTemplate.startTime,
            endTime: newTemplate.endTime,
            createdAt: Date.now(),
        };

        templates.addTemplate(template);
        showNewTemplate = false;
        newTemplate = { name: "", startTime: "09:00", endTime: "10:00" };
    }

    function handleDeleteTemplate(id: string) {
        if (confirm("Delete this template?")) {
            templates.removeTemplate(id);
        }
    }

    function handleCancelNewTemplate() {
        showNewTemplate = false;
        newTemplate = { name: "", startTime: "09:00", endTime: "10:00" };
    }

    // iCal operations
    async function handleAddSubscription() {
        if (!newSubscription.url.trim()) return;

        error = "";
        isLoading = true;

        try {
            const response = await fetch(newSubscription.url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const subscription: ICalSubscription = {
                id: `sub-${Date.now()}`,
                url: newSubscription.url,
                name: newSubscription.name || "iCal Feed",
                lastFetched: Date.now(),
                enabled: true,
            };

            subscriptions.addSubscription(subscription);
            showNewSubscription = false;
            newSubscription = { url: "", name: "" };
        } catch (e) {
            error = `Failed to add subscription: ${e instanceof Error ? e.message : String(e)}`;
        } finally {
            isLoading = false;
        }
    }

    async function handleRefresh(subscriptionId: string) {
        error = "";
        isLoading = true;

        try {
            const subscription = $subscriptions.find(
                (s) => s.id === subscriptionId,
            );
            if (!subscription) {
                isLoading = false;
                return;
            }

            // Begin tracking this subscription
            refreshStatus.startSubscription({
                id: subscription.id,
                name: subscription.name,
            });

            // FETCH
            refreshStatus.setPhase("fetching");
            const response = await fetch(subscription.url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const rawText = await response.text();

            // PARSE
            refreshStatus.setPhase("parsing");
            const incomingItems = parseICalToCalendarItems(
                rawText,
                subscriptionId,
            );
            refreshStatus.incrementCounters({ fetched: incomingItems.length });

            // DIFF
            refreshStatus.setPhase("diffing");
            const existing = $activities.filter(
                (a) => a.source === "ical" && a.sourceId === subscriptionId,
            );
            const existingMap = new Map(existing.map((e) => [e.id, e]));
            const incomingMap = new Map(incomingItems.map((i) => [i.id, i]));

            const added: CalendarItem[] = [];
            const updated: CalendarItem[] = [];
            const removed: CalendarItem[] = [];
            let conflicts = 0;

            // Added or updated
            for (const item of incomingItems) {
                const prev = existingMap.get(item.id);
                if (!prev) {
                    added.push(item);
                } else {
                    // Determine if remote fields changed (excluding local overrides)
                    const changed =
                        prev.dtstart !== item.dtstart ||
                        prev.dtend !== item.dtend ||
                        prev.summary !== item.summary ||
                        prev.description !== item.description;

                    if (changed) {
                        // Preserve local overrides and timestamps:
                        const merged: CalendarItem = {
                            ...item,
                            createdAt: prev.createdAt,
                            lastModified: changed
                                ? Date.now()
                                : prev.lastModified,
                            localOverrides: prev.localOverrides,
                            color: prev.color,
                        };

                        // If user had local overrides, count as conflict
                        if (
                            prev.localOverrides &&
                            Object.keys(prev.localOverrides).length > 0
                        ) {
                            conflicts += 1;
                        }
                        updated.push(merged);
                    }
                }
            }

            // Removed
            for (const prev of existing) {
                if (!incomingMap.has(prev.id)) {
                    removed.push(prev);
                }
            }

            refreshStatus.incrementCounters({
                added: added.length,
                updated: updated.length,
                removed: removed.length,
                conflicts,
            });

            // CONFLICT CHECK + Dialog integration
            const conflictItems = updated.filter(
                (u) =>
                    u.localOverrides &&
                    Object.keys(u.localOverrides).length > 0,
            );

            refreshStatus.setPhase("conflict-check");

            if (conflictItems.length > 0) {
                // Build SyncConflict objects for dialog
                pendingConflicts = conflictItems.map((ci) => {
                    return {
                        localItem: existingMap.get(ci.id) || ci,
                        incomingItem: ci,
                        subscriptionName: subscription.name,
                    };
                });

                pendingDiff = {
                    added,
                    updated,
                    removed,
                    conflicts: conflictItems,
                    subscriptionId: subscription.id,
                    subscriptionName: subscription.name,
                };

                showConflictDialog = true;
                // Defer application until user resolves
                return;
            }

            // APPLY
            refreshStatus.setPhase("updating");
            // Bulk apply to avoid per-item overhead and premature override tracking
            activities.bulkApplySubscriptionChanges({
                added,
                updated,
                removed,
            });
            // Update subscription metadata
            const updatedSubscription: ICalSubscription = {
                ...subscription,
                lastFetched: Date.now(),
            };
            subscriptions.updateSubscription(updatedSubscription);
            // Record results
            refreshStatus.recordSubscriptionResult({
                id: subscription.id,
                name: subscription.name,
                added: added.length,
                updated: updated.length,
                removed: removed.length,
                conflicts,
                fetched: incomingItems.length,
            });
            // Do NOT set completed here; global refresh flow will call finish().
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            error = `Failed to refresh: ${message}`;
            refreshStatus.fail(e);
        } finally {
            isLoading = false;
        }
    }

    function handleToggleSubscription(id: string, enabled: boolean) {
        const subscription = $subscriptions.find((s) => s.id === id);
        if (!subscription) return;
        const updated: ICalSubscription = {
            ...subscription,
            enabled,
        };
        subscriptions.updateSubscription(updated);
    }

    function handleDeleteSubscription(id: string) {
        if (confirm("Delete this subscription?")) {
            const itemsToRemove = $activities.filter(
                (a) => a.sourceId === id && a.source === "ical",
            );
            for (const item of itemsToRemove) {
                activities.removeActivity(item.id);
            }
            subscriptions.removeSubscription(id);
        }
    }

    async function handleRefreshAll() {
        error = "";
        const enabledSubs = $subscriptions.filter((s) => s.enabled);
        refreshStatus.start(enabledSubs.length);
        isLoading = true;

        try {
            for (const sub of enabledSubs) {
                await handleRefresh(sub.id);
                // After each individual refresh, if overall phase was set to completed by single call, revert to idle/fetching for next iteration
                if (refreshStatus) {
                    // Prepare for next subscription if not last
                    const nextIndex = enabledSubs.indexOf(sub) + 1;
                    if (nextIndex < enabledSubs.length) {
                        refreshStatus.setPhase("fetching");
                    }
                }
            }
            refreshStatus.finish();
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            error = `Global refresh failed: ${message}`;
            refreshStatus.fail(e);
        } finally {
            isLoading = false;
        }
    }

    function handleClose() {
        dispatch("close");
    }

    function selectSetting(settingId: SettingType) {
        selectedSetting = settingId;
    }

    function backToList() {
        if (!isDesktop) {
            selectedSetting = null;
        }
    }

    function parseICalToCalendarItems(
        iCalText: string,
        subscriptionId: string,
    ): CalendarItem[] {
        const items: CalendarItem[] = [];
        const lines = iCalText.split("\n");

        let currentEvent: any = null;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // Handle line folding (continuation lines)
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
                // Only add if it has required fields
                if (currentEvent.summary && currentEvent.dtstart) {
                    const item = buildCalendarItem(currentEvent);
                    if (item) {
                        items.push(item);
                    }
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

            // Parse date/time information
            const isAllDay = !dtstart.includes("T");
            const startDate = extractDate(dtstart);
            const endDate = extractDate(dtend);
            const startTime = isAllDay ? "09:00" : extractTime(dtstart);
            const endTime = isAllDay ? "17:00" : extractTime(dtend);

            if (!startDate) return null;

            // Convert to Date object to calculate week and day
            const dateObj = new Date(
                parseInt(startDate.substring(0, 4)),
                parseInt(startDate.substring(4, 6)) - 1,
                parseInt(startDate.substring(6, 8)),
            );

            const day = (dateObj.getDay() + 6) % 7; // 0 = Monday
            const week = getWeekNumber(dateObj);
            const year = dateObj.getFullYear();

            const id = event.uid
                ? `${event.sourceId}-${event.uid.replace(/[^a-zA-Z0-9-]/g, "")}`
                : `${event.sourceId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const now = Date.now();

            const item: CalendarItem = {
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

            return item;
        } catch (err) {
            console.error("Error building calendar item:", err);
            return null;
        }
    }

    function extractDate(iCalDateTime: string): string {
        // Extract YYYYMMDD from iCal datetime
        if (iCalDateTime.includes("T")) {
            return iCalDateTime.split("T")[0];
        }
        return iCalDateTime;
    }

    function extractTime(iCalDateTime: string): string {
        // Extract HH:mm from iCal datetime
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
        // Decode iCal encoded text
        return text
            .replace(/\\n/g, "\n")
            .replace(/\\,/g, ",")
            .replace(/\\;/g, ";")
            .replace(/\\\\/g, "\\");
    }

    function itemCount(subscriptionId: string): number {
        return $activities.filter(
            (a) => a.sourceId === subscriptionId && a.source === "ical",
        ).length;
    }

    // Reactive: Update setting items descriptions
    $: settingItems[0].description = `${$templates.length} template${$templates.length !== 1 ? "s" : ""}`;
    $: settingItems[1].description = `${$subscriptions.length} subscription${$subscriptions.length !== 1 ? "s" : ""}`;
    $: settingItems[3].description = $bibleVerse.enabled
        ? "Enabled"
        : "Disabled";
</script>

<SwipeableSheet {isDesktop} desktopMaxWidth="56rem" on:close={handleClose}>
    <div
        class={`relative flex flex-col ${isDesktop ? "md:h-[80vh]" : "max-h-[90vh]"}`}
    >
        {#if showGlobalLoader}
            <!-- Loader Overlay -->
            <div
                class="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            >
                <div
                    class="flex flex-col items-center gap-4 w-[220px] text-center"
                >
                    <!-- Spinner -->
                    <div class="relative w-14 h-14">
                        <div
                            class="absolute inset-0 rounded-full border-4 border-primary/30"
                        ></div>
                        <div
                            class="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
                        ></div>
                    </div>

                    <!-- Progress Bar -->
                    <div class="w-full">
                        <div
                            class="w-full h-2 rounded-full bg-primary/20 overflow-hidden"
                        >
                            <div
                                class="h-full bg-primary transition-all duration-300 ease-out"
                                style="width: {($refreshProgress * 100).toFixed(
                                    1,
                                )}%;"
                            ></div>
                        </div>
                    </div>

                    <!-- Summary Text -->
                    <p class="text-xs font-medium text-muted-foreground mt-1">
                        {$refreshSummary}
                    </p>

                    <!-- Metrics (optional compact view) -->
                    {#if $refreshStatus.phase !== "error" && $refreshStatus.phase !== "cancelled"}
                        <p class="text-[10px] text-muted-foreground">
                            Added {$refreshStatus.addedCount} • Updated {$refreshStatus.updatedCount}
                            • Removed {$refreshStatus.removedCount} • Conflicts {$refreshStatus.conflictCount}
                        </p>
                    {/if}

                    <!-- Error Message -->
                    {#if $refreshStatus.phase === "error"}
                        <p class="text-[10px] text-destructive font-medium">
                            {$refreshStatus.errorMessage}
                        </p>
                    {/if}
                </div>
            </div>
        {/if}
        {#if showConflictDialog}
            <SyncConflictDialog
                conflicts={pendingConflicts}
                {isDesktop}
                on:resolve={handleConflictResolution}
                on:close={() => {
                    // If closed without resolution, default to keep-local behavior
                    const fakeEvent = new CustomEvent<ConflictResolution>(
                        "resolve",
                        {
                            detail: "keep-local",
                        },
                    );
                    handleConflictResolution(fakeEvent);
                }}
            />
        {/if}
        <!-- Header (Always on top) -->
        <div
            class={`${isDesktop ? "border-b border-border min-h-[70px]" : ""} px-3 py-3 flex items-center justify-center relative shrink-0`}
        >
            <!-- Mobile: Back button when viewing details (left position) -->
            {#if !isDesktop && selectedSetting}
                <div class="absolute left-3 top-3">
                    <Button
                        on:click={backToList}
                        variants="secondary"
                        class="bg-muted hover:bg-muted/80 flex items-center gap-2"
                        aria-label="Back to settings"
                    >
                        <svg
                            class="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                        Back
                    </Button>
                </div>
            {/if}

            <!-- Centered title -->
            <h3 class="text-lg pt-2 font-semibold text-foreground">Settings</h3>

            <!-- Close button (right position) -->
            <div class="absolute right-3 top-3">
                <IconButton
                    variant="secondary"
                    size="lg"
                    ariaLabel="Close settings"
                    on:click={handleClose}
                >
                    <svg
                        class="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </IconButton>
            </div>
        </div>

        <!-- Content Container -->
        <div class="flex flex-1 overflow-hidden sheet-content">
            <!-- Mobile: Show list or details based on selection -->
            {#if !isDesktop}
                {#if selectedSetting === null}
                    <!-- Mobile: Settings Menu List -->
                    <div class="w-full overflow-y-auto p-3">
                        <div class="space-y-2">
                            {#each settingItems as item}
                                <button
                                    on:click={() => selectSetting(item.id)}
                                    style="border-radius: 28px;"
                                    class="w-full p-4 bg-muted/50 border border-border hover:border-primary transition-colors text-left flex items-center justify-between gap-3"
                                >
                                    <div class="shrink-0 self-center">
                                        <SettingIcon icon={item.icon} />
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div
                                            class="font-semibold text-foreground mb-1"
                                        >
                                            {item.label}
                                        </div>
                                        <div
                                            class="text-xs text-muted-foreground"
                                        >
                                            {item.description}
                                        </div>
                                    </div>
                                    <svg
                                        class="w-5 h-5 text-muted-foreground shrink-0"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </button>
                            {/each}
                        </div>
                    </div>
                {:else}
                    <!-- Mobile: Setting Details -->
                    <div
                        class="w-full overflow-y-auto p-3"
                        style={"border-radius: 0 0 32px 32px"}
                    >
                        {#if error}
                            <div
                                class="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg"
                            >
                                <p class="text-sm text-destructive">{error}</p>
                            </div>
                        {/if}

                        {#if selectedSetting === "templates"}
                            <!-- Templates Details -->
                            {#if $templates.length === 0 && !showNewTemplate}
                                <div class="text-center py-8">
                                    <p class="text-muted-foreground text-sm">
                                        No templates yet
                                    </p>
                                    <p
                                        class="text-muted-foreground text-xs mt-1"
                                    >
                                        Create one by adding an activity with
                                        "Save as template"
                                    </p>
                                </div>
                            {:else if !showNewTemplate}
                                <div class="space-y-2">
                                    {#each $templates as template}
                                        <div
                                            class="p-3 bg-muted rounded-lg border border-border flex items-center justify-between gap-2"
                                        >
                                            <div class="flex-1 min-w-0">
                                                <div
                                                    class="font-semibold text-foreground text-sm truncate"
                                                >
                                                    {template.name}
                                                </div>
                                                <div
                                                    class="text-xs text-muted-foreground"
                                                >
                                                    {template.startTime} -
                                                    {template.endTime}
                                                </div>
                                            </div>
                                            <button
                                                on:click={() =>
                                                    handleDeleteTemplate(
                                                        template.id,
                                                    )}
                                                class="text-destructive hover:bg-destructive/10 px-2 py-1 rounded transition-colors text-sm shrink-0"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    {/each}
                                </div>
                            {/if}

                            <!-- Add Template Form -->
                            {#if showNewTemplate}
                                <div
                                    class="p-3 bg-muted w-full rounded-3xl border border-border space-y-3"
                                >
                                    <input
                                        type="text"
                                        bind:value={newTemplate.name}
                                        placeholder="Template name"
                                        class="w-full px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm"
                                    />
                                    <div class="grid grid-cols-2 gap-1">
                                        <input
                                            type="time"
                                            bind:value={newTemplate.startTime}
                                            class="px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm"
                                        />
                                        <input
                                            type="time"
                                            bind:value={newTemplate.endTime}
                                            class="px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm"
                                        />
                                    </div>
                                    <div class="flex gap-2">
                                        <button
                                            on:click={handleAddTemplate}
                                            disabled={!newTemplate.name.trim()}
                                            class="flex-1 px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-colors"
                                        >
                                            Save
                                        </button>
                                        <button
                                            on:click={handleCancelNewTemplate}
                                            class="flex-1 px-4 py-2 text-sm font-semibold text-foreground hover:bg-background rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            {:else}
                                <button
                                    on:click={() => (showNewTemplate = true)}
                                    class="w-full mt-4 px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted rounded-lg transition-colors border border-input"
                                >
                                    + New Template
                                </button>
                            {/if}
                        {:else if selectedSetting === "ical"}
                            <!-- iCal Details -->
                            {#if $subscriptions.length === 0 && !showNewSubscription}
                                <div class="text-center py-8">
                                    <p class="text-muted-foreground text-sm">
                                        No iCal subscriptions yet
                                    </p>
                                    <p
                                        class="text-muted-foreground text-xs mt-1"
                                    >
                                        Add a calendar feed by entering an iCal
                                        URL
                                    </p>
                                </div>
                            {:else if !showNewSubscription}
                                <div class="space-y-2">
                                    {#each $subscriptions as subscription}
                                        <div
                                            class="p-3 bg-muted rounded-lg border border-border space-y-2"
                                        >
                                            <div
                                                class="flex items-center justify-between"
                                            >
                                                <div class="flex-1">
                                                    <div
                                                        class="font-semibold text-foreground text-sm"
                                                    >
                                                        {subscription.name}
                                                    </div>
                                                    <div
                                                        class="text-xs text-muted-foreground truncate"
                                                    >
                                                        {subscription.url}
                                                    </div>
                                                </div>
                                                <label
                                                    class="flex items-center gap-2 cursor-pointer shrink-0"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={subscription.enabled}
                                                        on:change={(e) =>
                                                            handleToggleSubscription(
                                                                subscription.id,
                                                                e.currentTarget
                                                                    .checked,
                                                            )}
                                                        class="rounded border-input"
                                                    />
                                                </label>
                                            </div>

                                            {#if subscription.lastFetched}
                                                <div
                                                    class="text-xs text-muted-foreground"
                                                >
                                                    Last fetched: {new Date(
                                                        subscription.lastFetched,
                                                    ).toLocaleString()}
                                                </div>
                                            {/if}

                                            {#if itemCount(subscription.id) > 0}
                                                <div
                                                    class="text-xs text-muted-foreground"
                                                >
                                                    {itemCount(subscription.id)}
                                                    event{itemCount(
                                                        subscription.id,
                                                    ) !== 1
                                                        ? "s"
                                                        : ""}
                                                </div>
                                            {/if}

                                            <div class="flex gap-2">
                                                <button
                                                    on:click={() =>
                                                        handleRefresh(
                                                            subscription.id,
                                                        )}
                                                    disabled={isLoading}
                                                    class="flex-1 px-3 py-1 text-xs font-semibold text-foreground hover:bg-background rounded transition-colors disabled:opacity-50 disabled:pointer-events-none"
                                                >
                                                    Refresh
                                                </button>
                                                <button
                                                    on:click={() =>
                                                        handleDeleteSubscription(
                                                            subscription.id,
                                                        )}
                                                    class="px-3 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            {/if}

                            <!-- Add Subscription Form -->
                            {#if showNewSubscription}
                                <div
                                    class="p-3 bg-muted rounded-lg border border-border space-y-3"
                                >
                                    <input
                                        type="url"
                                        bind:value={newSubscription.url}
                                        placeholder="iCal URL"
                                        class="w-full px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm"
                                    />
                                    <input
                                        type="text"
                                        bind:value={newSubscription.name}
                                        placeholder="Calendar name (optional)"
                                        class="w-full px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm"
                                    />
                                    <div class="flex gap-2">
                                        <Button
                                            variant="default"
                                            class="flex-1"
                                            disabled={!newSubscription.url.trim() ||
                                                isLoading}
                                            on:click={handleAddSubscription}
                                        >
                                            {isLoading ? "Adding..." : "Add"}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            class="flex-1"
                                            on:click={() => {
                                                showNewSubscription = false;
                                                newSubscription = {
                                                    url: "",
                                                    name: "",
                                                };
                                                error = "";
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            {:else}
                                <Button
                                    variant="secondary"
                                    class="w-full mt-4"
                                    on:click={() =>
                                        (showNewSubscription = true)}
                                >
                                    + Add Subscription
                                </Button>
                            {/if}

                            <!-- Refresh All Button -->
                            {#if $subscriptions.length > 0 && !showNewSubscription}
                                <Button
                                    variant="secondary"
                                    class="w-full mt-4"
                                    disabled={isLoading}
                                    on:click={handleRefreshAll}
                                >
                                    {isLoading
                                        ? "Refreshing..."
                                        : "Refresh All"}
                                </Button>
                            {/if}
                        {:else if selectedSetting === "bibleVerse"}
                            <!-- Bible Verse Settings -->
                            <div class="space-y-4">
                                <h3
                                    class="text-lg font-semibold text-foreground mb-4"
                                >
                                    Bible Verse of the Day
                                </h3>

                                <div
                                    class="p-4 bg-muted rounded-lg border border-border space-y-3"
                                >
                                    <div class="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="enableBibleVerse"
                                            checked={$bibleVerse.enabled}
                                            on:change={(e) =>
                                                bibleVerse.toggleEnabled(
                                                    e.currentTarget.checked,
                                                )}
                                            class="w-4 h-4 rounded border-input"
                                        />
                                        <label
                                            for="enableBibleVerse"
                                            class="text-sm font-medium text-foreground cursor-pointer"
                                        >
                                            Show Bible Verse on Export
                                        </label>
                                    </div>

                                    {#if $bibleVerse.enabled}
                                        <div
                                            class="mt-4 p-3 bg-background rounded border border-input space-y-2"
                                        >
                                            <p
                                                class="text-sm italic text-foreground"
                                            >
                                                "{$bibleVerse.currentVerse
                                                    .text}"
                                            </p>
                                            <p
                                                class="text-xs text-muted-foreground text-right"
                                            >
                                                – {$bibleVerse.currentVerse
                                                    .reference}
                                            </p>
                                        </div>

                                        <Button
                                            variant="secondary"
                                            class="w-full"
                                            on:click={() =>
                                                bibleVerse.refreshVerse()}
                                        >
                                            <svg
                                                class="w-4 h-4 inline-block mr-1"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                ><path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                /></svg
                                            >
                                            Get New Verse
                                        </Button>
                                    {/if}
                                </div>
                            </div>
                        {:else if selectedSetting === "about"}
                            <!-- About Section -->
                            <div class="space-y-6">
                                <h3
                                    class="text-lg font-semibold text-foreground mb-4"
                                >
                                    About Wochenschau
                                </h3>

                                <!-- App Info -->
                                <div
                                    class="p-4 bg-muted rounded-lg border border-border space-y-3"
                                >
                                    <div>
                                        <p
                                            class="text-xs text-muted-foreground"
                                        >
                                            Version
                                        </p>
                                        <p
                                            class="text-sm font-semibold text-foreground"
                                        >
                                            {APP_VERSION}
                                        </p>
                                    </div>
                                    <div>
                                        <p
                                            class="text-xs text-muted-foreground"
                                        >
                                            Created in the heart of
                                        </p>
                                        <p
                                            class="text-sm font-semibold text-foreground"
                                        >
                                            Kaiserstuhl 🍇
                                        </p>
                                    </div>
                                </div>

                                <!-- Hidden Gems -->
                                <div>
                                    <p
                                        class="text-sm font-semibold text-foreground mb-3"
                                    >
                                        🎁 Hidden Gems
                                    </p>
                                    <div class="space-y-2">
                                        <div
                                            class="p-3 bg-background rounded border border-border text-sm"
                                        >
                                            <p class="text-foreground mb-1">
                                                <span class="font-semibold"
                                                    >Swipe to Navigate</span
                                                >
                                            </p>
                                            <p
                                                class="text-xs text-muted-foreground"
                                            >
                                                Swipe left or right on your
                                                calendar to switch weeks
                                            </p>
                                        </div>
                                        <div
                                            class="p-3 bg-background rounded border border-border text-sm"
                                        >
                                            <p class="text-foreground mb-1">
                                                <span class="font-semibold"
                                                    >Export & Share</span
                                                >
                                            </p>
                                            <p
                                                class="text-xs text-muted-foreground"
                                            >
                                                Export your week as a beautiful
                                                image and share it with friends
                                            </p>
                                        </div>
                                        <div
                                            class="p-3 bg-background rounded border border-border text-sm"
                                        >
                                            <p class="text-foreground mb-1">
                                                <span class="font-semibold"
                                                    >Calendar Sync</span
                                                >
                                            </p>
                                            <p
                                                class="text-xs text-muted-foreground"
                                            >
                                                Subscribe to iCal calendars to
                                                automatically import events
                                            </p>
                                        </div>
                                        <div
                                            class="p-3 bg-background rounded border border-border text-sm"
                                        >
                                            <p class="text-foreground mb-1">
                                                <span class="font-semibold"
                                                    >Daily Inspiration</span
                                                >
                                            </p>
                                            <p
                                                class="text-xs text-muted-foreground"
                                            >
                                                Enable Bible verses of the day
                                                for daily inspiration
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        {:else if selectedSetting === "export"}
                            <h3
                                class="text-lg font-semibold text-foreground mb-4"
                            >
                                Export Settings
                            </h3>
                            <div class="space-y-6">
                                <!-- Typography Section -->
                                <div class="space-y-4">
                                    <h4
                                        class="text-sm font-semibold text-foreground"
                                    >
                                        Typography
                                    </h4>

                                    <!-- Title -->
                                    <div>
                                        <label
                                            for="title-export"
                                            class="block text-xs font-medium text-muted-foreground mb-2"
                                        >
                                            Title/Headline
                                        </label>
                                        <input
                                            id="title-export"
                                            type="text"
                                            bind:value={$exportSettings.title}
                                            class="w-full px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm"
                                            placeholder="Wochenschau"
                                        />
                                    </div>

                                    <!-- Title Font Size -->
                                    <div>
                                        <label
                                            for="title-font-size-export"
                                            class="block text-xs font-medium text-muted-foreground mb-2"
                                        >
                                            Title Font Size: {$exportSettings.titleFontSize}px
                                        </label>
                                        <RangeSlider
                                            id="title-font-size-export"
                                            min={24}
                                            max={72}
                                            step={2}
                                            bind:value={
                                                $exportSettings.titleFontSize
                                            }
                                        />
                                        <label
                                            for="title-opacity-export"
                                            class="block text-xs font-medium text-muted-foreground mb-2 mt-4"
                                        >
                                            Title Opacity: {$exportSettings.titleOpacity}%
                                        </label>
                                        <RangeSlider
                                            id="title-opacity-export"
                                            min={10}
                                            max={100}
                                            step={5}
                                            bind:value={
                                                $exportSettings.titleOpacity
                                            }
                                        />
                                    </div>

                                    <!-- Show Week Number -->
                                    <div
                                        class="flex items-center justify-between"
                                    >
                                        <label
                                            for="show-week-number-export"
                                            class="text-xs font-medium text-muted-foreground"
                                        >
                                            Show Week Number (KW)
                                        </label>
                                        <input
                                            id="show-week-number-export"
                                            type="checkbox"
                                            bind:checked={
                                                $exportSettings.showWeekNumber
                                            }
                                            class="w-4 h-4"
                                        />
                                    </div>

                                    <!-- Header Font Family -->
                                    <div>
                                        <label
                                            for="header-font-export"
                                            class="block text-xs font-medium text-muted-foreground mb-2"
                                        >
                                            Header Font (Wochenschau)
                                        </label>
                                        <select
                                            id="header-font-export"
                                            bind:value={
                                                $exportSettings.headerFontFamily
                                            }
                                            class="w-full px-3 py-2 bg-background border border-input rounded text-foreground text-sm"
                                            style="font-family: {$exportSettings.headerFontFamily};"
                                        >
                                            {#each FONT_FAMILIES as font}
                                                <option
                                                    value={font.value}
                                                    style="font-family: {font.value};"
                                                    >{font.name}</option
                                                >
                                            {/each}
                                        </select>
                                    </div>

                                    <!-- Body Font Family -->
                                    <div>
                                        <label
                                            for="body-font-export"
                                            class="block text-xs font-medium text-muted-foreground mb-2"
                                        >
                                            Body Font (Activities)
                                        </label>
                                        <select
                                            id="body-font-export"
                                            bind:value={
                                                $exportSettings.bodyFontFamily
                                            }
                                            class="w-full px-3 py-2 bg-background border border-input rounded text-foreground text-sm"
                                            style="font-family: {$exportSettings.bodyFontFamily};"
                                        >
                                            {#each FONT_FAMILIES as font}
                                                <option
                                                    value={font.value}
                                                    style="font-family: {font.value};"
                                                    >{font.name}</option
                                                >
                                            {/each}
                                        </select>
                                    </div>

                                    <!-- Text Color -->
                                    <div>
                                        <label
                                            for="text-color-export"
                                            class="block text-xs font-medium text-muted-foreground mb-2"
                                        >
                                            Text Color
                                        </label>
                                        <div class="flex gap-2">
                                            <input
                                                id="text-color-export"
                                                type="color"
                                                bind:value={
                                                    $exportSettings.textColor
                                                }
                                                class="w-12 h-10 rounded border border-input cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                bind:value={
                                                    $exportSettings.textColor
                                                }
                                                class="flex-1 px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm font-mono"
                                                placeholder="#000000"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <!-- Background Section -->
                                <div class="space-y-4">
                                    <h4
                                        class="text-sm font-semibold text-foreground"
                                    >
                                        Background
                                    </h4>

                                    <!-- Background Image Selector -->
                                    <DefaultBackgroundSelector />

                                    {#if $exportSettings.backgroundMode === "color"}
                                        <!-- Background Color -->
                                        <div>
                                            <label
                                                for="bg-color-list-mobile"
                                                class="block text-xs font-medium text-muted-foreground mb-2"
                                            >
                                                Background Color
                                            </label>
                                            <div class="flex gap-2">
                                                <input
                                                    id="bg-color-export-mobile"
                                                    type="color"
                                                    bind:value={
                                                        $exportSettings.backgroundColor
                                                    }
                                                    class="w-12 h-10 rounded border border-input cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    bind:value={
                                                        $exportSettings.backgroundColor
                                                    }
                                                    class="flex-1 px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm font-mono"
                                                    placeholder="#ffffff"
                                                />
                                            </div>
                                        </div>

                                        <!-- Background Opacity -->
                                        <div>
                                            <label
                                                for="bg-opacity-list-mobile"
                                                class="block text-xs font-medium text-muted-foreground mb-2"
                                            >
                                                Background Opacity: {$exportSettings.backgroundOpacity}%
                                            </label>
                                            <RangeSlider
                                                id="bg-opacity-list-mobile"
                                                min={0}
                                                max={100}
                                                bind:value={
                                                    $exportSettings.backgroundOpacity
                                                }
                                            />
                                        </div>
                                    {/if}
                                </div>

                                <!-- Styling Section -->
                                <div class="space-y-4">
                                    <h4
                                        class="text-sm font-semibold text-foreground"
                                    >
                                        Styling
                                    </h4>

                                    <!-- Accent Color -->
                                    <div>
                                        <label
                                            for="accent-color-export"
                                            class="block text-xs font-medium text-muted-foreground mb-2"
                                        >
                                            Accent Color (Borders)
                                        </label>
                                        <div class="flex gap-2">
                                            <input
                                                id="accent-color-export"
                                                type="color"
                                                bind:value={
                                                    $exportSettings.accentColor
                                                }
                                                class="w-12 h-10 rounded border border-input cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                bind:value={
                                                    $exportSettings.accentColor
                                                }
                                                class="flex-1 px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm font-mono"
                                                placeholder="#9333ea"
                                            />
                                        </div>
                                    </div>

                                    <!-- Border Radius -->
                                    <div>
                                        <label
                                            for="border-radius-export"
                                            class="block text-xs font-medium text-muted-foreground mb-2"
                                        >
                                            Border Radius: {$exportSettings.borderRadius}px
                                        </label>
                                        <RangeSlider
                                            id="border-radius-export"
                                            min={0}
                                            max={20}
                                            bind:value={
                                                $exportSettings.borderRadius
                                            }
                                        />
                                    </div>

                                    <!-- Show Borders -->
                                    <div class="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="showBorders"
                                            bind:checked={
                                                $exportSettings.showBorders
                                            }
                                            class="w-4 h-4 rounded border-input"
                                        />
                                        <label
                                            for="showBorders"
                                            class="text-xs font-medium text-muted-foreground cursor-pointer"
                                        >
                                            Show borders around activities
                                        </label>
                                    </div>
                                </div>

                                <!-- Week Container Styling Section -->
                                <div class="space-y-4">
                                    <h4
                                        class="text-sm font-semibold text-foreground"
                                    >
                                        Week Container
                                    </h4>

                                    <!-- Week Container Background Color -->
                                    <div>
                                        <label
                                            for="week-bg-color-export"
                                            class="block text-xs font-medium text-muted-foreground mb-2"
                                        >
                                            Background Color
                                        </label>
                                        <div class="flex gap-2">
                                            <input
                                                id="week-bg-color-export"
                                                type="color"
                                                bind:value={
                                                    $exportSettings.weekContainerBackgroundColor
                                                }
                                                class="w-12 h-10 rounded border border-input cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                bind:value={
                                                    $exportSettings.weekContainerBackgroundColor
                                                }
                                                class="flex-1 px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm font-mono"
                                                placeholder="rgba(255, 255, 255, 0.75)"
                                            />
                                        </div>
                                    </div>

                                    <!-- Week Container Background Opacity -->
                                    <div>
                                        <label
                                            for="week-bg-opacity-export"
                                            class="block text-xs font-medium text-muted-foreground mb-2"
                                        >
                                            Background Opacity: {$exportSettings.weekContainerBackgroundOpacity}%
                                        </label>
                                        <RangeSlider
                                            id="week-bg-opacity-export"
                                            min={0}
                                            max={100}
                                            bind:value={
                                                $exportSettings.weekContainerBackgroundOpacity
                                            }
                                        />
                                    </div>
                                </div>

                                <!-- Reset Button -->
                                <div class="pt-4 border-t border-border">
                                    <Button
                                        variant="secondary"
                                        on:click={handleResetExportSettings}
                                    >
                                        Reset to Defaults
                                    </Button>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/if}
            {:else}
                <!-- Desktop: Two Column Layout (left menu, right details) -->
                <!-- Left Column: Settings Menu -->
                <div
                    class="w-48 min-w-[300px] border-r border-border overflow-y-auto bg-muted/30 shrink-0"
                    style={"border-radius: 0 0 0 32px"}
                >
                    <div class="p-3 space-y-1">
                        {#each settingItems as item}
                            <button
                                on:click={() => selectSetting(item.id)}
                                style="border-radius: 28px;"
                                class={`w-full p-3 transition-colors text-left flex items-center justify-between gap-3 ${
                                    selectedSetting === item.id
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-muted/50"
                                }`}
                            >
                                <div class="shrink-0 self-center">
                                    <SettingIcon
                                        icon={item.icon}
                                        size="w-5 h-5"
                                    />
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="font-semibold text-sm">
                                        {item.label}
                                    </div>
                                    <div
                                        class={`text-xs ${
                                            selectedSetting === item.id
                                                ? "text-primary-foreground/70"
                                                : "text-muted-foreground"
                                        }`}
                                    >
                                        {item.description}
                                    </div>
                                </div>
                            </button>
                        {/each}
                    </div>
                </div>

                <!-- Right Column: Details -->
                <div class="flex-1 overflow-y-auto p-6">
                    {#if error}
                        <div
                            class="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg"
                        >
                            <p class="text-sm text-destructive">{error}</p>
                        </div>
                    {/if}

                    {#if selectedSetting === "templates"}
                        <h3 class="text-xl font-semibold text-foreground mb-4">
                            Activity Templates
                        </h3>

                        {#if $templates.length === 0 && !showNewTemplate}
                            <div class="text-center py-8">
                                <p class="text-muted-foreground text-sm">
                                    No templates yet
                                </p>
                                <p class="text-muted-foreground text-xs mt-1">
                                    Create one by adding an activity with "Save
                                    as template"
                                </p>
                            </div>
                        {:else if !showNewTemplate}
                            <div class="space-y-2 mb-4">
                                {#each $templates as template}
                                    <div
                                        class="p-3 bg-muted rounded-lg border border-border flex items-center justify-between gap-2"
                                    >
                                        <div class="flex-1 min-w-0">
                                            <div
                                                class="font-semibold text-foreground text-sm truncate"
                                            >
                                                {template.name}
                                            </div>
                                            <div
                                                class="text-xs text-muted-foreground"
                                            >
                                                {template.startTime} -
                                                {template.endTime}
                                            </div>
                                        </div>
                                        <button
                                            on:click={() =>
                                                handleDeleteTemplate(
                                                    template.id,
                                                )}
                                            class="text-destructive hover:bg-destructive/10 px-2 py-1 rounded transition-colors text-sm shrink-0"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                {/each}
                            </div>
                        {/if}

                        <!-- Add Template Form -->
                        {#if showNewTemplate}
                            <div
                                class="p-4 bg-muted rounded-lg border border-border space-y-3 max-w-md"
                            >
                                <h4 class="font-semibold text-sm">
                                    Create New Template
                                </h4>
                                <input
                                    type="text"
                                    bind:value={newTemplate.name}
                                    placeholder="Template name"
                                    class="w-full px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm"
                                />
                                <div class="grid grid-cols-2 gap-1">
                                    <input
                                        type="time"
                                        bind:value={newTemplate.startTime}
                                        class="px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm"
                                    />
                                    <input
                                        type="time"
                                        bind:value={newTemplate.endTime}
                                        class="px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm"
                                    />
                                </div>
                                <div class="flex gap-2">
                                    <button
                                        on:click={handleAddTemplate}
                                        disabled={!newTemplate.name.trim()}
                                        class="flex-1 px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-colors"
                                    >
                                        Save
                                    </button>
                                    <button
                                        on:click={handleCancelNewTemplate}
                                        class="flex-1 px-4 py-2 text-sm font-semibold text-foreground hover:bg-background rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        {:else}
                            <button
                                on:click={() => (showNewTemplate = true)}
                                class="px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted rounded-lg transition-colors border border-input"
                            >
                                + New Template
                            </button>
                        {/if}
                    {:else if selectedSetting === "ical"}
                        <h3 class="text-xl font-semibold text-foreground mb-4">
                            Calendar Subscriptions
                        </h3>

                        {#if $subscriptions.length === 0 && !showNewSubscription}
                            <div class="text-center py-8">
                                <p class="text-muted-foreground text-sm">
                                    No iCal subscriptions yet
                                </p>
                                <p class="text-muted-foreground text-xs mt-1">
                                    Add a calendar feed by entering an iCal URL
                                </p>
                            </div>
                        {:else if !showNewSubscription}
                            <div class="space-y-2 mb-4">
                                {#each $subscriptions as subscription}
                                    <div
                                        class="p-3 bg-muted rounded-lg border border-border space-y-2"
                                    >
                                        <div
                                            class="flex items-center justify-between"
                                        >
                                            <div class="flex-1">
                                                <div
                                                    class="font-semibold text-foreground text-sm"
                                                >
                                                    {subscription.name}
                                                </div>
                                                <div
                                                    class="text-xs text-muted-foreground truncate"
                                                >
                                                    {subscription.url}
                                                </div>
                                            </div>
                                            <label
                                                class="flex items-center gap-2 cursor-pointer shrink-0"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={subscription.enabled}
                                                    on:change={(e) =>
                                                        handleToggleSubscription(
                                                            subscription.id,
                                                            e.currentTarget
                                                                .checked,
                                                        )}
                                                    class="rounded border-input"
                                                />
                                            </label>
                                        </div>

                                        {#if subscription.lastFetched}
                                            <div
                                                class="text-xs text-muted-foreground"
                                            >
                                                Last fetched: {new Date(
                                                    subscription.lastFetched,
                                                ).toLocaleString()}
                                            </div>
                                        {/if}

                                        {#if itemCount(subscription.id) > 0}
                                            <div
                                                class="text-xs text-muted-foreground"
                                            >
                                                {itemCount(subscription.id)}
                                                event{itemCount(
                                                    subscription.id,
                                                ) !== 1
                                                    ? "s"
                                                    : ""}
                                            </div>
                                        {/if}

                                        <div class="flex gap-2">
                                            <button
                                                on:click={() =>
                                                    handleRefresh(
                                                        subscription.id,
                                                    )}
                                                disabled={isLoading}
                                                class="flex-1 px-3 py-1 text-xs font-semibold text-foreground hover:bg-background rounded transition-colors disabled:opacity-50 disabled:pointer-events-none"
                                            >
                                                Refresh
                                            </button>
                                            <button
                                                on:click={() =>
                                                    handleDeleteSubscription(
                                                        subscription.id,
                                                    )}
                                                class="px-3 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}

                        <!-- Add Subscription Form -->
                        {#if showNewSubscription}
                            <div
                                class="p-4 bg-muted rounded-lg border border-border space-y-3 max-w-md"
                            >
                                <h4 class="font-semibold text-sm">
                                    Add New Subscription
                                </h4>
                                <input
                                    type="url"
                                    bind:value={newSubscription.url}
                                    placeholder="iCal URL"
                                    class="w-full px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm"
                                />
                                <input
                                    type="text"
                                    bind:value={newSubscription.name}
                                    placeholder="Calendar name (optional)"
                                    class="w-full px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm"
                                />
                                <div class="flex gap-2">
                                    <Button
                                        variant="default"
                                        class="flex-1"
                                        disabled={!newSubscription.url.trim() ||
                                            isLoading}
                                        on:click={handleAddSubscription}
                                    >
                                        {isLoading ? "Adding..." : "Add"}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        class="flex-1"
                                        on:click={() => {
                                            showNewSubscription = false;
                                            newSubscription = {
                                                url: "",
                                                name: "",
                                            };
                                            error = "";
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        {:else}
                            <Button
                                variant="secondary"
                                class="mb-4"
                                on:click={() => (showNewSubscription = true)}
                            >
                                + Add Subscription
                            </Button>
                        {/if}

                        <!-- Refresh All Button -->
                        {#if $subscriptions.length > 0 && !showNewSubscription}
                            <Button
                                variant="secondary"
                                on:click={handleRefreshAll}
                                disabled={isLoading}
                            >
                                {isLoading ? "Refreshing..." : "Refresh All"}
                            </Button>
                        {/if}
                    {:else if selectedSetting === "about"}
                        <h3 class="text-xl font-semibold text-foreground mb-4">
                            About Wochenschau
                        </h3>

                        <div class="space-y-6">
                            <!-- App Info -->
                            <div
                                class="p-4 bg-muted rounded-lg border border-border space-y-3"
                            >
                                <div>
                                    <p class="text-xs text-muted-foreground">
                                        Version
                                    </p>
                                    <p
                                        class="text-sm font-semibold text-foreground"
                                    >
                                        {APP_VERSION}
                                    </p>
                                </div>
                                <div>
                                    <p class="text-xs text-muted-foreground">
                                        Created in the heart of
                                    </p>
                                    <p
                                        class="text-sm font-semibold text-foreground"
                                    >
                                        Kaiserstuhl 🍇
                                    </p>
                                </div>
                            </div>

                            <!-- Hidden Gems -->
                            <div>
                                <p
                                    class="text-sm font-semibold text-foreground mb-3"
                                >
                                    🎁 Hidden Gems
                                </p>
                                <div class="space-y-2">
                                    <div
                                        class="p-3 bg-background rounded border border-border text-sm"
                                    >
                                        <p class="text-foreground mb-1">
                                            <span class="font-semibold"
                                                >Swipe to Navigate</span
                                            >
                                        </p>
                                        <p
                                            class="text-xs text-muted-foreground"
                                        >
                                            Swipe left or right on your calendar
                                            to switch weeks
                                        </p>
                                    </div>
                                    <div
                                        class="p-3 bg-background rounded border border-border text-sm"
                                    >
                                        <p class="text-foreground mb-1">
                                            <span class="font-semibold"
                                                >Export & Share</span
                                            >
                                        </p>
                                        <p
                                            class="text-xs text-muted-foreground"
                                        >
                                            Export your week as a beautiful
                                            image and share it with friends
                                        </p>
                                    </div>
                                    <div
                                        class="p-3 bg-background rounded border border-border text-sm"
                                    >
                                        <p class="text-foreground mb-1">
                                            <span class="font-semibold"
                                                >Calendar Sync</span
                                            >
                                        </p>
                                        <p
                                            class="text-xs text-muted-foreground"
                                        >
                                            Subscribe to iCal calendars to
                                            automatically import events
                                        </p>
                                    </div>
                                    <div
                                        class="p-3 bg-background rounded border border-border text-sm"
                                    >
                                        <p class="text-foreground mb-1">
                                            <span class="font-semibold"
                                                >Daily Inspiration</span
                                            >
                                        </p>
                                        <p
                                            class="text-xs text-muted-foreground"
                                        >
                                            Enable Bible verses of the day for
                                            daily inspiration
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    {:else if selectedSetting === "export"}
                        <h3 class="text-xl font-semibold text-foreground mb-4">
                            Export Settings
                        </h3>

                        <div class="space-y-6">
                            <!-- Typography Section -->
                            <div class="space-y-4">
                                <h4
                                    class="text-sm font-semibold text-foreground"
                                >
                                    Typography
                                </h4>

                                <!-- Title -->
                                <div>
                                    <label
                                        for="title-export-desktop"
                                        class="block text-xs font-medium text-muted-foreground mb-2"
                                    >
                                        Title/Headline
                                    </label>
                                    <input
                                        id="title-export-desktop"
                                        type="text"
                                        bind:value={$exportSettings.title}
                                        class="w-full px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm"
                                        placeholder="Wochenschau"
                                    />
                                </div>

                                <!-- Title Font Size -->
                                <div>
                                    <label
                                        for="title-font-size-export-desktop"
                                        class="block text-xs font-medium text-muted-foreground mb-2"
                                    >
                                        Title Font Size: {$exportSettings.titleFontSize}px
                                    </label>
                                    <RangeSlider
                                        id="title-font-size-export-desktop"
                                        min={24}
                                        max={72}
                                        step={2}
                                        bind:value={
                                            $exportSettings.titleFontSize
                                        }
                                    />
                                    <label
                                        for="title-opacity-export-desktop"
                                        class="block text-xs font-medium text-muted-foreground mb-2 mt-4"
                                    >
                                        Title Opacity: {$exportSettings.titleOpacity}%
                                    </label>
                                    <RangeSlider
                                        id="title-opacity-export-desktop"
                                        min={10}
                                        max={100}
                                        step={5}
                                        bind:value={
                                            $exportSettings.titleOpacity
                                        }
                                    />
                                </div>

                                <!-- Show Week Number -->
                                <div class="flex items-center justify-between">
                                    <label
                                        for="show-week-number-export-desktop"
                                        class="text-xs font-medium text-muted-foreground"
                                    >
                                        Show Week Number (KW)
                                    </label>
                                    <input
                                        id="show-week-number-export-desktop"
                                        type="checkbox"
                                        bind:checked={
                                            $exportSettings.showWeekNumber
                                        }
                                        class="w-4 h-4"
                                    />
                                </div>

                                <!-- Header Font Family -->
                                <div>
                                    <label
                                        for="header-font-list"
                                        class="block text-xs font-medium text-muted-foreground mb-2"
                                    >
                                        Header Font (Wochenschau)
                                    </label>
                                    <select
                                        id="header-font-list"
                                        bind:value={
                                            $exportSettings.headerFontFamily
                                        }
                                        class="w-full px-3 py-2 bg-background border border-input rounded text-foreground text-sm"
                                        style="font-family: {$exportSettings.headerFontFamily};"
                                    >
                                        {#each FONT_FAMILIES as font}
                                            <option
                                                value={font.value}
                                                style="font-family: {font.value};"
                                                >{font.name}</option
                                            >
                                        {/each}
                                    </select>
                                </div>

                                <!-- Body Font Family -->
                                <div>
                                    <label
                                        for="body-font-list"
                                        class="block text-xs font-medium text-muted-foreground mb-2"
                                    >
                                        Body Font (Activities)
                                    </label>
                                    <select
                                        id="body-font-list"
                                        bind:value={
                                            $exportSettings.bodyFontFamily
                                        }
                                        class="w-full px-3 py-2 bg-background border border-input rounded text-foreground text-sm"
                                        style="font-family: {$exportSettings.bodyFontFamily};"
                                    >
                                        {#each FONT_FAMILIES as font}
                                            <option
                                                value={font.value}
                                                style="font-family: {font.value};"
                                                >{font.name}</option
                                            >
                                        {/each}
                                    </select>
                                </div>

                                <!-- Text Color -->
                                <div>
                                    <label
                                        for="text-color-list"
                                        class="block text-xs font-medium text-muted-foreground mb-2"
                                    >
                                        Text Color
                                    </label>
                                    <div class="flex gap-2">
                                        <input
                                            id="text-color-list"
                                            type="color"
                                            bind:value={
                                                $exportSettings.textColor
                                            }
                                            class="w-12 h-10 rounded border border-input cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            bind:value={
                                                $exportSettings.textColor
                                            }
                                            class="flex-1 px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm font-mono"
                                            placeholder="#000000"
                                        />
                                    </div>
                                </div>
                            </div>

                            <!-- Background Section -->
                            <div class="space-y-4">
                                <h4
                                    class="text-sm font-semibold text-foreground"
                                >
                                    Background
                                </h4>

                                <!-- Background Image Selector -->
                                <DefaultBackgroundSelector />

                                {#if $exportSettings.backgroundMode === "color"}
                                    <!-- Background Color -->
                                    <div>
                                        <label
                                            for="bg-color-list"
                                            class="block text-xs font-medium text-muted-foreground mb-2"
                                        >
                                            Background Color
                                        </label>
                                        <div class="flex gap-2">
                                            <input
                                                id="bg-color-export"
                                                type="color"
                                                bind:value={
                                                    $exportSettings.backgroundColor
                                                }
                                                class="w-12 h-10 rounded border border-input cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                bind:value={
                                                    $exportSettings.backgroundColor
                                                }
                                                class="flex-1 px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm font-mono"
                                                placeholder="#ffffff"
                                            />
                                        </div>
                                    </div>

                                    <!-- Background Opacity -->
                                    <div>
                                        <label
                                            for="bg-opacity-list"
                                            class="block text-xs font-medium text-muted-foreground mb-2"
                                        >
                                            Background Opacity: {$exportSettings.backgroundOpacity}%
                                        </label>
                                        <RangeSlider
                                            id="bg-opacity-list"
                                            min={0}
                                            max={100}
                                            bind:value={
                                                $exportSettings.backgroundOpacity
                                            }
                                        />
                                    </div>
                                {/if}
                            </div>

                            <!-- Styling Section -->
                            <div class="space-y-4">
                                <h4
                                    class="text-sm font-semibold text-foreground"
                                >
                                    Styling
                                </h4>

                                <!-- Accent Color -->
                                <div>
                                    <label
                                        for="accent-color-list"
                                        class="block text-xs font-medium text-muted-foreground mb-2"
                                    >
                                        Accent Color (Borders)
                                    </label>
                                    <div class="flex gap-2">
                                        <input
                                            id="accent-color-list"
                                            type="color"
                                            bind:value={
                                                $exportSettings.accentColor
                                            }
                                            class="w-12 h-10 rounded border border-input cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            bind:value={
                                                $exportSettings.accentColor
                                            }
                                            class="flex-1 px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm font-mono"
                                            placeholder="#9333ea"
                                        />
                                    </div>
                                </div>

                                <!-- Border Radius -->
                                <div>
                                    <label
                                        for="border-radius-list"
                                        class="block text-xs font-medium text-muted-foreground mb-2"
                                    >
                                        Border Radius: {$exportSettings.borderRadius}px
                                    </label>
                                    <RangeSlider
                                        id="border-radius-list"
                                        min={0}
                                        max={20}
                                        bind:value={
                                            $exportSettings.borderRadius
                                        }
                                    />
                                </div>

                                <!-- Show Borders -->
                                <div class="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="showBorders"
                                        bind:checked={
                                            $exportSettings.showBorders
                                        }
                                        class="w-4 h-4 rounded border-input"
                                    />
                                    <label
                                        for="showBorders"
                                        class="text-xs font-medium text-muted-foreground cursor-pointer"
                                    >
                                        Show borders around activities
                                    </label>
                                </div>
                            </div>

                            <!-- Week Container Styling Section -->
                            <div class="space-y-4">
                                <h4
                                    class="text-sm font-semibold text-foreground"
                                >
                                    Week Container
                                </h4>

                                <!-- Week Container Background Color -->
                                <div>
                                    <label
                                        for="week-bg-color-list"
                                        class="block text-xs font-medium text-muted-foreground mb-2"
                                    >
                                        Background Color
                                    </label>
                                    <div class="flex gap-2">
                                        <input
                                            id="week-bg-color-list"
                                            type="color"
                                            bind:value={
                                                $exportSettings.weekContainerBackgroundColor
                                            }
                                            class="w-12 h-10 rounded border border-input cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            bind:value={
                                                $exportSettings.weekContainerBackgroundColor
                                            }
                                            class="flex-1 px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm font-mono"
                                            placeholder="rgba(255, 255, 255, 0.75)"
                                        />
                                    </div>
                                </div>

                                <!-- Week Container Background Opacity -->
                                <div>
                                    <label
                                        for="week-bg-opacity-list"
                                        class="block text-xs font-medium text-muted-foreground mb-2"
                                    >
                                        Background Opacity: {$exportSettings.weekContainerBackgroundOpacity}%
                                    </label>
                                    <RangeSlider
                                        id="week-bg-opacity-desktop"
                                        min={0}
                                        max={100}
                                        bind:value={
                                            $exportSettings.weekContainerBackgroundOpacity
                                        }
                                    />
                                </div>
                            </div>

                            <!-- Reset Button -->
                            <div class="pt-4 border-t border-border">
                                <Button
                                    variant="secondary"
                                    on:click={handleResetExportSettings}
                                >
                                    Reset to Defaults
                                </Button>
                            </div>
                        </div>
                    {:else if selectedSetting === "bibleVerse"}
                        <h3 class="text-xl font-semibold text-foreground mb-4">
                            Bible Verse of the Day
                        </h3>

                        <div class="space-y-4">
                            <div
                                class="p-4 bg-muted rounded-lg border border-border space-y-3"
                            >
                                <div class="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="enableBibleVerse"
                                        checked={$bibleVerse.enabled}
                                        on:change={(e) =>
                                            bibleVerse.toggleEnabled(
                                                e.currentTarget.checked,
                                            )}
                                        class="w-4 h-4 rounded border-input"
                                    />
                                    <label
                                        for="enableBibleVerse"
                                        class="text-sm font-medium text-foreground cursor-pointer"
                                    >
                                        Show Bible Verse on Export
                                    </label>
                                </div>

                                {#if $bibleVerse.enabled}
                                    <div
                                        class="mt-4 p-3 bg-background rounded border border-input space-y-2"
                                    >
                                        <p
                                            class="text-sm italic text-foreground"
                                        >
                                            "{$bibleVerse.currentVerse.text}"
                                        </p>
                                        <p
                                            class="text-xs text-muted-foreground text-right"
                                        >
                                            – {$bibleVerse.currentVerse
                                                .reference}
                                        </p>
                                    </div>

                                    <Button
                                        variant="secondary"
                                        class="w-full"
                                        on:click={() =>
                                            bibleVerse.refreshVerse()}
                                    >
                                        <svg
                                            class="w-4 h-4 inline-block mr-1"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            ><path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                            /></svg
                                        >
                                        Get New Verse
                                    </Button>
                                {/if}
                            </div>
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</SwipeableSheet>
