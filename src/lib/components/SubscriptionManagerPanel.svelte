<script lang="ts">
    import Button from "./Button.svelte";
    import type { ICalSubscription } from "../types/index";

    export let subscriptions: ICalSubscription[] = [];
    export let isLoading = false;
    export let showNewSubscription = false;
    export let newSubscription = {
        url: "",
        name: "",
    };
    export let itemCount: (subscriptionId: string) => number;
    export let onToggleSubscription: (id: string, enabled: boolean) => void;
    export let onRefreshSubscription: (id: string) => void;
    export let onDeleteSubscription: (id: string) => void;
    export let onAddSubscription: () => void;
    export let onCancelNewSubscription: () => void;
    export let onShowNewSubscription: () => void;
    export let onRefreshAll: () => void;
    export let compact = false;
    export let showTitles = true;

    function middleEllipsis(url: string, max: number = 60) {
        if (!url) return "";
        if (url.length <= max) return url;
        const half = Math.floor((max - 3) / 2);
        const start = url.slice(0, half + (max % 2));
        const end = url.slice(-half);
        return `${start}...${end}`;
    }
</script>

{#if subscriptions.length === 0 && !showNewSubscription}
    <div class="text-center py-8">
        <p class="text-muted-foreground text-sm">No iCal subscriptions yet</p>
        <p class="text-muted-foreground text-xs mt-1">
            Add a calendar feed by entering an iCal URL
        </p>
    </div>
{:else if !showNewSubscription}
    <div class="space-y-2 {compact ? '' : 'mb-4'}">
        {#each subscriptions as subscription}
            <div class="p-3 bg-muted rounded-lg border border-border space-y-2">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="font-semibold text-foreground text-sm">
                            {subscription.name}
                        </div>
                        <div
                            class="text-xs text-muted-foreground truncate"
                            title={subscription.url}
                        >
                            {middleEllipsis(subscription.url, compact ? 60 : 80)}
                        </div>
                    </div>
                    <label
                        class="flex items-center gap-2 cursor-pointer shrink-0"
                    >
                        <input
                            type="checkbox"
                            checked={subscription.enabled}
                            aria-label="Toggle subscription active state"
                            on:change={(e) =>
                                onToggleSubscription(
                                    subscription.id,
                                    e.currentTarget.checked,
                                )}
                            class="rounded border-input"
                        />
                        {#if !compact}
                            <span
                                class="text-xs text-muted-foreground select-none"
                            >
                                {subscription.enabled ? "Active" : "Inactive"}
                            </span>
                        {/if}
                    </label>
                </div>

                {#if subscription.lastFetched}
                    <div class="text-xs text-muted-foreground">
                        Last fetched: {new Date(
                            subscription.lastFetched,
                        ).toLocaleString()}
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
                        on:click={() => onRefreshSubscription(subscription.id)}
                        disabled={isLoading || !subscription.enabled}
                        class="flex-1 px-3 py-1 text-xs font-semibold text-foreground hover:bg-background rounded transition-colors disabled:opacity-50 disabled:pointer-events-none"
                        aria-disabled={!subscription.enabled}
                        title={!subscription.enabled
                            ? "Enable subscription to refresh"
                            : "Refresh subscription"}
                    >
                        {isLoading
                            ? compact
                                ? "Loading..."
                                : "Refreshing..."
                            : "Refresh"}
                    </button>
                    <button
                        on:click={() => onDeleteSubscription(subscription.id)}
                        class="px-3 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        {/each}
    </div>
{/if}

{#if showNewSubscription}
    <div
        class="p-3 bg-muted rounded-lg border border-border space-y-3 {compact
            ? ''
            : 'max-w-md'}"
    >
        {#if showTitles}
            <h4 class="font-semibold text-sm">Add New Subscription</h4>
        {/if}
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
                disabled={!newSubscription.url.trim() || isLoading}
                on:click={onAddSubscription}
            >
                {isLoading ? "Adding..." : "Add"}
            </Button>
            <Button
                variant="secondary"
                class="flex-1"
                on:click={onCancelNewSubscription}
            >
                Cancel
            </Button>
        </div>
    </div>
{:else}
    <Button
        variant="secondary"
        class={compact ? "w-full mt-4" : "mb-4"}
        on:click={onShowNewSubscription}
    >
        + Add Subscription
    </Button>
{/if}

{#if subscriptions.length > 0 && !showNewSubscription}
    <Button
        variant="secondary"
        class={compact ? "w-full mt-4" : ""}
        disabled={isLoading}
        on:click={onRefreshAll}
    >
        {isLoading ? "Refreshing..." : "Refresh All"}
    </Button>
{/if}
