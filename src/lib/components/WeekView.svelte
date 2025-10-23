<script lang="ts">
    import { activities } from "../stores/activities";
    import { currentWeek, currentYear } from "../stores/week";
    import { getDaysOfWeek } from "../utils/date";
    import { bibleVerse } from "../stores/bibleVerse";

    import DayColumn from "./DayColumn.svelte";
    import WeekPicker from "./WeekPicker.svelte";

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

<div class="flex flex-col h-full w-full">
    <!-- Week Days Layout - Responsive -->
    <!-- Mobile: Stack vertically (1 column) with overflow-y -->
    <!-- Tablet: 2-3 columns with overflow-y -->
    <!-- Desktop: 4 columns max (max 4 days per row) with overflow-y -->
    <div
        class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 flex-1 overflow-y-auto pb-20 md:pb-6"
    >
        {#each days as day, dayIndex}
            <div class="h-full flex flex-col">
                <DayColumn
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
                    class="p-3 md:p-4 bg-card rounded-lg border border-border h-full flex flex-col justify-between"
                >
                    <div>
                        <p
                            class="text-xs md:text-sm italic text-foreground mb-2"
                        >
                            "{$bibleVerse.currentVerse.text}"
                        </p>
                        <p
                            class="text-[10px] md:text-xs text-muted-foreground text-right"
                        >
                            – {$bibleVerse.currentVerse.reference}
                        </p>
                    </div>
                    <button
                        on:click={() => bibleVerse.refreshVerse()}
                        class="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
                    >
                        🔄 Refresh
                    </button>
                </div>
            </div>
        {/if}
    </div>

    <!-- Week Picker Modal/Sheet -->
    {#if showWeekPicker}
        <WeekPicker
            currentWeek={$currentWeek}
            currentYear={$currentYear}
            on:weekSelected={handleWeekSelected}
            on:close={() => (showWeekPicker = false)}
        />
    {/if}
</div>
