<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { getCurrentWeek as getTodayWeekInfo } from "../utils/date";
    import IconButton from "./IconButton.svelte";
    import Button from "./Button.svelte";
    import SwipeableSheet from "./SwipeableSheet.svelte";

    export let currentWeek: number;
    export let currentYear: number;
    export let isDesktop = false;
    export let desktopViewMode: "week" | "month" = "week";
    export let selectedMonthDate: Date = new Date();

    // Whether selecting a week auto-saves & closes (requested behavior)
    export let autoCloseOnWeekSelect: boolean = true;

    const dispatch = createEventDispatcher<{
        weekSelected: { week: number; year: number };
        monthSelected: { date: Date };
        close: void;
    }>();

    let pickerMode: "week" | "month" = desktopViewMode;
    let selectedWeek = currentWeek;
    let selectedYear = currentYear;
    let selectedMonth = selectedMonthDate.getMonth();
    let selectedMonthYear = selectedMonthDate.getFullYear();

    const today = new Date();
    const todayWeekInfo = getTodayWeekInfo();
    const actualCurrentWeek = todayWeekInfo.week;
    const actualCurrentYear = todayWeekInfo.year;
    const actualCurrentMonth = today.getMonth();
    const actualCurrentMonthYear = today.getFullYear();
    const currentFullYear = today.getFullYear();
    const years = Array.from(
        new Set([
            currentFullYear - 1,
            currentFullYear,
            currentFullYear + 1,
            currentYear,
            selectedMonthDate.getFullYear(),
        ]),
    ).sort((a, b) => a - b);
    const weeks = Array.from({ length: 52 }, (_, i) => i + 1);
    const months = Array.from({ length: 12 }, (_, i) =>
        new Date(2024, i, 1).toLocaleDateString("de-DE", { month: "long" }),
    );

    $: if (isDesktop) {
        pickerMode = desktopViewMode;
    }

    $: selectedWeek = currentWeek;
    $: selectedYear = currentYear;
    $: selectedMonth = selectedMonthDate.getMonth();
    $: selectedMonthYear = selectedMonthDate.getFullYear();

    function handleSelect() {
        dispatch("weekSelected", { week: selectedWeek, year: selectedYear });
    }

    function handleClose() {
        dispatch("close");
    }

    function selectWeek(week: number) {
        selectedWeek = week;
        dispatch("weekSelected", { week: selectedWeek, year: selectedYear });
        if (autoCloseOnWeekSelect) {
            queueMicrotask(() => handleClose());
        }
    }

    function selectMonth(month: number) {
        selectedMonth = month;
        dispatch("monthSelected", {
            date: new Date(selectedMonthYear, selectedMonth, 1),
        });
        if (autoCloseOnWeekSelect) {
            queueMicrotask(() => handleClose());
        }
    }

    function isActualCurrentWeek(week: number, year: number): boolean {
        return week === actualCurrentWeek && year === actualCurrentYear;
    }

    function isActiveWeek(week: number, year: number): boolean {
        return week === currentWeek && year === currentYear;
    }

    function isActualCurrentMonth(month: number, year: number): boolean {
        return month === actualCurrentMonth && year === actualCurrentMonthYear;
    }

    function isActiveMonth(month: number, year: number): boolean {
        return (
            month === selectedMonthDate.getMonth() &&
            year === selectedMonthDate.getFullYear()
        );
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
            {pickerMode === "month" ? "Select Month" : "Select Week"}
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
        {#if isDesktop}
            <div class="flex items-center gap-1 rounded-xl bg-secondary p-0.5">
                <button
                    on:click={() => (pickerMode = "week")}
                    class={`rounded-lg w-full px-3 py-2 text-sm font-semibold transition-colors ${
                        pickerMode === "week"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    aria-label="Show week picker"
                    title="Show week picker"
                >
                    Week
                </button>
                <button
                    on:click={() => (pickerMode = "month")}
                    class={`rounded-lg w-full px-3 py-2 text-sm font-semibold transition-colors ${
                        pickerMode === "month"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    aria-label="Show month picker"
                    title="Show month picker"
                >
                    Month
                </button>
            </div>
        {/if}

        <!-- Year Selection -->
        <fieldset class="space-y-2">
            <legend class="text-sm font-semibold text-foreground">Year</legend>
            <div class="flex gap-2">
                {#each years as year}
                    <Button
                        on:click={() => {
                            if (pickerMode === "month") {
                                selectedMonthYear = year;
                            } else {
                                selectedYear = year;
                            }
                        }}
                        aria-pressed={pickerMode === "month"
                            ? selectedMonthYear === year
                            : selectedYear === year}
                        class={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                            (
                                pickerMode === "month"
                                    ? selectedMonthYear === year
                                    : selectedYear === year
                            )
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/80 text-muted-foreground hover:bg-muted/80"
                        }`}
                    >
                        {year}
                    </Button>
                {/each}
            </div>
        </fieldset>

        {#if pickerMode === "week"}
            <fieldset class="space-y-2">
                <legend class="text-sm font-semibold text-foreground">
                    Week {selectedWeek}
                </legend>
                <div
                    class="flex flex-wrap gap-2 text-[11px] text-muted-foreground"
                >
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
                        {@const isCurrent = isActualCurrentWeek(
                            week,
                            selectedYear,
                        )}
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
        {:else}
            <fieldset class="space-y-2">
                <legend
                    class="text-sm font-semibold text-foreground capitalize"
                >
                    {months[selectedMonth]}
                    {selectedMonthYear}
                </legend>
                <div
                    class="flex flex-wrap gap-2 text-[11px] text-muted-foreground"
                >
                    <div
                        class="inline-flex items-center gap-1 rounded-full bg-muted/50 px-2 py-1"
                    >
                        <span class="h-2 w-2 rounded-full bg-primary"></span>
                        Active month
                    </div>
                    <div
                        class="inline-flex items-center gap-1 rounded-full bg-muted/50 px-2 py-1"
                    >
                        <span
                            class="h-2 w-2 rounded-full border-2 border-foreground"
                        ></span>
                        Current month
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-2">
                    {#each months as monthLabel, monthIndex}
                        {@const isCurrent = isActualCurrentMonth(
                            monthIndex,
                            selectedMonthYear,
                        )}
                        {@const isActive = isActiveMonth(
                            monthIndex,
                            selectedMonthYear,
                        )}
                        <Button
                            on:click={() => selectMonth(monthIndex)}
                            aria-pressed={selectedMonth === monthIndex}
                            class={`px-3 py-3 rounded text-sm font-semibold capitalize transition-colors border ${
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
                            {monthLabel}
                        </Button>
                    {/each}
                </div>
            </fieldset>
        {/if}
    </div>
</SwipeableSheet>
