<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { subscriptions } from "../stores/ical";
    import { activities } from "../stores/activities";
    import type { ICalSubscription, CalendarItem } from "../types/index";
    import Button from "./Button.svelte";
    import { icalService } from "../services/icalService";

    export let isDesktop = false;

    const dispatch = createEventDispatcher();

    let showNewSubscription = false;
    let newSubscription = {
        url: "",
        name: "",
    };
    let isLoading = false;
    let error: string | null = null;

    function handleAddSubscription() {
        if (!newSubscription.url.trim() || !newSubscription.name.trim()) return;

        const subscription: ICalSubscription = {
            id: `ical-${Date.now()}`,
            url: newSubscription.url,
            name: newSubscription.name,
            enabled: true,
            lastFetched: Date.now(),
        };

        subscriptions.addSubscription(subscription);
        showNewSubscription = false;
        newSubscription = { url: "", name: "" };
    }

    async function handleRefresh(id: string) {
        isLoading = true;
        error = null;
        try {
            const subscription = $subscriptions.find((s) => s.id === id);
            if (!subscription) return;

            // Fetch iCal data
            const response = await fetch(subscription.url);
            if (!response.ok) throw new Error("Failed to fetch iCal");

            const text = await response.text();
            const calendarItems = parseICalToCalendarItems(text, id);

            // Remove old items from this subscription
            const oldActivities = $activities.filter(
                (a) => a.sourceId === id && a.source === "ical",
            );
            for (const oldActivity of oldActivities) {
                activities.removeActivity(oldActivity.id);
            }

            // Add new calendar items
            for (const item of calendarItems) {
                activities.addActivity(item);
            }

            // Update subscription metadata
            const updated: ICalSubscription = {
                ...subscription,
                lastFetched: Date.now(),
            };
            subscriptions.updateSubscription(updated);
        } catch (err) {
            error = err instanceof Error ? err.message : "Unknown error";
        } finally {
            isLoading = false;
        }
    }

    function parseICalToCalendarItems(
        iCalText: string,
        subscriptionId: string,
    ): CalendarItem[] {
        // Delegate to unified icalService implementation
        return icalService.parseICalToCalendarItems(iCalText, subscriptionId);
    }

    // Obsolete helper functions removed.
    // Parsing & item construction now delegated to icalService.parseICalToCalendarItems.

    function handleToggleSubscription(id: string) {
        const subscription = $subscriptions.find((s) => s.id === id);
        if (subscription) {
            subscriptions.updateSubscription({
                ...subscription,
                enabled: !subscription.enabled,
            });
        }
    }

    function handleDeleteSubscription(id: string) {
        if (confirm("Delete this subscription?")) {
            // Remove associated calendar items
            const itemsToRemove = $activities.filter(
                (a) => a.sourceId === id && a.source === "ical",
            );
            for (const item of itemsToRemove) {
                activities.removeActivity(item.id);
            }
            subscriptions.removeSubscription(id);
        }
    }

    function handleRefreshAll() {
        $subscriptions.forEach((sub) => {
            if (sub.enabled) {
                handleRefresh(sub.id);
            }
        });
    }

    function handleClose() {
        dispatch("close");
    }

    // Format long URLs with a middle ellipsis so protocol + domain and tail are visible.
    function middleEllipsis(url: string, max: number = 60) {
        if (!url) return "";
        if (url.length <= max) return url;
        const half = Math.floor((max - 3) / 2);
        const start = url.slice(0, half + (max % 2));
        const end = url.slice(-half);
        return `${start}...${end}`;
    }

    $: itemCount = (subscriptionId: string) => {
        return $activities.filter(
            (a) => a.sourceId === subscriptionId && a.source === "ical",
        ).length;
    };
</script>

<div
    class="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-3"
