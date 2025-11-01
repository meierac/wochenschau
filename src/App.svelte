<script lang="ts">
    import { onMount } from "svelte";

    import WeekView from "./lib/components/WeekView.svelte";

    import {
        refreshStatus,
        refreshProgress,
        refreshSummary,
    } from "./lib/stores/refreshStatus";

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

    import ActivityEditSheet from "./lib/components/ActivityEditSheet.svelte";
    import type {
        SyncConflict,
        ConflictResolution,
        CalendarItem,
    } from "./lib/types/index";

    let isDesktop =
        typeof window !== "undefined" ? window.innerWidth >= 768 : false;

    let showAddActivity = false;

    let showSettings = false;

    let showWeekPicker = false;

    let showExport = false;

    let editingActivity: CalendarItem | null = null;
    // legacy isSyncing flag removed

    $: syncingPhase = $refreshStatus.phase;

    $: syncingActive =
        syncingPhase !== "idle" &&
        syncingPhase !== "completed" &&
        syncingPhase !== "error" &&
        syncingPhase !== "cancelled" &&
        !(syncingPhase === "conflict-check" && showConflictDialog);

    $: canCancel = !!refreshAbortController && syncingActive;

    let showConflictDialog = false;

    let pendingConflicts: SyncConflict[] = [];

    // removed legacy pendingSyncData map (replaced by aggregated pendingDiffs)

    // Aggregated diffs for conflict dialog (produced by refreshService)

    let pendingDiffs: any = null;

    // Abort controller for cancellable refresh

    let refreshAbortController: AbortController | null = null;

    const REFRESH_INTERVAL_HOURS = 72; // Auto-refresh if data is older than 24 hours

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

    // Activity editing handlers (global sheet)
    function handleRequestEditActivity(event: CustomEvent<CalendarItem>) {
        editingActivity = event.detail;
    }
    function handleCloseEditActivity() {
        editingActivity = null;
    }
    function handleSaveActivity(event: CustomEvent<CalendarItem>) {
        activities.updateActivity(event.detail);
        editingActivity = null;
    }

    // Delegated iCal parsing (consolidated in service)

    // parseICalToCalendarItems removed (handled entirely by refreshService/icalService where needed)

    // Removed local build/extract helpers (centralized in icalService)

    // Legacy refreshSubscription removed – header now uses refreshService diff + bulk apply flow.

    function handleConflictResolution(event: CustomEvent<ConflictResolution>) {
        const resolution = event.detail;

        (async () => {
            const { refreshService } = await import(
                "./lib/services/refreshService"
            );

            if (pendingDiffs) {
                const strategy =
                    resolution === "use-synced" ? "use-synced" : "keep-local";

                const applied = refreshService.applyAllDiffs(
                    $activities,

                    pendingDiffs,

                    {
                        strategy,
                    },
                );

                // Atomic bulk replace (single write)

                activities.replaceAll(applied);

                // Update lastFetched on affected subscriptions

                const affectedIds = new Set(
                    pendingDiffs.map((d: any) => d.subscriptionId),
                );

                for (const sub of $subscriptions) {
                    if (affectedIds.has(sub.id)) {
                        subscriptions.updateSubscription({
                            ...sub,

                            lastFetched: Date.now(),
                        });
                    }
                }

                refreshStatus.finish();
            }

            // Clear pending data

            pendingConflicts = [];

            pendingDiffs = null;

            showConflictDialog = false;
        })();
    }

    function handleConflictDialogClose() {
        // User closed dialog without choosing - treat as "keep local"

        if (pendingDiffs) {
            handleConflictResolution(
                new CustomEvent<ConflictResolution>("resolve", {
                    detail: "keep-local",
                }),
            );
        } else {
            pendingConflicts = [];

            showConflictDialog = false;
        }
    }

    async function autoRefreshSubscriptions() {
        const now = Date.now();

        const refreshThreshold = REFRESH_INTERVAL_HOURS * 60 * 60 * 1000;

        const subsToRefresh = $subscriptions.filter(
            (s) =>
                s.enabled &&
                (!s.lastFetched || now - s.lastFetched > refreshThreshold),
        );

        if (subsToRefresh.length === 0) return;

        const existingMap = new Map(
            subsToRefresh.map((sub) => [
                sub.id,

                $activities.filter(
                    (a) => a.source === "ical" && a.sourceId === sub.id,
                ),
            ]),
        );

        const { refreshService } = await import(
            "./lib/services/refreshService"
        );

        // Make auto refresh abortable

        refreshAbortController = new AbortController();

        let diffs, aggregatedConflicts;

        try {
            ({ diffs, aggregatedConflicts } =
                await refreshService.fetchAndDiffAll(
                    subsToRefresh,

                    existingMap,

                    {
                        parallel: true,

                        signal: refreshAbortController.signal,
                    },
                ));
        } finally {
            // Clear controller after attempt (whether aborted or finished)

            refreshAbortController = null;
        }

        if (aggregatedConflicts.length > 0) {
            pendingConflicts = aggregatedConflicts;

            pendingDiffs = diffs;

            showConflictDialog = true;

            refreshStatus.setPhase("conflict-check");

            return;
        }

        const applied = refreshService.applyAllDiffs($activities, diffs, {
            strategy: "use-synced",
        });

        activities.replaceAll(applied);

        const affectedIds = new Set(diffs.map((d) => d.subscriptionId));

        for (const sub of $subscriptions) {
            if (affectedIds.has(sub.id)) {
                subscriptions.updateSubscription({
                    ...sub,

                    lastFetched: Date.now(),
                });
            }
        }
    }

    async function handleRefreshSubscriptions() {
        if (syncingActive) return;

        const enabledSubs = $subscriptions.filter((s) => s.enabled);

        refreshStatus.start(enabledSubs.length);

        const existingMap = new Map(
            enabledSubs.map((sub) => [
                sub.id,

                $activities.filter(
                    (a) => a.source === "ical" && a.sourceId === sub.id,
                ),
            ]),
        );

        refreshAbortController = new AbortController();

        try {
            const { refreshService } = await import(
                "./lib/services/refreshService"
            );

            const { diffs, aggregatedConflicts } =
                await refreshService.fetchAndDiffAll(enabledSubs, existingMap, {
                    parallel: true,

                    signal: refreshAbortController.signal,

                    onPhase: (phase) => {
                        if (phase === "fetching")
                            refreshStatus.setPhase("fetching");
                        else if (phase === "parsing")
                            refreshStatus.setPhase("parsing");
                        else if (phase === "diffing")
                            refreshStatus.setPhase("diffing");
                        else if (phase === "aggregating")
                            refreshStatus.setPhase("conflict-check");
                        else if (phase === "completed")
                            refreshStatus.setPhase("updating");
                        else if (phase === "cancelled") refreshStatus.cancel();
                        else if (phase === "error")
                            refreshStatus.fail(new Error("Refresh error"));
                    },
                });

            if ($refreshStatus.phase === "cancelled") return;

            if (aggregatedConflicts.length > 0) {
                pendingConflicts = aggregatedConflicts;

                pendingDiffs = diffs;

                showConflictDialog = true;

                refreshStatus.setPhase("conflict-check");

                return;
            }

            const applied = refreshService.applyAllDiffs($activities, diffs, {
                strategy: "use-synced",
            });

            activities.replaceAll(applied);

            const affectedIds = new Set(diffs.map((d) => d.subscriptionId));

            for (const sub of $subscriptions) {
                if (affectedIds.has(sub.id)) {
                    subscriptions.updateSubscription({
                        ...sub,

                        lastFetched: Date.now(),
                    });
                }
            }

            refreshStatus.finish();
        } catch (err) {
            if ((err as any)?.name === "AbortError") {
                refreshStatus.cancel();
            } else {
                refreshStatus.fail(err);

                console.error("Global header refresh failed:", err);
            }
        } finally {
            refreshAbortController = null;
        }
    }

    function handleCancelRefresh() {
        if (refreshAbortController) {
            refreshAbortController.abort();
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
                    <h1 class="text-4xl font-bold flex items-center gap-3">
                        <img
                            src="/wochenschau/favicon.svg"
                            alt="Wochenschau Logo"
                            width="40"
                            height="40"
                            class="rounded-lg"
                        />
                        Wochenschau
                    </h1>
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
                    {#if syncingActive}
                        {#if canCancel}
                            <button
                                on:click={handleCancelRefresh}
                                class="px-3 py-2 rounded-lg bg-destructive/80 text-destructive-foreground text-xs font-semibold hover:bg-destructive transition-colors"
                                aria-label="Cancel refresh"
                                title="Cancel refresh"
                            >
                                Cancel refresh
                            </button>
                        {/if}
                    {/if}
                </div>

                <div class="flex gap-2 items-center">
                    <!-- Unified Sync Button with progress & state -->
                    <button
                        on:click={handleRefreshSubscriptions}
                        disabled={syncingActive}
                        class="px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
                            {syncingActive
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:opacity-90'}"
                        aria-label="Refresh calendar subscriptions"
                        title={syncingActive
                            ? $refreshSummary
                            : "Sync calendars"}
                    >
                        <svg
                            class="w-5 h-5 {syncingActive
                                ? 'animate-spin'
                                : ''}"
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
                        {#if syncingActive}
                            <span class="text-xs font-medium">
                                {$refreshSummary}
                            </span>
                            <div
                                class="relative w-12 h-2 bg-background/30 rounded-full overflow-hidden"
                            >
                                <div
                                    class="absolute inset-y-0 left-0 bg-background/90 rounded-full transition-all duration-300"
                                    style="width: {(
                                        $refreshProgress * 100
                                    ).toFixed(0)}%;"
                                ></div>
                            </div>
                        {:else}
                            Sync
                        {/if}
                    </button>

                    <!-- Export Button -->
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

                    <!-- Settings Button -->
                    <button
                        on:click={handleOpenSettings}
                        class="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                        aria-label="Open settings"
                        title="Settings"
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

                    <!-- Add Activity Button -->
                    <button
                        on:click={handleOpenAddActivity}
                        class="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                        aria-label="Add activity"
                        title="Add activity"
                    >
                        <svg
                            class="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-label="Edit"
                        >
                            <path
                                d="M4 20l1.05-4.2a2 2 0 0 1 .53-.95L15.3 5.13a2.5 2.5 0 0 1 3.54 0l.03.03a2.5 2.5 0 0 1 0 3.54L9.15 18.42a2 2 0 0 1-.95.53L4 20Z"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linejoin="round"
                            />
                            <path
                                d="M13.5 7.5l3 3"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                            />
                        </svg>
                        Add
                    </button>
                </div>
            </div>

            <!-- Week View -->
            <div class="flex-1 overflow-hidden">
                <WeekView
                    {isDesktop}
                    on:requestEditActivity={handleRequestEditActivity}
                />
            </div>
        </div>
    {:else}
        <!-- Mobile Layout -->
        <div class="h-screen flex flex-col pb-0 relative overflow-hidden">
            <!-- Mobile Header -->
            <div
                class="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-background/100 to-transparent px-4 py-3 flex items-center justify-between pointer-events-none backdrop-blur-lg"
                style="mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%);"
            >
                <h1
                    class="text-2xl font-bold pointer-events-auto flex items-center gap-2"
                >
                    <img
                        src="/wochenschau/favicon.svg"
                        alt="Wochenschau Logo"
                        width="32"
                        height="32"
                        class="rounded-lg"
                    />
                    Wochenschau
                </h1>
                <button
                    on:click={handleRefreshSubscriptions}
                    disabled={syncingActive}
                    class="pointer-events-auto p-2 rounded-lg active:bg-muted transition-colors disabled:opacity-50"
                    aria-label="Sync calendars"
                    title={syncingActive ? $refreshSummary : "Sync calendars"}
                >
                    <svg
                        class="w-6 h-6 {syncingActive ? 'animate-spin' : ''}"
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

            <!-- Mobile Sync Overlay Splash -->
            {#if syncingActive}
                <div
                    class="fixed inset-0 z-40 flex flex-col items-center justify-center bg-background/90 backdrop-blur-lg"
                >
                    <div class="relative w-20 h-20 mb-6">
                        <div
                            class="absolute inset-0 rounded-full border-4 border-primary/30"
                        ></div>
                        <div
                            class="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
                        ></div>
                        <div
                            class="absolute inset-0 rounded-full animate-ping bg-primary/10"
                        ></div>
                    </div>
                    <p class="text-sm font-semibold mb-2">
                        {$refreshSummary}
                    </p>
                    <div
                        class="w-40 h-3 rounded-full bg-muted overflow-hidden mb-3"
                    >
                        <div
                            class="h-full bg-primary transition-all duration-300"
                            style="width: {($refreshProgress * 100).toFixed(
                                0,
                            )}%;"
                        ></div>
                    </div>
                    <p class="text-[10px] text-muted-foreground mb-4">
                        Added {$refreshStatus.addedCount} • Updated {$refreshStatus.updatedCount}
                        • Removed {$refreshStatus.removedCount} • Conflicts {$refreshStatus.conflictCount}
                    </p>
                    {#if canCancel}
                        <button
                            on:click={handleCancelRefresh}
                            class="px-5 py-2 rounded-full bg-destructive text-destructive-foreground text-xs font-semibold hover:opacity-90 transition-colors"
                            aria-label="Cancel sync"
                        >
                            Cancel sync
                        </button>
                    {/if}
                </div>
            {/if}

            <!-- Week View -->
            <div class="flex-1 overflow-hidden">
                <WeekView
                    {isDesktop}
                    on:requestEditActivity={handleRequestEditActivity}
                />
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

{#if editingActivity}
    <ActivityEditSheet
        {isDesktop}
        activity={editingActivity}
        on:save={handleSaveActivity}
        on:delete={() => {
            if (editingActivity) {
                activities.removeActivity(editingActivity.id);
            }
            editingActivity = null;
        }}
        on:close={handleCloseEditActivity}
    />
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
