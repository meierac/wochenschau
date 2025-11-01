<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { derived } from "svelte/store";

    import { activities } from "../stores/activities";
    import { currentWeek, currentYear } from "../stores/week";
    import { getDaysOfWeek } from "../utils/date";
    import { bibleVerse } from "../stores/bibleVerse";
    import { subscriptions } from "../stores/ical";

    import DayColumn from "./DayColumn.svelte";
    import WeekPicker from "./WeekPicker.svelte";
    import Button from "./Button.svelte";

    import type { ICalSubscription, CalendarItem } from "../types/index";

    export let isDesktop = false;

    let showWeekPicker = false;

    const dispatch = createEventDispatcher<{
        requestEditActivity: CalendarItem;
    }>();

    function handleRequestEditActivity(event: CustomEvent<CalendarItem>) {
        // Forward to parent so the global ActivityEditSheet in App.svelte can open
        dispatch("requestEditActivity", event.detail);
    }

    // Reactive week days
    $: days = getDaysOfWeek($currentWeek, $currentYear);

    // Enabled subscription ids
    const enabledSubscriptions = derived(
        subscriptions,
        ($subs: ICalSubscription[]) =>
            new Set($subs.filter((s) => s.enabled).map((s) => s.id)),
    );

    // Activities filtered for current week/year and enabled subscriptions
    $: weekActivities = $activities
        .filter((a) => a.week === $currentWeek && a.year === $currentYear)
        .filter(
            (a) =>
                a.source !== "ical" ||
                (a.sourceId && $enabledSubscriptions.has(a.sourceId)),
        );

    function handleWeekSelected(
        event: CustomEvent<{ week: number; year: number }>,
    ) {
        currentWeek.set(event.detail.week);
        currentYear.set(event.detail.year);
        showWeekPicker = false;
    }

    function handleResize() {
        // Reserved for future responsive adjustments
    }

    export function openWeekPicker() {
        showWeekPicker = true;
    }

    export function openAddActivity() {
        // Intentionally empty – parent handles opening AddActivityModal
    }
</script>

<svelte:window on:resize={handleResize} />

<div class="flex flex-col h-full w-full px-2">
    <!-- Days grid -->
    <div
        class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 flex-1 overflow-y-auto md:pb-0 pt-6 md:pt-0"
        style="padding-bottom: {isDesktop ? '20px' : '200px'}"
    >
        {#each days as day, dayIndex}
            <div class="h-full flex flex-col">
                <DayColumn
                    {isDesktop}
                    {day}
                    {dayIndex}
                    dayActivities={weekActivities.filter(
                        (a) => a.day === dayIndex,
                    )}
                    on:requestEditActivity={handleRequestEditActivity}
                />
            </div>
        {/each}

        <!-- Bible Verse -->
        {#if $bibleVerse.enabled}
            <div class="h-full flex flex-col">
                <div
                    class="flex flex-col h-full bg-card rounded-xl border border-border p-2 md:p-3"
                >
                    <div
                        class="flex-1 flex flex-col justify-center items-center text-center"
                    >
                        <p
                            class="text-xs md:text-sm italic text-foreground mb-2"
                        >
                            "{$bibleVerse.currentVerse.text}"
                        </p>
                        <p class="text-[10px] md:text-xs text-muted-foreground">
                            – {$bibleVerse.currentVerse.reference}
                        </p>
                    </div>
                    <Button
                        variant="secondary"
                        on:click={() => bibleVerse.refreshVerse()}
                        class="mt-4 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors text-center"
                    >
                        <svg
                            class="w-4 h-4 inline-block mr-1"
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
                        Refresh
                    </Button>
                </div>
            </div>
        {/if}
    </div>

    <!-- Week Picker Sheet -->
    {#if showWeekPicker}
        <WeekPicker
            isDesktop={false}
            currentWeek={$currentWeek}
            currentYear={$currentYear}
            on:weekSelected={handleWeekSelected}
            on:close={() => (showWeekPicker = false)}
        />
    {/if}
</div>