>
    <div
        class={`bg-card rounded-2xl md:rounded-lg shadow-lg w-full transition-all flex flex-col ${
            isDesktop ? "md:max-w-md" : ""
        }`}
    >
        <!-- Header -->
        <div
            class="border-b border-border px-6 py-4 flex items-center justify-between"
        >
            <h3 class="text-lg font-semibold text-foreground">
                iCal Subscriptions
            </h3>
            <button
                on:click={handleClose}
                class="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
            >
                ✕
            </button>
        </div>

        <!-- Content -->
        <div class="p-3 max-h-[60vh] overflow-y-auto">
            {#if error}
                <div
                    class="mb-4 p-3 bg-destructive/10 border border-destructive rounded-lg"
                >
                    <p class="text-sm text-destructive">{error}</p>
                </div>
            {/if}

            {#if $subscriptions.length === 0 && !showNewSubscription}
                <div class="text-center py-8">
                    <p class="text-muted-foreground text-sm">
                        No subscriptions yet
                    </p>
                    <p class="text-muted-foreground text-xs mt-1">
                        Add an iCal link to import events
                    </p>
                </div>
            {:else}
                <div class="space-y-2">
                    {#each $subscriptions as subscription}
                        <div
                            class="p-3 bg-muted rounded-lg border border-border space-y-2"
                        >
                            <div class="flex items-center justify-between">
                                <div class="flex-1">
                                    <div
                                        class="font-semibold text-foreground text-sm"
                                    >
                                        {subscription.name}
                                    </div>
                                    <div
                                        class="text-xs text-muted-foreground truncate"
                                        title={subscription.url}
                                    >
                                        {middleEllipsis(subscription.url, 60)}
                                    </div>
                                </div>
                                <label
                                    class="flex items-center gap-2 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={subscription.enabled}
                                        aria-label="Toggle subscription active state"
                                        on:change={() =>
                                            handleToggleSubscription(
                                                subscription.id,
                                            )}
                                        class="w-4 h-4 rounded cursor-pointer"
                                    />
                                    <span
                                        class="text-xs text-muted-foreground select-none"
                                    >
                                        {subscription.enabled
                                            ? "Active"
                                            : "Inactive"}
                                    </span>
                                </label>
                            </div>

                            {#if subscription.lastFetched}
                                <div class="text-xs text-muted-foreground">
                                    Last fetched: {new Date(
                                        subscription.lastFetched,
                                    ).toLocaleDateString()}
                                </div>
                            {/if}

                            {#if itemCount(subscription.id) > 0}
                                <div class="text-xs text-muted-foreground">
                                    {itemCount(subscription.id)} event{itemCount(
                                        subscription.id,
                                    ) !== 1
                                        ? "s"
                                        : ""}
                                </div>
                            {/if}

                            <div class="flex gap-2">
                                <button
                                    on:click={() =>
                                        handleRefresh(subscription.id)}
                                    disabled={isLoading ||
                                        !subscription.enabled}
                                    class="flex-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded active:opacity-80 transition-opacity disabled:opacity-50"
                                    aria-disabled={!subscription.enabled}
                                    title={!subscription.enabled
                                        ? "Enable subscription to refresh"
                                        : "Refresh subscription"}
                                >
                                    {isLoading
                                        ? "Loading..."
                                        : subscription.enabled
                                          ? "Refresh"
                                          : "Disabled"}
                                </button>
                                <button
                                    on:click={() =>
                                        handleDeleteSubscription(
                                            subscription.id,
                                        )}
                                    class="flex-1 px-2 py-1 text-xs bg-destructive/20 text-destructive rounded active:opacity-80 transition-opacity"
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
                    class="mt-4 p-3 bg-muted rounded-lg border border-border space-y-3"
                >
                    <input
                        type="text"
                        bind:value={newSubscription.name}
                        placeholder="Subscription name"
                        class="w-full px-3 py-2 bg-background border border-input rounded text-foreground text-sm"
                    />
                    <input
                        type="url"
                        bind:value={newSubscription.url}
                        placeholder="iCal URL (https://...)"
                        class="w-full px-3 py-2 bg-background border border-input rounded text-foreground text-sm"
                    />
                    <div class="flex gap-2">
                        <Button
                            variant="default"
                            size="sm"
                            class="flex-1"
                            on:click={handleAddSubscription}
                        >
                            Add
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            class="flex-1"
                            on:click={() => (showNewSubscription = false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            {:else}
                <Button
                    variant="secondary"
                    class="w-full mt-4"
                    on:click={() => (showNewSubscription = true)}
                >
                    + Add Subscription
                </Button>
            {/if}
        </div>

        <!-- Actions -->
        <div class="border-t border-border px-6 py-4 flex gap-2">
            {#if $subscriptions.length > 0}
                <Button
                    variant="secondary"
                    size="sm"
                    class="flex-1"
                    on:click={handleRefreshAll}
                    disabled={isLoading}
                >
                    Refresh All
                </Button>
            {/if}
            <Button variant="secondary" class="flex-1" on:click={handleClose}>
                Close
            </Button>
        </div>
    </div>
</div>
