<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { templates } from "../stores/templates";
    import { subscriptions } from "../stores/ical";
    import { activities } from "../stores/activities";
    import { bibleVerse } from "../stores/bibleVerse";
    import { exportSettings } from "../stores/exportSettings";
    import type {
        ActivityTemplate,
        ICalSubscription,
        CalendarItem,
    } from "../types/index";
    import IconButton from "./IconButton.svelte";
    import Button from "./Button.svelte";
    import SwipeableSheet from "./SwipeableSheet.svelte";
    import SettingIcon from "./SettingIcon.svelte";
    import SubscriptionManagerPanel from "./SubscriptionManagerPanel.svelte";
    import ExportSettingsPanel from "./ExportSettingsPanel.svelte";
    import { icalService } from "../services/icalService";
    import {
        refreshStatus,
        refreshProgress,
        refreshSummary,
    } from "../stores/refreshStatus";
    import SyncConflictDialog from "./SyncConflictDialog.svelte";
    import ConfirmDialog from "./ConfirmDialog.svelte";
    import type { SyncConflict, ConflictResolution } from "../types/index";
    import type { SubscriptionDiff } from "../services/icalService";
    import { createEntityId } from "../utils/storage";

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

    type PendingSingleDiff = {
        kind: "single";
        added: CalendarItem[];
        updated: CalendarItem[];
        removed: CalendarItem[];
        conflicts: CalendarItem[];
        subscriptionId: string;
        subscriptionName: string;
    };

    type PendingAggregatedDiffs = {
        kind: "aggregated";
        diffs: SubscriptionDiff[];
    };

    type PendingRefreshState = PendingSingleDiff | PendingAggregatedDiffs;

    // Conflict dialog state
    let showConflictDialog = false;
    let pendingConflicts: SyncConflict[] = [];
    let pendingDiff: PendingRefreshState | null = null;

    type PendingConfirmAction =
        | { kind: "reset-export" }
        | { kind: "delete-template"; id: string }
        | { kind: "delete-subscription"; id: string };

    let pendingConfirmAction: PendingConfirmAction | null = null;
    // Abort controller for bulk refresh (quick win to allow cancellation parity with App)
    let refreshAbortController: AbortController | null = null;

    function handleConflictResolution(event: CustomEvent<ConflictResolution>) {
        const resolution = event.detail;

        if (pendingDiff?.kind === "aggregated") {
            // Dynamic import to avoid top-level edit (tooling constraints)
            (async () => {
                const { refreshService } =
                    await import("../services/refreshService");
                const strategy =
                    resolution === "use-synced" ? "use-synced" : "keep-local";

                // Apply all diffs using chosen strategy
                const applied = refreshService.applyAllDiffs(
                    $activities,
                    pendingDiff.diffs,
                    { strategy },
                );

                activities.replaceAll(applied);

                // Update lastFetched for all affected subscriptions
                subscriptions.markFetchedMany(
                    pendingDiff.diffs.map((d) => d.subscriptionId),
                );

                showConflictDialog = false;
                pendingConflicts = [];
                pendingDiff = null;
                refreshStatus.setPhase("completed");
            })();

            return;
        }

        // Legacy single-subscription path (fallback)
        if (!pendingDiff) {
            showConflictDialog = false;
            return;
        }

        if (pendingDiff.kind !== "single") {
            showConflictDialog = false;
            return;
        }

        const { added, updated, removed, conflicts, subscriptionId } =
            pendingDiff;

        const updatesToApply =
            resolution === "keep-local"
                ? updated.filter((u) => !conflicts.find((c) => c.id === u.id))
                : updated;

        activities.bulkApplySubscriptionChanges({
            added,
            updated: updatesToApply,
            removed,
        });

        subscriptions.markFetched(subscriptionId);

        showConflictDialog = false;
        pendingConflicts = [];
        pendingDiff = null;
        refreshStatus.setPhase("updating");
    }

    function handleResetExportSettings() {
        pendingConfirmAction = { kind: "reset-export" };
    }

    // Template operations
    function handleAddTemplate() {
        if (!newTemplate.name.trim()) return;

        const createdAt = Date.now();
        const template: ActivityTemplate = {
            id: createEntityId("template"),
            name: newTemplate.name,
            startTime: newTemplate.startTime,
            endTime: newTemplate.endTime,
            createdAt,
        };

        templates.addTemplate(template);
        showNewTemplate = false;
        newTemplate = { name: "", startTime: "09:00", endTime: "10:00" };
    }

    function handleDeleteTemplate(id: string) {
        pendingConfirmAction = { kind: "delete-template", id };
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

            const lastFetched = Date.now();
            const subscription: ICalSubscription = {
                id: createEntityId("sub"),
                url: newSubscription.url,
                name: newSubscription.name || "iCal Feed",
                lastFetched,
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
                    kind: "single",
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
            subscriptions.markFetched(subscription.id);
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
        pendingConfirmAction = { kind: "delete-subscription", id };
    }

    function handleConfirmAction() {
        const action = pendingConfirmAction;
        if (!action) return;

        if (action.kind === "reset-export") {
            exportSettings.reset();
        } else if (action.kind === "delete-template") {
            templates.removeTemplate(action.id);
        } else if (action.kind === "delete-subscription") {
            const itemsToRemove = $activities.filter(
                (a) => a.sourceId === action.id && a.source === "ical",
            );
            for (const item of itemsToRemove) {
                activities.removeActivity(item.id);
            }
            subscriptions.removeSubscription(action.id);
        }

        pendingConfirmAction = null;
    }

    async function handleRefreshAll() {
        error = "";
        const enabledSubs = $subscriptions.filter((s) => s.enabled);
        refreshStatus.start(enabledSubs.length);
        isLoading = true;

        try {
            // Build existing items map
            const existingMap = new Map(
                enabledSubs.map((sub) => [
                    sub.id,
                    $activities.filter(
                        (a) => a.source === "ical" && a.sourceId === sub.id,
                    ),
                ]),
            );

            // Dynamic import refreshService (avoid top-level import edit)
            const { refreshService } =
                await import("../services/refreshService");

            // Make bulk refresh abortable (quick win)
            refreshAbortController = new AbortController();
            let diffs, aggregatedConflicts;
            try {
                ({ diffs, aggregatedConflicts } =
                    await refreshService.fetchAndDiffAll(
                        enabledSubs,
                        existingMap,
                        {
                            parallel: true,
                            signal: refreshAbortController.signal,
                            onPhase: (phase) => {
                                // Map generic phases to refreshStatus phases
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
                                else if (phase === "error")
                                    refreshStatus.setPhase("error");
                            },
                        },
                    ));
            } finally {
                refreshAbortController = null;
            }

            if (aggregatedConflicts.length > 0) {
                // Store aggregated conflicts and diffs for single dialog resolution
                pendingConflicts = aggregatedConflicts;
                pendingDiff = {
                    kind: "aggregated",
                    diffs,
                };
                showConflictDialog = true;
                refreshStatus.setPhase("conflict-check");
                return;
            }

            // No conflicts: auto apply with use-synced strategy
            const applied = refreshService.applyAllDiffs($activities, diffs, {
                strategy: "use-synced",
            });

            activities.replaceAll(applied);

            // Update lastFetched on all affected subscriptions
            subscriptions.markFetchedMany(diffs.map((d) => d.subscriptionId));

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
        // If the settings sheet is being closed while the conflict dialog is open,
        // automatically resolve using the keep-local strategy so pending diffs don't remain orphaned.
        if (showConflictDialog) {
            handleConflictResolution(
                new CustomEvent<ConflictResolution>("resolve", {
                    detail: "keep-local",
                }),
            );
        }
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
        return icalService.parseICalToCalendarItems(iCalText, subscriptionId);
    }

    // buildCalendarItem removed (handled in icalService)

    // extractDate removed (handled in icalService)

    // extractTime removed (handled in icalService)

    // decodeICalText removed (handled in icalService)

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
        <ConfirmDialog
            isOpen={pendingConfirmAction !== null}
            {isDesktop}
            title={pendingConfirmAction?.kind === "reset-export"
                ? "Reset Export Settings"
                : pendingConfirmAction?.kind === "delete-template"
                  ? "Delete Template"
                  : "Delete Subscription"}
            message={pendingConfirmAction?.kind === "reset-export"
                ? "Reset all export settings to default?"
                : pendingConfirmAction?.kind === "delete-template"
                  ? "Delete this template?"
                  : "Delete this subscription and its imported events?"}
            confirmLabel={pendingConfirmAction?.kind === "reset-export"
                ? "Reset"
                : "Delete"}
            cancelLabel="Cancel"
            variant={pendingConfirmAction?.kind === "reset-export"
                ? "default"
                : "destructive"}
            on:confirm={handleConfirmAction}
            on:close={() => (pendingConfirmAction = null)}
        />
        <!-- Header (Always on top) -->
        <div
            class={`${isDesktop ? "border-b border-border min-h-[70px]" : ""} px-3 py-3 flex items-center justify-center relative shrink-0`}
        >
            <!-- Mobile: Back button when viewing details (left position) -->
            {#if !isDesktop && selectedSetting}
                <div class="absolute left-3 top-3">
                    <Button
                        on:click={backToList}
                        class="text-secondary-foreground bg-muted hover:bg-muted/80 flex items-center gap-2"
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
                                    class="w-full p-4 bg-muted/50 border border-border transition-colors text-left flex items-center justify-between gap-3"
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
                            <SubscriptionManagerPanel
                                subscriptions={$subscriptions}
                                {isLoading}
                                {showNewSubscription}
                                {newSubscription}
                                {itemCount}
                                onToggleSubscription={(id, enabled) =>
                                    handleToggleSubscription(id, enabled)}
                                onRefreshSubscription={handleRefresh}
                                onDeleteSubscription={handleDeleteSubscription}
                                onAddSubscription={handleAddSubscription}
                                onCancelNewSubscription={() => {
                                    showNewSubscription = false;
                                    newSubscription = {
                                        url: "",
                                        name: "",
                                    };
                                    error = "";
                                }}
                                onShowNewSubscription={() =>
                                    (showNewSubscription = true)}
                                onRefreshAll={handleRefreshAll}
                                compact={true}
                                showTitles={false}
                            />
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
                            <ExportSettingsPanel
                                variant="mobile"
                                on:reset={handleResetExportSettings}
                            />
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

                        <SubscriptionManagerPanel
                            subscriptions={$subscriptions}
                            {isLoading}
                            {showNewSubscription}
                            {newSubscription}
                            {itemCount}
                            onToggleSubscription={(id, enabled) =>
                                handleToggleSubscription(id, enabled)}
                            onRefreshSubscription={handleRefresh}
                            onDeleteSubscription={handleDeleteSubscription}
                            onAddSubscription={handleAddSubscription}
                            onCancelNewSubscription={() => {
                                showNewSubscription = false;
                                newSubscription = {
                                    url: "",
                                    name: "",
                                };
                                error = "";
                            }}
                            onShowNewSubscription={() =>
                                (showNewSubscription = true)}
                            onRefreshAll={handleRefreshAll}
                            compact={false}
                            showTitles={true}
                        />
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

                        <ExportSettingsPanel
                            variant="desktop"
                            on:reset={handleResetExportSettings}
                        />
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
