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

<div class="space-y-4">
    <div class="rounded-3xl border border-border bg-muted/20 p-4">
        <div class="space-y-1">
            <h4 class="text-sm font-semibold text-foreground">
                Calendar subscriptions
            </h4>
            <p class="text-xs text-muted-foreground leading-relaxed">
                Connect iCal feeds to keep your weekly overview in sync with
                external calendars.
            </p>
        </div>
    </div>

    <section class="rounded-3xl border border-border bg-card/30 p-4 sm:p-5">
        <div class="mb-4 space-y-1">
            <h4 class="text-sm font-semibold text-foreground">Overview</h4>
            <p class="text-xs text-muted-foreground leading-relaxed">
                Review how many subscriptions are connected and refresh them
                when needed.
            </p>
        </div>

        <div class="grid grid-cols-2 gap-3">
            <div
                class="rounded-2xl border border-border/70 bg-background/40 p-3"
            >
                <p
                    class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
                >
                    Subscriptions
                </p>
                <p class="mt-2 text-lg font-semibold text-foreground">
                    {subscriptions.length}
                </p>
            </div>
            <div
                class="rounded-2xl border border-border/70 bg-background/40 p-3"
            >
                <p
                    class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
                >
                    Active
                </p>
                <p class="mt-2 text-lg font-semibold text-foreground">
                    {subscriptions.filter(
                        (subscription) => subscription.enabled,
                    ).length}
                </p>
            </div>
        </div>

        {#if subscriptions.length > 0 && !showNewSubscription}
            <div class="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                    variant="secondary"
                    class="sm:w-auto"
                    disabled={isLoading}
                    on:click={onRefreshAll}
                >
                    {isLoading ? "Refreshing..." : "Refresh all subscriptions"}
                </Button>
                <Button
                    variant="secondary"
                    class="sm:w-auto"
                    on:click={onShowNewSubscription}
                >
                    Add subscription
                </Button>
            </div>
        {/if}
    </section>

    <section class="rounded-3xl border border-border bg-card/30 p-4 sm:p-5">
        <div class="mb-4 space-y-1">
            <h4 class="text-sm font-semibold text-foreground">
                Connected calendars
            </h4>
            <p class="text-xs text-muted-foreground leading-relaxed">
                Enable, refresh, or remove individual feeds.
            </p>
        </div>

        {#if subscriptions.length === 0 && !showNewSubscription}
            <div
                class="rounded-2xl border border-border/70 bg-background/40 p-4 text-center"
            >
                <p class="text-sm text-muted-foreground">
                    No iCal subscriptions yet
                </p>
                <p class="mt-1 text-xs text-muted-foreground">
                    Add a calendar feed by entering an iCal URL.
                </p>
            </div>
        {:else if !showNewSubscription}
            <div class="space-y-3">
                {#each subscriptions as subscription}
                    <div
                        class="rounded-2xl border border-border/70 bg-background/40 p-4 space-y-3"
                    >
                        <div class="flex items-start justify-between gap-3">
                            <div class="min-w-0 flex-1 space-y-1">
                                <div
                                    class="font-semibold text-foreground text-sm"
                                >
                                    {subscription.name}
                                </div>
                                <div
                                    class="text-xs text-muted-foreground break-all"
                                    title={subscription.url}
                                >
                                    {middleEllipsis(
                                        subscription.url,
                                        compact ? 60 : 80,
                                    )}
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
                                <span
                                    class="text-xs text-muted-foreground select-none"
                                >
                                    {subscription.enabled
                                        ? "Active"
                                        : "Inactive"}
                                </span>
                            </label>
                        </div>

                        <div
                            class="flex flex-wrap gap-3 text-xs text-muted-foreground"
                        >
                            {#if subscription.lastFetched}
                                <span>
                                    Last fetched: {new Date(
                                        subscription.lastFetched,
                                    ).toLocaleString()}
                                </span>
                            {/if}
                            {#if itemCount(subscription.id) > 0}
                                <span>
                                    {itemCount(subscription.id)} event{itemCount(
                                        subscription.id,
                                    ) !== 1
                                        ? "s"
                                        : ""}
                                </span>
                            {/if}
                        </div>

                        <div class="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                class="flex-1"
                                disabled={isLoading || !subscription.enabled}
                                on:click={() =>
                                    onRefreshSubscription(subscription.id)}
                            >
                                {isLoading ? "Refreshing..." : "Refresh"}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                class="text-destructive hover:bg-destructive/10"
                                on:click={() =>
                                    onDeleteSubscription(subscription.id)}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </section>

    <section class="rounded-3xl border border-border bg-card/30 p-4 sm:p-5">
        <div class="mb-4 space-y-1">
            <h4 class="text-sm font-semibold text-foreground">
                Add subscription
            </h4>
            <p class="text-xs text-muted-foreground leading-relaxed">
                Paste an iCal URL and optionally give it a friendly name.
            </p>
        </div>

        {#if showNewSubscription}
            <div
                class="space-y-3 rounded-2xl border border-border/70 bg-background/40 p-4"
            >
                {#if showTitles}
                    <p
                        class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
                    >
                        New calendar feed
                    </p>
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
                        {isLoading ? "Adding..." : "Add subscription"}
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
        {:else if subscriptions.length === 0}
            <Button
                variant="secondary"
                class="w-full sm:w-auto"
                on:click={onShowNewSubscription}
            >
                Add subscription
            </Button>
        {:else}
            <div
                class="rounded-2xl border border-border/70 bg-background/40 p-4"
            >
                <p class="text-sm text-muted-foreground">
                    Use “Add subscription” above to connect another calendar
                    feed.
                </p>
            </div>
        {/if}
    </section>
</div>
