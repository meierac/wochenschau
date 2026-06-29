<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { CalendarItem, ICalSubscription } from "../types/index";
    import { subscriptions } from "../stores/ical";
    import { isAllDayActivity } from "../utils/activityDisplay";
    import IconButton from "./IconButton.svelte";
    import SwipeableSheet from "./SwipeableSheet.svelte";

    export let activity: CalendarItem;
    export let isDesktop = false;

    const dispatch = createEventDispatcher<{
        close: void;
        edit: CalendarItem;
    }>();

    function handleClose() {
        dispatch("close");
    }

    function handleEdit() {
        dispatch("edit", activity);
    }

    function parseDateKey(dateKey: string): Date | null {
        if (!/^\d{8}$/.test(dateKey)) return null;

        const year = Number(dateKey.slice(0, 4));
        const month = Number(dateKey.slice(4, 6)) - 1;
        const day = Number(dateKey.slice(6, 8));
        const date = new Date(year, month, day);

        return Number.isNaN(date.getTime()) ? null : date;
    }

    function formatDate(dateKey: string): string {
        const date = parseDateKey(dateKey);
        if (!date) return dateKey;

        return date.toLocaleDateString("de-DE", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }

    function formatTimeRange(activity: CalendarItem): string {
        if (isAllDayActivity(activity)) return "All-Day";
        return `${activity.startTime} – ${activity.endTime}`;
    }

    const overrideFieldLabels: Record<string, string> = {
        summary: "Title",
        description: "Description",
        location: "Location",
        dtstart: "Start",
        dtend: "End",
        color: "Color",
    };

    function formatSource(activity: CalendarItem): string {
        if (activity.source === "manual") return "Manual event";
        if (activity.source === "template") return "From template";

        const subscription = $subscriptions.find(
            (sub: ICalSubscription) => sub.id === activity.sourceId,
        );

        return subscription ? subscription.name : "Calendar subscription";
    }

    function getOverrideLabels(activity: CalendarItem): string[] {
        return Object.keys(activity.localOverrides ?? {}).map(
            (field) => overrideFieldLabels[field] ?? field,
        );
    }

    $: isMultiDay = activity.endDate && activity.endDate !== activity.startDate;
    $: accentColor = activity.color ?? "var(--primary)";
    $: overrideLabels = getOverrideLabels(activity);
    $: hasLocalOverrides = overrideLabels.length > 0;
</script>

<SwipeableSheet {isDesktop} desktopMaxWidth="30rem" on:close={handleClose}>
    <div class="px-3 py-3 flex items-center justify-between">
        <IconButton
            variant="secondary"
            size="lg"
            ariaLabel="Close event details"
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

        <h3
            class="min-w-0 flex-1 px-3 text-center text-lg font-semibold text-foreground"
        >
            Event Details
        </h3>

        <IconButton
            variant="secondary"
            size="lg"
            ariaLabel="Edit event"
            title="Edit event"
            on:click={handleEdit}
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
            </svg>
        </IconButton>
    </div>

    <div class="sheet-content max-h-[65vh] overflow-y-auto px-4 pb-6 pt-1">
        <div class="space-y-5">
            <div class="rounded-3xl border border-border bg-card/50 p-4">
                <div class="flex items-start gap-3">
                    <div
                        class="mt-1 h-4 w-4 shrink-0 rounded-full"
                        style="background-color: {accentColor};"
                        aria-hidden="true"
                    ></div>
                    <div class="min-w-0 flex-1">
                        <h4
                            class="break-words text-xl font-bold text-foreground"
                        >
                            {activity.summary}
                        </h4>
                        <p class="mt-1 text-sm text-muted-foreground">
                            {formatTimeRange(activity)}
                        </p>
                    </div>
                </div>
            </div>

            <section class="space-y-2">
                <h5
                    class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                    When
                </h5>
                <div
                    class="rounded-2xl bg-muted/40 px-4 py-3 text-sm text-foreground"
                >
                    <div class="mt-1 font-semibold">
                        {formatDate(activity.startDate)}
                        {#if isMultiDay}
                            <span> → {formatDate(activity.endDate)}</span>
                        {/if}
                    </div>
                    <div class="mt-2 text-muted-foreground">
                        {formatTimeRange(activity)}
                    </div>
                </div>
            </section>

            {#if activity.location}
                <section class="space-y-2">
                    <h5
                        class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                        Where
                    </h5>
                    <div
                        class="whitespace-pre-wrap break-words rounded-2xl bg-muted/40 px-4 py-3 text-sm leading-relaxed text-foreground"
                    >
                        {activity.location}
                    </div>
                </section>
            {/if}

            {#if activity.description}
                <section class="space-y-2">
                    <h5
                        class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                        Description
                    </h5>
                    <div
                        class="whitespace-pre-wrap break-words rounded-2xl bg-muted/40 px-4 py-3 text-sm leading-relaxed text-foreground"
                    >
                        {activity.description}
                    </div>
                </section>
            {/if}

            <section class="space-y-2">
                <h5
                    class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                    Source
                </h5>
                <div class="rounded-2xl bg-muted/40 px-4 py-3 text-sm">
                    <div class="font-medium text-foreground">
                        {formatSource(activity)}
                    </div>

                    {#if activity.source === "ical"}
                        <div class="mt-3 rounded-xl bg-background/70 px-3 py-2">
                            {#if hasLocalOverrides}
                                <div
                                    class="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-300"
                                >
                                    <span
                                        class="h-2 w-2 rounded-full bg-amber-500"
                                        aria-hidden="true"
                                    ></span>
                                    Edited locally
                                </div>
                                <p class="mt-1 text-xs text-muted-foreground">
                                    Local changes: {overrideLabels.join(", ")}
                                </p>
                            {:else}
                                <div
                                    class="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300"
                                >
                                    <span
                                        class="h-2 w-2 rounded-full bg-emerald-500"
                                        aria-hidden="true"
                                    ></span>
                                    In sync with source
                                </div>
                                <p class="mt-1 text-xs text-muted-foreground">
                                    No local edits have been made to this synced
                                    activity.
                                </p>
                            {/if}
                        </div>
                    {/if}
                </div>
            </section>
        </div>
    </div>
</SwipeableSheet>
