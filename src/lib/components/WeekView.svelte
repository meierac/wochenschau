<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { derived } from "svelte/store";

    import { activities } from "../stores/activities";
    import { currentWeek, currentYear } from "../stores/week";
    import { getDaysOfWeek, getNextWeek, getPreviousWeek } from "../utils/date";
    import { sortActivitiesByDisplayOrder } from "../utils/activityDisplay";
    import { bibleVerse } from "../stores/bibleVerse";
    import { subscriptions } from "../stores/ical";

    import DayColumn from "./DayColumn.svelte";
    import WeekPicker from "./WeekPicker.svelte";
    import Button from "./Button.svelte";

    import type { ICalSubscription, CalendarItem } from "../types/index";

    export let isDesktop = false;

    let showWeekPicker = false;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let isWeekSwipeActive = false;
    let isWeekSwipeBlocked = false;

    const MIN_WEEK_SWIPE_DISTANCE = 60;

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

    $: sortedWeekActivities = sortActivitiesByDisplayOrder(weekActivities);
    $: activitiesByDay = Array.from({ length: 7 }, (_, dayIndex) =>
        sortedWeekActivities.filter((activity) => activity.day === dayIndex),
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

    function navigateWeek(direction: -1 | 1) {
        const nextWeekInfo =
            direction > 0
                ? getNextWeek($currentWeek, $currentYear)
                : getPreviousWeek($currentWeek, $currentYear);

        currentWeek.set(nextWeekInfo.week);
        currentYear.set(nextWeekInfo.year);
    }

    function handleWeekSwipeStart(event: TouchEvent) {
        const touch = event.changedTouches[0];
        if (!touch) return;

        const target = event.target as HTMLElement | null;
        isWeekSwipeBlocked = !!target?.closest(
            ".activity-card-swipe, button, input, textarea, select, a, [role='button']",
        );

        if (isWeekSwipeBlocked) {
            isWeekSwipeActive = false;
            return;
        }

        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchEndX = touch.clientX;
        isWeekSwipeActive = false;
    }

    function handleWeekSwipeMove(event: TouchEvent) {
        if (isWeekSwipeBlocked) return;

        const touch = event.changedTouches[0];
        if (!touch) return;

        const deltaX = touch.clientX - touchStartX;
        const deltaY = Math.abs(touch.clientY - touchStartY);

        if (Math.abs(deltaX) > 15 && Math.abs(deltaX) > deltaY * 1.5) {
            isWeekSwipeActive = true;
            touchEndX = touch.clientX;
            event.preventDefault();
        }
    }

    function handleWeekSwipeEnd(event?: TouchEvent) {
        if (event?.changedTouches?.[0]) {
            touchEndX = event.changedTouches[0].clientX;
        }

        if (isWeekSwipeBlocked) {
            isWeekSwipeBlocked = false;
            isWeekSwipeActive = false;
            return;
        }

        if (!isWeekSwipeActive) {
            isWeekSwipeBlocked = false;
            return;
        }

        const deltaX = touchEndX - touchStartX;
        if (Math.abs(deltaX) >= MIN_WEEK_SWIPE_DISTANCE) {
            if (deltaX < 0) {
                navigateWeek(1);
            } else {
                navigateWeek(-1);
            }
        }

        isWeekSwipeActive = false;
        isWeekSwipeBlocked = false;
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
        class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 flex-1 overflow-y-auto md:pb-0 pt-16 md:pt-0"
        style="padding-bottom: {isDesktop
            ? '0px'
            : '200px'}; touch-action: pan-y;"
        on:touchstart={handleWeekSwipeStart}
        on:touchmove={handleWeekSwipeMove}
        on:touchend={handleWeekSwipeEnd}
        on:touchcancel={handleWeekSwipeEnd}
    >
        {#each days as day, dayIndex}
            <div class="h-full flex flex-col">
                <DayColumn
                    {day}
                    {dayIndex}
                    dayActivities={activitiesByDay[dayIndex]}
                    on:requestEditActivity={handleRequestEditActivity}
                />
            </div>
        {/each}

        <!-- Bible Verse -->
        {#if $bibleVerse.enabled}
            <div class="h-full flex flex-col">
                <div
                    class="flex flex-col h-full card-glass-surface rounded-3xl p-2 md:p-3"
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
