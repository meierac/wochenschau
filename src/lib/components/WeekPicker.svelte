<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { getCurrentWeek as getTodayWeekInfo } from "../utils/date";
    import IconButton from "./IconButton.svelte";
    import Button from "./Button.svelte";
    import SwipeableSheet from "./SwipeableSheet.svelte";

    export let currentWeek: number;
    export let currentYear: number;
    export let isDesktop = false;

    // Whether selecting a week auto-saves & closes (requested behavior)
    export let autoCloseOnWeekSelect: boolean = true;

    const dispatch = createEventDispatcher<{
        weekSelected: { week: number; year: number };
        close: void;
    }>();

    let selectedWeek = currentWeek;
    let selectedYear = currentYear;

    const todayWeekInfo = getTodayWeekInfo();
    const actualCurrentWeek = todayWeekInfo.week;
    const actualCurrentYear = todayWeekInfo.year;
    const currentFullYear = new Date().getFullYear();
    const years = [currentFullYear, currentFullYear + 1];
    const weeks = Array.from({ length: 52 }, (_, i) => i + 1);

    function handleSelect() {
        dispatch("weekSelected", { week: selectedWeek, year: selectedYear });
    }

    function handleClose() {
        dispatch("close");
    }

    function selectWeek(week: number) {
        selectedWeek = week;
        handleSelect();
        if (autoCloseOnWeekSelect) {
            // Close after a tick to allow any parent listener to process weekSelected first
            queueMicrotask(() => handleClose());
        }
    }

    function isActualCurrentWeek(week: number, year: number): boolean {
        return week === actualCurrentWeek && year === actualCurrentYear;
    }

    function isActiveWeek(week: number, year: number): boolean {
        return week === currentWeek && year === currentYear;
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

        <!-- (Optional) Manual save button retained for desktop / non-auto flows -->
        {#if !autoCloseOnWeekSelect}
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
        {:else}
            <!-- Spacer to keep layout balanced when save button absent -->
            <div class="w-10 h-10"></div>
        {/if}
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
            <legend class="text-sm font-semibold text-foreground">
                Week {selectedWeek}
            </legend>
            <div class="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                <div
                    class="inline-flex items-center gap-1 rounded-full bg-muted/50 px-2 py-1"
                >
                    <span class="h-2 w-2 rounded-full bg-primary"></span>
                    Active week
                </div>
                <div
                    class="inline-flex items-center gap-1 rounded-full bg-muted/50 px-2 py-1"
                >
                    <span
                        class="h-2 w-2 rounded-full border-2 border-foreground"
                    ></span>
                    Current week
                </div>
            </div>
            <div class="grid grid-cols-6 gap-2">
                {#each weeks as week}
                    {@const isCurrent = isActualCurrentWeek(week, selectedYear)}
                    {@const isActive = isActiveWeek(week, selectedYear)}
                    <Button
                        on:click={() => selectWeek(week)}
                        aria-pressed={selectedWeek === week}
                        class={`px-2 py-2 rounded text-sm font-semibold transition-colors border ${
                            isActive
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted/80 border-transparent"
                        } ${
                            isCurrent
                                ? isActive
                                    ? "ring-2 ring-foreground/70 ring-offset-1 ring-offset-background"
                                    : "border-foreground text-foreground"
                                : ""
                        }`}
                    >
                        {week}
                    </Button>
                {/each}
            </div>
        </fieldset>
    </div>
</SwipeableSheet>
