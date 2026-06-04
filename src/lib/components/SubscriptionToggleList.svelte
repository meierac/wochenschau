<script lang="ts">
    import { subscriptions } from "../stores/ical";
    import { activities } from "../stores/activities";
    import { refreshStatus } from "../stores/refreshStatus";
    import type { ICalSubscription, CalendarItem } from "../types/index";
    import { parseICalToCalendarItems } from "../services/icalService";

    let syncingSubscriptionId: string | null = null;

    function handleToggleSubscription(subscription: ICalSubscription) {
        subscriptions.updateSubscription({
            ...subscription,
            enabled: !subscription.enabled,
        });
    }

    async function handleSyncSubscription(
        event: MouseEvent,
        subscription: ICalSubscription,
    ) {
        event.stopPropagation();

        if (syncingSubscriptionId) return; // Already syncing

        syncingSubscriptionId = subscription.id;

        try {
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
                subscription.id,
            );
            refreshStatus.incrementCounters({ fetched: incomingItems.length });

            // DIFF
            refreshStatus.setPhase("diffing");
            const existing = $activities.filter(
                (a) => a.source === "ical" && a.sourceId === subscription.id,
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
                    // Determine if remote fields changed
                    const changed =
                        prev.dtstart !== item.dtstart ||
                        prev.dtend !== item.dtend ||
                        prev.summary !== item.summary ||
                        prev.description !== item.description;

                    if (changed) {
                        // Preserve local overrides and timestamps
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

            // For now, skip conflict dialog in sidebar and auto-apply
            // (You can add conflict handling later if needed)
            refreshStatus.setPhase("updating");

            // Bulk apply changes
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

            refreshStatus.setPhase("completed");
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            console.error(`Failed to sync ${subscription.name}:`, message);
            refreshStatus.fail(e);
        } finally {
            syncingSubscriptionId = null;
        }
    }

    function getInitials(name: string): string {
        return name
            .split(" ")
            .map((word) => word[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase();
    }
</script>

<div class="space-y-3">
    <h4 class="text-sm font-semibold text-foreground px-1">Subscriptions</h4>

    {#if $subscriptions.length === 0}
        <div class="rounded-xl bg-muted/40 px-4 py-6 text-center">
            <p class="text-sm text-muted-foreground">
                No calendar subscriptions yet
            </p>
        </div>
    {:else}
        <div class="space-y-2">
            {#each $subscriptions as subscription (subscription.id)}
                <div
                    class="flex w-full items-center gap-3 rounded-xl bg-muted/60 px-3 py-3"
                >
                    <!-- Color indicator / Avatar -->
                    <button
                        type="button"
                        on:click={() => handleToggleSubscription(subscription)}
                        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-80"
                        style="background-color: {subscription.color ||
                            '#6366f1'};"
                    >
                        {getInitials(subscription.name)}
                    </button>

                    <!-- Name and status -->
                    <button
                        type="button"
                        on:click={() => handleToggleSubscription(subscription)}
                        class="min-w-0 flex-1 text-left"
                    >
                        <div
                            class="truncate text-sm font-semibold text-foreground"
                        >
                            {subscription.name}
                        </div>
                        {#if subscription.lastFetched}
                            {@const isRecent =
                                Date.now() - subscription.lastFetched <
                                24 * 60 * 60 * 1000}
                            <div
                                class="text-xs {isRecent
                                    ? 'text-muted-foreground'
                                    : 'text-destructive'}"
                            >
                                {isRecent ? "Synced recently" : "Sync outdated"}
                            </div>
                        {:else}
                            <div class="text-xs text-muted-foreground">
                                Not synced yet
                            </div>
                        {/if}
                    </button>

                    <!-- Sync button -->
                    <button
                        type="button"
                        on:click={(e) =>
                            handleSyncSubscription(e, subscription)}
                        disabled={syncingSubscriptionId === subscription.id}
                        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
                        aria-label="Sync subscription"
                    >
                        <svg
                            class="h-4 w-4 {syncingSubscriptionId ===
                            subscription.id
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
                            ></path>
                        </svg>
                    </button>

                    <!-- Toggle switch -->
                    <button
                        type="button"
                        on:click={() => handleToggleSubscription(subscription)}
                        class="relative h-6 w-11 shrink-0 rounded-full transition-colors {subscription.enabled
                            ? 'bg-primary'
                            : 'bg-muted-foreground/30'}"
                        aria-label="Toggle subscription"
                    >
                        <div
                            class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform {subscription.enabled
                                ? 'left-[1.375rem]'
                                : 'left-0.5'}"
                        ></div>
                    </button>
                </div>
            {/each}
        </div>
    {/if}
</div>
