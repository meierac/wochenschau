<script lang="ts">
    import { onMount } from "svelte";

    import WeekView from "./lib/components/WeekView.svelte";
    import MonthView from "./lib/components/MonthView.svelte";

    import {
        refreshStatus,
        refreshProgress,
        refreshSummary,
    } from "./lib/stores/refreshStatus";

    import FloatingNav from "./lib/components/FloatingNav.svelte";
    import DesktopSidebar from "./lib/components/DesktopSidebar.svelte";
    import ComingSoonPage from "./lib/components/ComingSoonPage.svelte";

    import AddActivityModal from "./lib/components/AddActivityModal.svelte";

    import SettingsSheet from "./lib/components/SettingsSheet.svelte";

    import ExportSheet from "./lib/components/ExportSheet.svelte";

    import SyncConflictDialog from "./lib/components/SyncConflictDialog.svelte";
    import ConfirmDialog from "./lib/components/ConfirmDialog.svelte";

    import { currentWeek, currentYear } from "./lib/stores/week";

    import { subscriptions } from "./lib/stores/ical";

    import { activities } from "./lib/stores/activities";

    import {
        getCalendarToday,
        getCurrentWeek,
        getNextWeek,
        getPreviousWeek,
    } from "./lib/utils/date";

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
    let settingsInitialSetting: "profile" | null = null;

    let showWeekPicker = false;

    type AppPage = "calendar" | "messages" | "registrations" | "files";

    let showExport = false;
    let desktopSidebarCollapsed = false;
    let currentPage: AppPage = "calendar";

    let editingActivity: CalendarItem | null = null;
    let showDeleteConfirm = false;
    let desktopCalendarView: "week" | "month" = "week";
    let desktopMonthDate = getCalendarToday();
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
        settingsInitialSetting = null;
        showSettings = true;
    }

    function handleOpenCalendarPage() {
        currentPage = "calendar";
    }

    function handleOpenMessagesPage() {
        currentPage = "messages";
    }

    function handleOpenRegistrationsPage() {
        currentPage = "registrations";
    }

    function handleOpenFilesPage() {
        currentPage = "files";
    }

    function handleOpenProfilePage() {
        settingsInitialSetting = isDesktop ? "profile" : null;
        showSettings = true;
    }

    function handleCloseSettings() {
        showSettings = false;
        settingsInitialSetting = null;
    }

    function getPageTitle(page: AppPage) {
        if (page === "messages") return "Messages";
        if (page === "registrations") return "Registrations";
        if (page === "files") return "Files";
        return "Calendar";
    }

    function handleWeekSelected(
        event: CustomEvent<{ week: number; year: number }>,
    ) {
        currentWeek.set(event.detail.week);
        currentYear.set(event.detail.year);
        desktopCalendarView = "week";
        showWeekPicker = false;
    }

    function handleMonthSelected(event: CustomEvent<{ date: Date }>) {
        desktopMonthDate = event.detail.date;
        desktopCalendarView = "month";
        showWeekPicker = false;
    }

    function handleOpenExport() {
        showExport = true;
    }

    function handleJumpToToday() {
        const today = getCalendarToday();
        const { week, year } = getCurrentWeek();
        currentWeek.set(week);
        currentYear.set(year);
        desktopMonthDate = today;
    }

    function handleNavigateDesktopPeriod(direction: -1 | 1) {
        if (desktopCalendarView === "month") {
            const nextDate = new Date(desktopMonthDate);
            nextDate.setMonth(nextDate.getMonth() + direction, 1);
            desktopMonthDate = nextDate;
            return;
        }

        const nextWeekInfo =
            direction > 0
                ? getNextWeek($currentWeek, $currentYear)
                : getPreviousWeek($currentWeek, $currentYear);

        currentWeek.set(nextWeekInfo.week);
        currentYear.set(nextWeekInfo.year);
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
    function handleRequestDelete() {
        showDeleteConfirm = true;
    }
    function handleConfirmDelete() {
        if (editingActivity) {
            activities.removeActivity(editingActivity.id);
        }
        showDeleteConfirm = false;
        editingActivity = null;
    }
    function handleCancelDelete() {
        showDeleteConfirm = false;
    }

    // Delegated iCal parsing (consolidated in service)

    // parseICalToCalendarItems removed (handled entirely by refreshService/icalService where needed)

    // Removed local build/extract helpers (centralized in icalService)

    // Legacy refreshSubscription removed – header now uses refreshService diff + bulk apply flow.

    function handleConflictResolution(event: CustomEvent<ConflictResolution>) {
        const resolution = event.detail;

        (async () => {
            const { refreshService } =
                await import("./lib/services/refreshService");

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

        const { refreshService } =
            await import("./lib/services/refreshService");

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
            const { refreshService } =
                await import("./lib/services/refreshService");

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

    $: actualCurrentWeekInfo = getCurrentWeek();
    $: isViewingCurrentWeek =
        $currentWeek === actualCurrentWeekInfo.week &&
        $currentYear === actualCurrentWeekInfo.year;
    $: isViewingCurrentMonth =
        desktopMonthDate.getMonth() === getCalendarToday().getMonth() &&
        desktopMonthDate.getFullYear() === getCalendarToday().getFullYear();
    $: isViewingCurrentDesktopPeriod =
        desktopCalendarView === "month"
            ? isViewingCurrentMonth
            : isViewingCurrentWeek;
    $: desktopMonthLabel = desktopMonthDate.toLocaleDateString("de-DE", {
        month: "long",
        year: "numeric",
    });

    onMount(() => {
        // Auto-refresh subscriptions on app start if they're outdated

        autoRefreshSubscriptions();
    });
</script>

<svelte:window on:resize={handleResize} />

<main class="h-screen bg-background text-foreground overflow-hidden">
    {#if isDesktop}
        <!-- Desktop Layout -->
        <div class="mx-auto h-screen max-w-10xl">
            <div class="flex h-full gap-4">
                <DesktopSidebar
                    collapsed={desktopSidebarCollapsed}
                    activeView={currentPage}
                    on:openCalendar={handleOpenCalendarPage}
                    on:openMessages={handleOpenMessagesPage}
                    on:openRegistrations={handleOpenRegistrationsPage}
                    on:openFiles={handleOpenFilesPage}
                    on:openProfile={handleOpenProfilePage}
                    on:openSettings={handleOpenSettings}
                    on:toggleCollapse={() =>
                        (desktopSidebarCollapsed = !desktopSidebarCollapsed)}
                />

                <div class="flex min-w-0 flex-1 flex-col overflow-hidden p-4">
                    {#if currentPage === "calendar"}
                        <!-- Desktop Header -->
                        <div
                            class="mb-4 flex items-start justify-between gap-4"
                        >
                            <div
                                class="flex min-w-0 flex-wrap items-center gap-4"
                            >
                                <div
                                    class="flex items-center gap-0 rounded-xl bg-secondary p-0.5"
                                >
                                    <button
                                        on:click={() =>
                                            handleNavigateDesktopPeriod(-1)}
                                        class="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                        aria-label={desktopCalendarView ===
                                        "month"
                                            ? "Previous month"
                                            : "Previous week"}
                                        title={desktopCalendarView === "month"
                                            ? "Previous month"
                                            : "Previous week"}
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
                                                d="M15 19l-7-7 7-7"
                                            />
                                        </svg>
                                    </button>

                                    <button
                                        on:click={() => (showWeekPicker = true)}
                                        class="flex {desktopCalendarView ===
                                        'month'
                                            ? 'w-40'
                                            : 'w-32'} items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground text-center"
                                        aria-label={desktopCalendarView ===
                                        "month"
                                            ? "Pick month"
                                            : "Pick week"}
                                        title={desktopCalendarView === "month"
                                            ? "Pick month"
                                            : "Pick week"}
                                    >
                                        <span
                                            class="flex h-5 w-5 shrink-0 items-center justify-center"
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
                                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                />
                                            </svg>
                                        </span>
                                        <span
                                            class="text-sm font-semibold leading-none whitespace-nowrap capitalize"
                                        >
                                            {#if desktopCalendarView === "month"}
                                                {desktopMonthLabel}
                                            {:else}
                                                W{$currentWeek}
                                            {/if}
                                        </span>
                                    </button>

                                    <button
                                        on:click={() =>
                                            handleNavigateDesktopPeriod(1)}
                                        class="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                        aria-label={desktopCalendarView ===
                                        "month"
                                            ? "Next month"
                                            : "Next week"}
                                        title={desktopCalendarView === "month"
                                            ? "Next month"
                                            : "Next week"}
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
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                    </button>
                                </div>
                                {#if !isViewingCurrentDesktopPeriod}
                                    <button
                                        on:click={handleJumpToToday}
                                        class="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                                        aria-label={desktopCalendarView ===
                                        "month"
                                            ? "Go to current month"
                                            : "Go to current week"}
                                        title={desktopCalendarView === "month"
                                            ? "Go to current month"
                                            : "Go to current week"}
                                    >
                                        Today
                                    </button>
                                {/if}
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

                        <!-- Desktop Calendar View -->
                        <div class="flex-1 overflow-hidden">
                            {#if desktopCalendarView === "month"}
                                <MonthView
                                    referenceDate={desktopMonthDate}
                                    on:requestEditActivity={handleRequestEditActivity}
                                />
                            {:else}
                                <WeekView
                                    {isDesktop}
                                    on:requestEditActivity={handleRequestEditActivity}
                                />
                            {/if}
                        </div>
                    {:else}
                        <div
                            class="mb-4 flex items-start justify-between gap-4"
                        >
                            <div>
                                <h1 class="text-3xl font-bold">
                                    {getPageTitle(currentPage)}
                                </h1>
                                <p class="mt-1 text-sm text-muted-foreground">
                                    A dedicated workspace for {getPageTitle(
                                        currentPage,
                                    ).toLowerCase()} is on the way.
                                </p>
                            </div>
                        </div>
                        <div class="flex-1 overflow-hidden">
                            <ComingSoonPage
                                title={getPageTitle(currentPage)}
                                description={`The ${getPageTitle(currentPage).toLowerCase()} experience will be available here soon.`}
                            />
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    {:else}
        <!-- Mobile Layout -->
        <div class="h-screen flex flex-col pb-0 relative overflow-hidden">
            <!-- Mobile Header -->
            <div
                class="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-background/100 to-transparent px-4 pb-3 backdrop-blur-lg pointer-events-none"
                style="padding-top: calc(0rem + env(safe-area-inset-top)); mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%);"
            >
                <div class="flex items-center justify-between gap-3">
                    <h1 class="min-w-0 text-2xl font-bold pointer-events-auto">
                        {getPageTitle(currentPage)}
                    </h1>

                    <div class="pointer-events-auto flex items-center gap-1">
                        {#if currentPage === "calendar"}
                            <button
                                on:click={() => (showWeekPicker = true)}
                                class="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors active:bg-muted hover:bg-muted"
                                aria-label="Open week picker"
                                title="Pick week"
                                type="button"
                            >
                                <svg
                                    class="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                <span>W{$currentWeek}</span>
                            </button>
                            <button
                                on:click={handleRefreshSubscriptions}
                                disabled={syncingActive}
                                class="rounded-full p-2 transition-colors active:bg-muted hover:bg-muted disabled:opacity-50"
                                aria-label="Sync calendars"
                                title={syncingActive
                                    ? $refreshSummary
                                    : "Sync calendars"}
                                type="button"
                            >
                                <svg
                                    class="h-6 w-6 {syncingActive
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
                            </button>
                            <button
                                on:click={handleOpenExport}
                                class="rounded-full p-2 transition-colors active:bg-muted hover:bg-muted"
                                aria-label="Export agenda"
                                title="Export agenda"
                                type="button"
                            >
                                <svg
                                    class="h-6 w-6"
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
                            </button>
                            <button
                                on:click={handleOpenAddActivity}
                                class="rounded-full p-2 transition-colors active:bg-muted hover:bg-muted"
                                aria-label="Add activity"
                                title="Add activity"
                                type="button"
                            >
                                <svg
                                    class="h-6 w-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                            </button>
                        {/if}
                    </div>
                </div>
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

            {#if currentPage === "calendar"}
                <div class="flex-1 overflow-hidden">
                    <WeekView
                        {isDesktop}
                        on:requestEditActivity={handleRequestEditActivity}
                    />
                </div>
            {:else}
                <div class="flex-1 overflow-hidden px-4 pb-24 pt-24">
                    <ComingSoonPage
                        title={getPageTitle(currentPage)}
                        description={`The ${getPageTitle(currentPage).toLowerCase()} experience will be available here soon.`}
                    />
                </div>
            {/if}

            <!-- Floating Navigation Bar -->
            <FloatingNav
                activePage={currentPage}
                on:navigateCalendar={handleOpenCalendarPage}
                on:navigateProfile={handleOpenProfilePage}
                on:navigateMessages={handleOpenMessagesPage}
                on:navigateRegistrations={handleOpenRegistrationsPage}
                on:navigateFiles={handleOpenFilesPage}
            />
        </div>
    {/if}
</main>

<!-- Modals/Sheets -->
{#if showAddActivity}
    <AddActivityModal on:close={handleCloseAddActivity} {isDesktop} />
{/if}

{#if showSettings}
    <SettingsSheet
        initialSetting={settingsInitialSetting}
        on:close={handleCloseSettings}
        {isDesktop}
    />
{/if}

{#if showWeekPicker}
    <WeekPicker
        {isDesktop}
        currentWeek={$currentWeek}
        currentYear={$currentYear}
        desktopViewMode={isDesktop ? desktopCalendarView : "week"}
        selectedMonthDate={desktopMonthDate}
        on:weekSelected={handleWeekSelected}
        on:monthSelected={handleMonthSelected}
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
        on:requestDelete={handleRequestDelete}
        on:close={handleCloseEditActivity}
    />
{/if}

<!-- Delete Activity Confirmation Dialog -->
<ConfirmDialog
    isOpen={showDeleteConfirm}
    {isDesktop}
    title="Delete Activity"
    message={editingActivity
        ? `Delete activity "${editingActivity.summary}"?`
        : "Delete this activity?"}
    confirmLabel="Delete"
    cancelLabel="Cancel"
    variant="destructive"
    on:confirm={handleConfirmDelete}
    on:cancel={handleCancelDelete}
    on:close={handleCancelDelete}
/>

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
