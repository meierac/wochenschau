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

<!-- Floating Bottom Bar Container -->
<div class="fixed bottom-6 left-4 right-4 flex gap-3 items-end safe-bottom">
    <!-- Floating Navigation Bar -->
    <div class="flex-1 bg-card border border-border rounded-3xl shadow-lg">
        <!-- Navigation Items -->
        <div class="flex items-center justify-around p-2 gap-0">
            <button
                on:click={() => (showWeekPicker = true)}
                class="flex-1 flex items-center justify-center p-3 rounded-2xl active:bg-muted transition-colors"
                aria-label="Pick week"
            >
                <span class="text-xl">📅</span>
            </button>

            <button
                on:click={handleOpenExport}
                class="flex-1 flex items-center justify-center p-3 rounded-2xl active:bg-muted transition-colors"
                aria-label="Export agenda"
            >
                <span class="text-xl">📤</span>
            </button>

            <button
                on:click={() => dispatch("openSettings")}
                class="flex-1 flex items-center justify-center p-3 rounded-2xl active:bg-muted transition-colors"
                aria-label="Settings"
            >
                <span class="text-xl">⚙️</span>
            </button>
        </div>
    </div>

    <!-- Floating Action Button (on same level) -->
    <button
        on:click={() => dispatch("openAddActivity")}
        class="w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg active:scale-95 transition-transform flex items-center justify-center text-xl font-semibold hover:shadow-xl mb-0.5 shrink-0"
        aria-label="Add activity"
    >
        +
    </button>
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
