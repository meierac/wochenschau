<script lang="ts">
    import { activities } from "../stores/activities";
    import { currentWeek, currentYear } from "../stores/week";
    import { getDaysOfWeek } from "../utils/date";
    import { bibleVerse } from "../stores/bibleVerse";

    import DayColumn from "./DayColumn.svelte";
    import WeekPicker from "./WeekPicker.svelte";
    import Button from "./Button.svelte";

    export let isDesktop = false;

    let showWeekPicker = false;

    // Reactive
    $: days = getDaysOfWeek($currentWeek, $currentYear);
    $: weekActivities = $activities.filter(
        (a) => a.week === $currentWeek && a.year === $currentYear,
    );

    function handleWeekSelected(
        event: CustomEvent<{ week: number; year: number }>,
    ) {
        currentWeek.set(event.detail.week);
        currentYear.set(event.detail.year);
        showWeekPicker = false;
    }

    function handleResize() {
        // Handle resize if needed for future desktop-specific logic
    }

    export function openWeekPicker() {
        showWeekPicker = true;
    }

    export function openAddActivity() {
        // Handled by parent
    }
</script>

<svelte:window on:resize={handleResize} />

<div class="flex flex-col h-full w-full px-2">
    <!-- Week Days Layout - Responsive -->
    <!-- Mobile: Stack vertically (1 column) with overflow-y -->
    <!-- Tablet: 2-3 columns with overflow-y -->
    <!-- Desktop: 4 columns max (max 4 days per row) with overflow-y -->
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
                />
            </div>
        {/each}

        <!-- Bible Verse of the Day as Last Item -->
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
                        🔄 Refresh
                    </Button>
                </div>
            </div>
        {/if}
    </div>

    <!-- Week Picker Modal/Sheet -->
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
