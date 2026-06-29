<script lang="ts">
    import { onMount } from "svelte";
    import { base } from "$app/paths";

    import WeekView from "./lib/components/WeekView.svelte";
    import MonthView from "./lib/components/MonthView.svelte";

    import {
        refreshStatus,
        refreshProgress,
        refreshSummary,
    } from "./lib/stores/refreshStatus";

    import FloatingNav from "./lib/components/FloatingNav.svelte";
    import DesktopSidebar from "./lib/components/DesktopSidebar.svelte";
    import DesktopCalendarPickerSidebar from "./lib/components/DesktopCalendarPickerSidebar.svelte";
    import ComingSoonPage from "./lib/components/ComingSoonPage.svelte";

    import AddActivityModal from "./lib/components/AddActivityModal.svelte";

    import SettingsSheet from "./lib/components/SettingsSheet.svelte";

    import ExportSheet from "./lib/components/ExportSheet.svelte";

    import SyncConflictDialog from "./lib/components/SyncConflictDialog.svelte";
    import ConfirmDialog from "./lib/components/ConfirmDialog.svelte";

    import { subscriptions } from "./lib/stores/ical";

    import { activities } from "./lib/stores/activities";

    import { currentWeek, currentYear } from "./lib/stores/week";

    import {
        getCalendarToday,
        getCurrentWeek,
        formatDateRange,
        getWeekNumber,
        getMondayOfWeek,
    } from "./lib/utils/date";

    import WeekPicker from "./lib/components/WeekPicker.svelte";

    import ActivityDetailsSheet from "./lib/components/ActivityDetailsSheet.svelte";
    import ActivityEditSheet from "./lib/components/ActivityEditSheet.svelte";
    import { mobileHeaderActions } from "./lib/stores/mobilePageHeader";
    import type {
        SyncConflict,
        ConflictResolution,
        CalendarItem,
    } from "./lib/types/index";
    import {
        cloudAuth,
        initializeCloudSync,
        signInWithPocketBase,
        createPocketBaseAccount,
        resolveInitialTransferChoice,
    } from "./lib/services/cloudSync";
    import IconButton from "./lib/components/IconButton.svelte";
    import Button from "./lib/components/Button.svelte";
    import Input from "./lib/components/Input.svelte";
    let isDesktop =
        typeof window !== "undefined" ? window.innerWidth >= 768 : false;

    let showAddActivity = false;

    let showSettings = false;
    let settingsInitialSetting: "profile" | null = null;

    let showWeekPicker = false;

    type AppPage =
        "calendar" | "messages" | "registrations" | "files" | "settings";

    let showExport = false;
    let desktopSidebarCollapsed = false;
    let currentPage: AppPage = "calendar";

    let viewingActivity: CalendarItem | null = null;
    let editingActivity: CalendarItem | null = null;
    let deletingActivity: CalendarItem | null = null;
    let showDeleteConfirm = false;
    let desktopCalendarView: "week" | "month" = "week";

    let authMode: "login" | "register" = "login";
    let authEmail = "";
    let authPassword = "";
    let authPasswordConfirm = "";
    let authError = "";
    let authSuccess = "";

    let screenWidth = typeof window !== "undefined" ? window.innerWidth : 0;
    let userManuallyCollapsed = false;
    let settingsCurrentSubPage: string | null = null;
    let settingsSheetInstance: { goBack: () => void } | null = null;
    let calendarPickerSheetOpen = false;

    const settingsSubPageLabels: Record<string, string> = {
        profile: "Profile",
        templates: "Activity Templates",
        ical: "Calendar Subscriptions",
        export: "Export Settings",
        bibleVerse: "Bible Verse",
        about: "About",
    };

    // Unified selection state: all selection is date-based
    let selectedDate = getCalendarToday();

    // Synchronize stores with selectedDate
    $: {
        const week = getWeekNumber(selectedDate);
        const year = selectedDate.getFullYear();
        currentWeek.set(week);
        currentYear.set(year);
    }

    // Derived state for month view
    $: desktopMonthDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
    );
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
        const wasDesktop = isDesktop;
        isDesktop = window.innerWidth >= 768;
        screenWidth = window.innerWidth;

        // Settings tab is mobile-only: migrate to the desktop sheet on resize to desktop
        if (!wasDesktop && isDesktop && currentPage === "settings") {
            currentPage = "calendar";
            settingsCurrentSubPage = null;
            mobileHeaderActions.set([]);
            showSettings = true;
        }

        // Desktop sheet is desktop-only: migrate to the settings tab on resize to mobile
        if (wasDesktop && !isDesktop && showSettings) {
            showSettings = false;
            currentPage = "settings";
        }

        if (window.innerWidth < 1200) {
            desktopSidebarCollapsed = true;
            return;
        }

        // Close the calendar picker sheet when resizing back to large desktop
        calendarPickerSheetOpen = false;

        if (!userManuallyCollapsed) {
            desktopSidebarCollapsed = false;
        }
    }

    function handleOpenAddActivity() {
        showAddActivity = true;
    }

    function handleCloseAddActivity() {
        showAddActivity = false;
    }

    function handleOpenSettings() {
        settingsInitialSetting = null;
        if (isDesktop) {
            showSettings = true;
        } else {
            currentPage = "settings";
        }
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
        settingsInitialSetting = "profile";
        if (isDesktop) {
            showSettings = true;
        } else {
            currentPage = "settings";
        }
    }

    function handleCloseSettings() {
        showSettings = false;
        settingsInitialSetting = null;
    }

    function getPageTitle(page: AppPage) {
        if (page === "messages") return "Messages";
        if (page === "registrations") return "Registrations";
        if (page === "files") return "Files";
        if (page === "settings") return "";
        return "Calendar";
    }

    function handleWeekSelected(
        event: CustomEvent<{ week: number; year: number }>,
    ) {
        // Convert week selection to a date (use Monday of the week)
        selectedDate = getMondayOfWeek(event.detail.week, event.detail.year);
        desktopCalendarView = "week";
        showWeekPicker = false;
    }

    function handleMonthSelected(event: CustomEvent<{ date: Date }>) {
        // Month selection sets the selected date directly
        selectedDate = event.detail.date;
        desktopCalendarView = "month";
        showWeekPicker = false;
    }

    function handleOpenExport() {
        showExport = true;
    }

    function handleJumpToToday() {
        selectedDate = getCalendarToday();
    }

    function handleNavigateDesktopPeriod(direction: -1 | 1) {
        if (desktopCalendarView === "month") {
            // Navigate to the same day in next/previous month
            const nextDate = new Date(selectedDate);
            nextDate.setMonth(nextDate.getMonth() + direction);
            selectedDate = nextDate;
            return;
        }

        // Navigate by week - move to same weekday in next/previous week
        const nextDate = new Date(selectedDate);
        nextDate.setDate(nextDate.getDate() + direction * 7);
        selectedDate = nextDate;
    }

    // Activity detail/editing handlers (global sheets)
    function handleRequestViewActivity(event: CustomEvent<CalendarItem>) {
        viewingActivity = event.detail;
    }

    function handleCloseActivityDetails() {
        viewingActivity = null;
    }

    function handleEditFromDetails(event: CustomEvent<CalendarItem>) {
        editingActivity = event.detail;
        viewingActivity = null;
    }

    function handleRequestEditActivity(event: CustomEvent<CalendarItem>) {
        editingActivity = event.detail;
        viewingActivity = null;
    }
    function handleCloseEditActivity() {
        editingActivity = null;
    }
    function handleSaveActivity(event: CustomEvent<CalendarItem>) {
        activities.updateActivity(event.detail);
        editingActivity = null;
    }
    function handleRequestDeleteActivity(event: CustomEvent<CalendarItem>) {
        deletingActivity = event.detail;
        showDeleteConfirm = true;
    }
    function handleRequestDelete() {
        if (!editingActivity) return;
        deletingActivity = editingActivity;
        showDeleteConfirm = true;
    }
    function handleConfirmDelete() {
        if (deletingActivity) {
            activities.removeActivity(deletingActivity.id);

            if (editingActivity?.id === deletingActivity.id) {
                editingActivity = null;
            }

            if (viewingActivity?.id === deletingActivity.id) {
                viewingActivity = null;
            }
        }

        showDeleteConfirm = false;
        deletingActivity = null;
    }
    function handleCancelDelete() {
        showDeleteConfirm = false;
        deletingActivity = null;
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
    $: currentWeekDateRange = formatDateRange($currentWeek, $currentYear);

    function resetAuthMessages() {
        authError = "";
        authSuccess = "";
    }

    function toErrorMessage(error: unknown) {
        if (error instanceof Error) return error.message;
        return "Unknown error";
    }

    async function handleAuthSubmit() {
        resetAuthMessages();

        const email = authEmail.trim();
        if (!email || !authPassword) {
            authError = "Please enter email and password.";
            return;
        }

        try {
            if (authMode === "register") {
                if (authPassword !== authPasswordConfirm) {
                    authError = "Passwords do not match.";
                    return;
                }

                await createPocketBaseAccount(
                    email,
                    authPassword,
                    authPasswordConfirm,
                );
                authSuccess = "Account created. You are now signed in.";
            } else {
                await signInWithPocketBase(email, authPassword);
                authSuccess = "Signed in.";
            }

            authPassword = "";
            authPasswordConfirm = "";
        } catch (error) {
            authError = toErrorMessage(error);
        }
    }

    async function handleInitialTransferChoice(transfer: boolean) {
        resetAuthMessages();

        try {
            await resolveInitialTransferChoice(transfer);
            authSuccess = transfer
                ? "Local data transferred to your account."
                : "Using account data for this device.";
        } catch (error) {
            authError = toErrorMessage(error);
        }
    }

    onMount(() => {
        (async () => {
            try {
                await initializeCloudSync();

                // Auto-refresh subscriptions on app start for authenticated sessions.
                if ($cloudAuth.isAuthenticated) {
                    await autoRefreshSubscriptions();
                }
            } catch (error) {
                console.error("Startup sync initialization failed:", error);
            }
        })();
    });
</script>

<svelte:window on:resize={handleResize} />

<main class="h-screen bg-background text-foreground">
    {#if !$cloudAuth.ready}
        <div class="flex h-screen items-center justify-center px-6">
            <p class="text-sm text-muted-foreground">Loading account…</p>
        </div>
    {:else if !$cloudAuth.isAuthenticated || $cloudAuth.requiresInitialTransferChoice}
        <div class="flex h-screen items-center justify-center px-4">
            <section
                class="w-full max-w-xl rounded-3xl bg-background/80 p-6 shadow-sm"
            >
                <div
                    class="flex min-h-[72px] items-center flex-col gap-8 justify-center rounded-[1.4rem] px-3 py-3"
                >
                    <img
                        src={`${base}/favicon.svg`}
                        alt="Wochenschau Logo"
                        width="200"
                        height="200"
                        class="h-24 w-24 shrink-0 rounded-xl"
                    />
                    <h1 class="text-4xl font-bold">Strata</h1>
                </div>
                {#if $cloudAuth.isAuthenticated && $cloudAuth.requiresInitialTransferChoice}
                    <div
                        class="mt-5 rounded-2xl border border-border/60 bg-card/40 p-4"
                    >
                        <p class="font-medium">Transfer local data?</p>
                        <p class="mt-1 text-sm text-muted-foreground">
                            We found local data on this device. Do you want to
                            transfer it to your account?
                        </p>
                        <div class="mt-3 flex flex-wrap gap-2">
                            <Button
                                class="rounded-full px-5"
                                on:click={() =>
                                    handleInitialTransferChoice(true)}
                            >
                                Yes, transfer
                            </Button>
                            <Button
                                variant="ghost"
                                class="rounded-full px-5"
                                on:click={() =>
                                    handleInitialTransferChoice(false)}
                            >
                                No, use account data
                            </Button>
                        </div>
                    </div>
                {:else}
                    <div
                        class="mt-5 flex items-center gap-2 border-border border rounded-full p-0.5 bg-muted"
                    >
                        <button
                            type="button"
                            class={`rounded-full w-full px-3 py-1.5 text-sm font-medium transition-colors ${
                                authMode === "login"
                                    ? "bg-secondary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                            on:click={() => {
                                authMode = "login";
                                resetAuthMessages();
                            }}
                        >
                            Login
                        </button>
                        <button
                            type="button"
                            class={`rounded-full w-full px-3 py-1.5 text-sm font-medium transition-colors ${
                                authMode === "register"
                                    ? "bg-secondary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                            on:click={() => {
                                authMode = "register";
                                resetAuthMessages();
                            }}
                        >
                            Create account
                        </button>
                    </div>

                    <div class="mt-4 grid gap-3 md:grid-cols-2">
                        <label
                            class="flex flex-col gap-2 text-sm font-medium md:col-span-2"
                        >
                            <!-- <span>Email</span> -->
                            <Input
                                bind:value={authEmail}
                                type="email"
                                placeholder="Email"
                            />
                        </label>
                        <label
                            class={`flex flex-col gap-2 text-sm font-medium ${
                                authMode === "login" ? "md:col-span-2" : ""
                            }`}
                        >
                            <!-- <span>Password</span> -->
                            <Input
                                bind:value={authPassword}
                                type="password"
                                placeholder="Password"
                            />
                        </label>
                        {#if authMode === "register"}
                            <label
                                class="flex flex-col gap-2 text-sm font-medium"
                            >
                                <!-- <span>Confirm password</span> -->
                                <Input
                                    bind:value={authPasswordConfirm}
                                    type="password"
                                    placeholder="Confirm password"
                                />
                            </label>
                        {/if}
                    </div>

                    <div class="mt-4">
                        <Button
                            class="rounded-full w-full px-5"
                            on:click={handleAuthSubmit}
                        >
                            {authMode === "login" ? "Login" : "Create account"}
                        </Button>
                    </div>
                {/if}

                {#if authError || $cloudAuth.error}
                    <p class="mt-3 text-sm text-destructive">
                        {authError || $cloudAuth.error}
                    </p>
                {/if}

                {#if authSuccess}
                    <p
                        class="mt-3 text-sm text-emerald-600 dark:text-emerald-400"
                    >
                        {authSuccess}
                    </p>
                {/if}
            </section>
        </div>
    {:else if isDesktop}
        <!-- Desktop Layout -->
        <div class="mx-auto h-screen max-w-10xl">
            <div class="flex h-screen">
                <DesktopSidebar
                    collapsed={desktopSidebarCollapsed}
                    isSmallScreen={screenWidth < 1200}
                    activeView={currentPage === "settings"
                        ? "calendar"
                        : currentPage}
                    on:openCalendar={handleOpenCalendarPage}
                    on:openMessages={handleOpenMessagesPage}
                    on:openRegistrations={handleOpenRegistrationsPage}
                    on:openFiles={handleOpenFilesPage}
                    on:openProfile={handleOpenProfilePage}
                    on:openSettings={handleOpenSettings}
                    on:toggleCollapse={() => {
                        desktopSidebarCollapsed = !desktopSidebarCollapsed;
                        if (screenWidth >= 1200) {
                            userManuallyCollapsed = desktopSidebarCollapsed;
                        }
                    }}
                />

                <div class="min-w-0 flex-1 flex-col overflow-y-scroll">
                    {#if currentPage === "calendar"}
                        <!-- Desktop Header -->
                        <div
                            class="px-10 pr-12 pt-3 pb-3 flex items-start justify-between gap-4 border-b sticky top-0 z-10 backdrop-blur-xl"
                        >
                            <div
                                class="flex min-w-0 flex-wrap items-center gap-4"
                            >
                                <div
                                    class="flex items-center border border-border floating-glass-pill p-1"
                                >
                                    <button
                                        on:click={() =>
                                            (desktopCalendarView = "week")}
                                        class={`rounded-3xl px-4 py-2 text-sm font-semibold transition-colors ${
                                            desktopCalendarView === "week"
                                                ? "bg-primary text-primary-foreground"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }`}
                                        aria-label="Show week view"
                                        title="Week view"
                                        type="button"
                                    >
                                        Week
                                    </button>
                                    <button
                                        on:click={() =>
                                            (desktopCalendarView = "month")}
                                        class={`rounded-3xl px-4 py-2 text-sm font-semibold transition-colors ${
                                            desktopCalendarView === "month"
                                                ? "bg-primary text-primary-foreground"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }`}
                                        aria-label="Show month view"
                                        title="Month view"
                                        type="button"
                                    >
                                        Month
                                    </button>
                                </div>

                                <div
                                    class="flex items-center gap-0.5 border border-border floating-glass-pill py-0.5 px-0.5"
                                >
                                    <button
                                        on:click={() =>
                                            handleNavigateDesktopPeriod(-1)}
                                        class="flex h-9 w-9 items-center justify-center rounded-3xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                        aria-label={desktopCalendarView ===
                                        "month"
                                            ? "Previous month"
                                            : "Previous week"}
                                        title={desktopCalendarView === "month"
                                            ? "Previous month"
                                            : "Previous week"}
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
                                                d="M15 19l-7-7 7-7"
                                            />
                                        </svg>
                                    </button>

                                    <button
                                        type="button"
                                        on:click={() =>
                                            screenWidth < 1200 &&
                                            (calendarPickerSheetOpen = true)}
                                        class="flex items-center justify-center gap-2 px-2 py-2 rounded-3xl text-muted-foreground text-center {screenWidth <
                                        1200
                                            ? 'hover:bg-muted transition-colors cursor-pointer'
                                            : 'cursor-default'}"
                                        title={screenWidth < 1200
                                            ? "Open calendar picker"
                                            : ""}
                                    >
                                        <span
                                            class="text-xl font-semibold leading-none whitespace-nowrap capitalize"
                                        >
                                            {#if desktopCalendarView === "month"}
                                                {desktopMonthLabel}
                                            {:else}
                                                W{$currentWeek}
                                            {/if}
                                        </span>
                                        {#if desktopCalendarView === "week"}
                                            <span
                                                class="block text-xl leading-none text-muted-foreground whitespace-nowrap"
                                            >
                                                {currentWeekDateRange}
                                            </span>
                                        {/if}
                                    </button>

                                    <button
                                        on:click={() =>
                                            handleNavigateDesktopPeriod(1)}
                                        class="flex h-9 w-9 items-center justify-center rounded-3xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                        aria-label={desktopCalendarView ===
                                        "month"
                                            ? "Next month"
                                            : "Next week"}
                                        title={desktopCalendarView === "month"
                                            ? "Next month"
                                            : "Next week"}
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
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                    </button>
                                </div>
                                {#if !isViewingCurrentDesktopPeriod}
                                    <button
                                        on:click={handleJumpToToday}
                                        class="px-4 py-2 border border-border floating-glass-pill bg-secondary/10 text-secondary-foreground font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
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
                                    class="px-4 py-2 border border-border floating-glass-pill font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
                            {syncingActive
                                        ? 'bg-primary/10 text-primary-foreground'
                                        : 'bg-secondary/10 text-secondary-foreground hover:opacity-90'}"
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
                                    class="px-4 py-2 border border-border floating-glass-pill bg-secondary/10 text-secondary-foreground font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
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
                                    class="px-4 py-2 border border-border floating-glass-pill bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
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
                        <div class="flex flex-1 gap-4">
                            {#if screenWidth >= 1200}
                                <DesktopCalendarPickerSidebar
                                    currentWeek={$currentWeek}
                                    currentYear={$currentYear}
                                    desktopViewMode={desktopCalendarView}
                                    selectedMonthDate={desktopMonthDate}
                                    on:weekSelected={handleWeekSelected}
                                    on:monthSelected={handleMonthSelected}
                                />
                            {/if}
                            <div class="flex-1 overflow-hidden m-10 ml-5">
                                {#if desktopCalendarView === "month"}
                                    <MonthView
                                        referenceDate={desktopMonthDate}
                                        on:requestViewActivity={handleRequestViewActivity}
                                    />
                                {:else}
                                    <WeekView
                                        {isDesktop}
                                        on:requestViewActivity={handleRequestViewActivity}
                                        on:requestEditActivity={handleRequestEditActivity}
                                        on:requestDeleteActivity={handleRequestDeleteActivity}
                                    />
                                {/if}
                            </div>
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
                class="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-background to-background pr-3 pl-1 pb-3 backdrop-blur-lg pointer-events-none"
                style="padding-top: calc(0rem + env(safe-area-inset-top)); mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%);"
            >
                <div class="flex items-center justify-between gap-0.5">
                    {#if currentPage === "calendar"}
                        <div
                            class="pointer-events-auto flex items-center p-0.5"
                        >
                            <button
                                on:click={() => (showWeekPicker = true)}
                                class="pointer-events-auto flex items-center justify-center gap-2 rounded-3xl px-3 py-2 text-center text-foreground transition-colors hover:bg-muted hover:text-foreground"
                                aria-label="Pick week"
                                title={`Pick week · ${currentWeekDateRange}`}
                                type="button"
                            >
                                <span
                                    class="block text-xl font-semibold leading-none whitespace-nowrap"
                                >
                                    W{$currentWeek}
                                </span>
                                <span
                                    class="block text-xl leading-none text-muted-foreground whitespace-nowrap"
                                >
                                    {currentWeekDateRange}
                                </span>
                            </button>
                        </div>
                    {:else if currentPage === "settings" && settingsCurrentSubPage !== null}
                        <!-- Settings sub-page header: Back + Title (same style as calendar picker) -->
                        <div
                            class="pointer-events-auto flex items-center p-0.5"
                        >
                            <IconButton
                                on:click={() => settingsSheetInstance?.goBack()}
                                class="pointer-events-auto flex items-center justify-center ml-2 gap-2 rounded-3xl px-3 py-2 text-center text-foreground transition-colors hover:bg-muted hover:text-foreground"
                                aria-label="Back to settings"
                                type="button"
                            >
                                <svg
                                    class="h-5 w-5 shrink-0 text-muted-foreground"
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
                            </IconButton>
                            <span
                                class="block text-xl font-semibold leading-none whitespace-nowrap"
                            >
                                {settingsSubPageLabels[
                                    settingsCurrentSubPage
                                ] ?? settingsCurrentSubPage}
                            </span>
                        </div>
                    {:else}
                        <h1
                            class="min-w-0 text-2xl font-bold pointer-events-auto"
                        >
                            {getPageTitle(currentPage)}
                        </h1>
                    {/if}

                    <div
                        class="pointer-events-auto flex items-center floating-glass-surface floating-glass-pill p-0.5"
                    >
                        {#if currentPage === "settings" && settingsCurrentSubPage !== null}
                            <!-- Action buttons registered by the active sub-page -->
                            {#each $mobileHeaderActions as action}
                                <button
                                    on:click={action.onClick}
                                    class={`rounded-full px-3 py-2 text-sm font-semibold transition-colors active:bg-muted ${
                                        action.variant === "ghost"
                                            ? "text-muted-foreground hover:bg-muted"
                                            : "text-foreground hover:bg-muted"
                                    }`}
                                    type="button"
                                >
                                    {action.label}
                                </button>
                            {/each}
                        {:else if currentPage === "calendar"}
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
                        on:requestViewActivity={handleRequestViewActivity}
                        on:requestEditActivity={handleRequestEditActivity}
                        on:requestDeleteActivity={handleRequestDeleteActivity}
                    />
                </div>
            {:else if currentPage === "settings"}
                <div class="flex-1 overflow-hidden">
                    <SettingsSheet
                        bind:this={settingsSheetInstance}
                        isPage={true}
                        isDesktop={false}
                        initialSetting={settingsInitialSetting}
                        on:close={() => {
                            currentPage = "calendar";
                            settingsInitialSetting = null;
                            settingsCurrentSubPage = null;
                            mobileHeaderActions.set([]);
                        }}
                        on:subpage={(e) => {
                            settingsCurrentSubPage = e.detail.open
                                ? e.detail.setting
                                : null;
                        }}
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

            <!-- Floating Navigation Bar: hidden when a settings sub-page is open -->
            {#if !(currentPage === "settings" && settingsCurrentSubPage !== null)}
                <FloatingNav
                    activePage={currentPage}
                    on:navigateCalendar={handleOpenCalendarPage}
                    on:navigateSettings={handleOpenSettings}
                    on:navigateMessages={handleOpenMessagesPage}
                    on:navigateRegistrations={handleOpenRegistrationsPage}
                    on:navigateFiles={handleOpenFilesPage}
                />
            {/if}
        </div>
    {/if}
</main>

<!-- Modals/Sheets -->
{#if $cloudAuth.isAuthenticated && !$cloudAuth.requiresInitialTransferChoice && showAddActivity}
    <AddActivityModal on:close={handleCloseAddActivity} {isDesktop} />
{/if}

{#if $cloudAuth.isAuthenticated && !$cloudAuth.requiresInitialTransferChoice && showSettings}
    <SettingsSheet
        initialSetting={settingsInitialSetting}
        on:close={handleCloseSettings}
        {isDesktop}
    />
{/if}

{#if $cloudAuth.isAuthenticated && !$cloudAuth.requiresInitialTransferChoice && showWeekPicker && !isDesktop}
    <WeekPicker
        isDesktop={false}
        currentWeek={$currentWeek}
        currentYear={$currentYear}
        desktopViewMode="week"
        selectedMonthDate={desktopMonthDate}
        on:weekSelected={handleWeekSelected}
        on:monthSelected={handleMonthSelected}
        on:close={() => (showWeekPicker = false)}
    />
{/if}

{#if $cloudAuth.isAuthenticated && !$cloudAuth.requiresInitialTransferChoice && showExport}
    <ExportSheet on:close={() => (showExport = false)} {isDesktop} />
{/if}

{#if $cloudAuth.isAuthenticated && !$cloudAuth.requiresInitialTransferChoice && calendarPickerSheetOpen}
    <WeekPicker
        isDesktop={true}
        currentWeek={$currentWeek}
        currentYear={$currentYear}
        desktopViewMode={desktopCalendarView}
        selectedMonthDate={desktopMonthDate}
        on:weekSelected={handleWeekSelected}
        on:monthSelected={handleMonthSelected}
        on:close={() => (calendarPickerSheetOpen = false)}
    />
{/if}

{#if $cloudAuth.isAuthenticated && !$cloudAuth.requiresInitialTransferChoice && viewingActivity}
    <ActivityDetailsSheet
        {isDesktop}
        activity={viewingActivity}
        on:edit={handleEditFromDetails}
        on:close={handleCloseActivityDetails}
    />
{/if}

{#if $cloudAuth.isAuthenticated && !$cloudAuth.requiresInitialTransferChoice && editingActivity}
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
    isOpen={$cloudAuth.isAuthenticated &&
        !$cloudAuth.requiresInitialTransferChoice &&
        showDeleteConfirm}
    {isDesktop}
    title="Delete Activity"
    message={deletingActivity
        ? `Delete activity "${deletingActivity.summary}"?`
        : "Delete this activity?"}
    confirmLabel="Delete"
    cancelLabel="Cancel"
    variant="destructive"
    on:confirm={handleConfirmDelete}
    on:cancel={handleCancelDelete}
    on:close={handleCancelDelete}
/>

<!-- Sync Conflict Dialog -->
{#if $cloudAuth.isAuthenticated && !$cloudAuth.requiresInitialTransferChoice && showConflictDialog}
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
