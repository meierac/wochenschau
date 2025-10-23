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

<!-- Mobile: Simple grid with padding, no height constraints -->
<!-- Desktop: Maintain height for proper layout -->
<div class="px-2 pb-24 md:pb-0 md:h-full md:flex md:flex-col">
    <div
        class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 md:flex-1 md:overflow-y-auto"
    >
        {#each days as day, dayIndex}
            <div class="md:h-full md:flex md:flex-col">
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
            <div class="md:h-full md:flex md:flex-col">
                <div
                    class="flex flex-col h-full bg-card rounded-lg border border-border p-2 md:p-3"
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
                    <button
                        on:click={() => bibleVerse.refreshVerse()}
                        class="mt-4 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors text-center"
                    >
                        🔄 Refresh
                    </button>
                </div>
            </div>
        {/if}
    </div>
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
