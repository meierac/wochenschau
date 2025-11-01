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
<div class="fixed bottom-0 left-4 right-4 flex gap-3 items-center safe-bottom">
    <!-- Floating Navigation Bar -->
    <div
        class="flex-1 bg-background/40 backdrop-blur-xl"
        style="border-radius: 100px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);box-shadow: 0 0px 2px rgba(255, 255, 255, 0.2) inset, 0 0px 15px rgba(255, 255, 255, 0.1) inset;"
    >
        <!-- Navigation Items -->
        <div class="flex items-center justify-around p-2 gap-0">
            <button
                on:click={() => (showWeekPicker = true)}
                class="flex-1 flex items-center justify-center p-3 rounded-2xl active:bg-muted transition-colors"
                aria-label="Pick week"
            >
                <svg
                    class="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    /></svg
                >
            </button>

            <button
                on:click={handleOpenExport}
                class="flex-1 flex items-center justify-center p-3 rounded-2xl active:bg-muted transition-colors"
                aria-label="Export agenda"
            >
                <svg
                    class="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    /></svg
                >
            </button>

            <button
                on:click={() => dispatch("openSettings")}
                class="flex-1 flex items-center justify-center p-3 rounded-2xl active:bg-muted transition-colors"
                aria-label="Settings"
            >
                <svg
                    class="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    /><circle
                        cx="12"
                        cy="12"
                        r="3"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                    /></svg
                >
            </button>
        </div>
    </div>

    <!-- Floating Action Button (on same level) -->
    <div
        class="bg-background/40 backdrop-blur-xl p-2"
        style="border-radius: 100px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);box-shadow: 0 0px 2px rgba(255, 255, 255, 0.2) inset, 0 0px 15px rgba(255, 255, 255, 0.1) inset;"
    >
        <button
            on:click={() => dispatch("openAddActivity")}
            class=" p-3 rounded-full active:scale-95 transition-transform flex items-center justify-center text-xl font-semibold shrink-0"
            aria-label="Add activity"
        >
            <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-label="Edit"
            >
                <path
                    d="M4 20l1.05-4.2a2 2 0 0 1 .53-.95L15.3 5.13a2.5 2.5 0 0 1 3.54 0l.03.03a2.5 2.5 0 0 1 0 3.54L9.15 18.42a2 2 0 0 1-.95.53L4 20Z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linejoin="round"
                />
                <path
                    d="M13.5 7.5l3 3"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                />
            </svg>
        </button>
    </div>
</div>

<!-- Week Picker Modal -->
{#if showWeekPicker}
    <WeekPicker
        isDesktop={false}
        currentWeek={$currentWeek}
        currentYear={$currentYear}
        on:weekSelected={handleWeekSelected}
        on:close={() => (showWeekPicker = false)}
    />
{/if}
