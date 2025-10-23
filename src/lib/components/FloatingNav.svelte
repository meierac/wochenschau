<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { currentWeek, currentYear } from "../stores/week";
    import WeekPicker from "./WeekPicker.svelte";

    const dispatch = createEventDispatcher();

    let showWeekPicker = false;

    function handleOpenExport() {
        dispatch("openExport");
    }

    function handleWeekSelected(
        event: CustomEvent<{ week: number; year: number }>,
    ) {
        currentWeek.set(event.detail.week);
        currentYear.set(event.detail.year);
        showWeekPicker = false;
    }
</script>

<div
    class="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom"
>
    <!-- Main Navigation -->
    <div class="flex items-center justify-around p-3 gap-2">
        <button
            on:click={() => (showWeekPicker = true)}
            class="flex-1 flex flex-col items-center gap-1 px-3 py-2 rounded-lg active:bg-muted transition-colors"
            aria-label="Pick week"
        >
            <span class="text-lg">📅</span>
            <span class="text-xs text-muted-foreground">W{$currentWeek}</span>
        </button>

        <button
            on:click={() => dispatch("openAddActivity")}
            class="flex-1 flex flex-col items-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg active:opacity-80 transition-opacity"
            aria-label="Add activity"
        >
            <span class="text-lg">+</span>
            <span class="text-xs">Activity</span>
        </button>

        <button
            on:click={handleOpenExport}
            class="flex-1 flex flex-col items-center gap-1 px-3 py-2 rounded-lg active:bg-muted transition-colors"
            aria-label="Export agenda"
        >
            <span class="text-lg">📤</span>
            <span class="text-xs text-muted-foreground">Export</span>
        </button>

        <button
            on:click={() => dispatch("openSettings")}
            class="flex-1 flex flex-col items-center gap-1 px-3 py-2 rounded-lg active:bg-muted transition-colors"
            aria-label="Settings"
        >
            <span class="text-lg">⚙️</span>
            <span class="text-xs text-muted-foreground">Settings</span>
        </button>
    </div>
</div>

<!-- Week Picker Modal -->
{#if showWeekPicker}
    <WeekPicker
        currentWeek={$currentWeek}
        currentYear={$currentYear}
        on:weekSelected={handleWeekSelected}
        on:close={() => (showWeekPicker = false)}
    />
{/if}
