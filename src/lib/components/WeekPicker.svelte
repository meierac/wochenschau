<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import IconButton from "./IconButton.svelte";

    export let currentWeek: number;
    export let currentYear: number;

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

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            dispatch("close");
        }
    }
</script>

<div
    class="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4"
    on:click={handleBackdropClick}
>
    <div
        class="bg-card rounded-3xl md:rounded-lg shadow-lg w-full transition-all flex flex-col md:max-w-md"
    >
        <!-- Header with centered title and icon buttons -->
        <div
            class="border-b border-border px-4 py-4 flex items-center justify-between"
        >
            <!-- Cancel button (left) -->
            <IconButton
                variant="ghost"
                size="md"
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
            <h3
                class="text-lg font-semibold text-foreground flex-1 text-center"
            >
                Select Week
            </h3>

            <!-- Save button (right) -->
            <IconButton
                variant="ghost"
                size="md"
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
        <div class="p-6 space-y-6">
            <!-- Year Selection -->
            <div class="space-y-2">
                <label class="text-sm font-semibold text-foreground">Year</label
                >
                <div class="flex gap-2">
                    {#each years as year}
                        <button
                            on:click={() => (selectedYear = year)}
                            class={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                                selectedYear === year
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                        >
                            {year}
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Week Selection Grid -->
            <div class="space-y-2">
                <label class="text-sm font-semibold text-foreground">Week</label
                >
                <div class="grid grid-cols-6 gap-2">
                    {#each weeks as week}
                        <button
                            on:click={() => (selectedWeek = week)}
                            class={`px-2 py-2 rounded text-sm font-semibold transition-colors ${
                                selectedWeek === week
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                        >
                            {week}
                        </button>
                    {/each}
                </div>
            </div>
        </div>
    </div>
</div>
