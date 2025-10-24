<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import IconButton from "./IconButton.svelte";
    import Button from "./Button.svelte";
    import SwipeableSheet from "./SwipeableSheet.svelte";

    export let currentWeek: number;
    export let currentYear: number;
    export let isDesktop = false;

    const dispatch = createEventDispatcher();

    let selectedWeek = currentWeek;
    let selectedYear = currentYear;

    const currentFullYear = new Date().getFullYear();
    const years = [currentFullYear, currentFullYear + 1];
    const weeks = Array.from({ length: 52 }, (_, i) => i + 1);

    function handleSelect() {
        dispatch("weekSelected", { week: selectedWeek, year: selectedYear });
    }

    function handleClose() {
        dispatch("close");
    }
</script>

<SwipeableSheet
    {isDesktop}
    desktopMaxWidth="28rem"
    maxHeight="95vh"
    on:close={handleClose}
>
    <!-- Header with centered title and icon buttons -->
    <div class="px-3 py-3 flex items-center justify-between">
        <!-- Cancel button (left) -->
        <IconButton
            variant="secondary"
            size="lg"
            ariaLabel="Close"
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

        <!-- Centered title -->
        <h3 class="text-lg font-semibold text-foreground flex-1 text-center">
            Select Week
        </h3>

        <!-- Save button (right) -->
        <IconButton
            variant="secondary"
            size="lg"
            ariaLabel="Select week"
            on:click={handleSelect}
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
                    d="M5 13l4 4L19 7"
                />
            </svg>
        </IconButton>
    </div>

    <!-- Content -->
    <div class="p-3 space-y-6 pb-12 sheet-content">
        <!-- Year Selection -->
        <fieldset class="space-y-2">
            <legend class="text-sm font-semibold text-foreground">Year</legend>
            <div class="flex gap-2">
                {#each years as year}
                    <Button
                        on:click={() => (selectedYear = year)}
                        aria-pressed={selectedYear === year}
                        class={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                            selectedYear === year
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/80 text-muted-foreground hover:bg-muted/80"
                        }`}
                    >
                        {year}
                    </Button>
                {/each}
            </div>
        </fieldset>

        <!-- Week Selection Grid -->
        <fieldset class="space-y-2">
            <legend class="text-sm font-semibold text-foreground">Week</legend>
            <div class="grid grid-cols-6 gap-2">
                {#each weeks as week}
                    <Button
                        on:click={() => (selectedWeek = week)}
                        aria-pressed={selectedWeek === week}
                        class={`px-2 py-2 rounded text-sm font-semibold transition-colors ${
                            selectedWeek === week
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted/80"
                        }`}
                    >
                        {week}
                    </Button>
                {/each}
            </div>
        </fieldset>
    </div>
</SwipeableSheet>
