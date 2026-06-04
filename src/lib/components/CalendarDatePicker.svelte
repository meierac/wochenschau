<svelte:options accessors={true} />

<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { getMondayOfWeek } from "../utils/date";

    export let currentWeek: number;
    export let currentYear: number;
    export let viewMode: "week" | "month" = "week";
    export let selectedMonthDate: Date = new Date();

    type CalendarCell = {
        date: Date;
        inCurrentMonth: boolean;
        week: number;
        year: number;
    };

    let displayedMonth = new Date();
    let syncSignature = "";
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let isMonthSwipeActive = false;

    const MIN_SWIPE_DISTANCE = 50;

    function getIsoWeekInfo(date: Date): { week: number; year: number } {
        const d = new Date(
            Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
        );
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const year = d.getUTCFullYear();
        const yearStart = new Date(Date.UTC(year, 0, 1));
        const week = Math.ceil(
            ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
        );

        return { week, year };
    }

    function addMonths(base: Date, offset: number): Date {
        return new Date(base.getFullYear(), base.getMonth() + offset, 1);
    }

    function buildCalendarCells(monthDate: Date): CalendarCell[] {
        const firstDayOfMonth = new Date(
            monthDate.getFullYear(),
            monthDate.getMonth(),
            1,
        );
        const firstWeekdayIndex = (firstDayOfMonth.getDay() + 6) % 7;
        const gridStart = new Date(firstDayOfMonth);
        gridStart.setDate(firstDayOfMonth.getDate() - firstWeekdayIndex);

        return Array.from({ length: 42 }, (_, index) => {
            const cellDate = new Date(gridStart);
            cellDate.setDate(gridStart.getDate() + index);
            const weekInfo = getIsoWeekInfo(cellDate);

            return {
                date: cellDate,
                inCurrentMonth: cellDate.getMonth() === monthDate.getMonth(),
                week: weekInfo.week,
                year: weekInfo.year,
            };
        });
    }

    function sameDate(a: Date, b: Date): boolean {
        return (
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate()
        );
    }

    function navigateMonth(direction: -1 | 1) {
        displayedMonth = addMonths(displayedMonth, direction);
    }

    function handleTouchStart(e: TouchEvent) {
        const touch = e.changedTouches[0];
        if (!touch) return;

        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchEndX = touch.clientX;
        isMonthSwipeActive = false;
    }

    function handleTouchMove(e: TouchEvent) {
        const touch = e.changedTouches[0];
        if (!touch) return;

        const deltaX = touch.clientX - touchStartX;
        const deltaY = Math.abs(touch.clientY - touchStartY);

        if (Math.abs(deltaX) > 15 && Math.abs(deltaX) > deltaY * 1.5) {
            isMonthSwipeActive = true;
            touchEndX = touch.clientX;
            e.preventDefault();
        }
    }

    function handleTouchEnd(e?: TouchEvent) {
        if (e?.changedTouches?.[0]) {
            touchEndX = e.changedTouches[0].clientX;
        }

        if (!isMonthSwipeActive) return;

        const deltaX = touchEndX - touchStartX;
        if (Math.abs(deltaX) < MIN_SWIPE_DISTANCE) {
            isMonthSwipeActive = false;
            return;
        }

        if (deltaX < 0) {
            navigateMonth(1);
        } else {
            navigateMonth(-1);
        }

        isMonthSwipeActive = false;
    }

    const dispatch = createEventDispatcher<{
        weekSelected: { week: number; year: number };
        monthSelected: { date: Date };
    }>();

    function handleCellClick(cell: CalendarCell) {
        if (viewMode === "week") {
            const monday = getMondayOfWeek(cell.week, cell.year);
            displayedMonth = new Date(
                monday.getFullYear(),
                monday.getMonth(),
                1,
            );
            dispatch("weekSelected", { week: cell.week, year: cell.year });
            return;
        }

        displayedMonth = new Date(
            cell.date.getFullYear(),
            cell.date.getMonth(),
            1,
        );
        dispatch("monthSelected", { date: new Date(cell.date) });
    }

    $: selectedReferenceDate =
        viewMode === "month"
            ? selectedMonthDate
            : getMondayOfWeek(currentWeek, currentYear);
    $: {
        const nextSignature = `${viewMode}-${currentWeek}-${currentYear}-${selectedMonthDate.getFullYear()}-${selectedMonthDate.getMonth()}-${selectedMonthDate.getDate()}`;
        if (nextSignature !== syncSignature) {
            displayedMonth = new Date(
                selectedReferenceDate.getFullYear(),
                selectedReferenceDate.getMonth(),
                1,
            );
            syncSignature = nextSignature;
        }
    }
    $: monthLabel = displayedMonth.toLocaleDateString("de-DE", {
        month: "long",
        year: "numeric",
    });
    $: calendarCells = buildCalendarCells(displayedMonth);
    $: today = new Date();
</script>

<div class="space-y-4">
    <div class="flex items-center justify-between gap-2">
        <button
            type="button"
            aria-label="Show previous month"
            on:click={() => navigateMonth(-1)}
            class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/80"
        >
            <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 19l-7-7 7-7"
                />
            </svg>
        </button>

        <div class="flex-1 min-w-0 text-center">
            <div class="text-sm font-semibold text-foreground capitalize">
                {monthLabel}
            </div>
        </div>

        <button
            type="button"
            aria-label="Show next month"
            on:click={() => navigateMonth(1)}
            class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/80"
        >
            <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                />
            </svg>
        </button>
    </div>

    <div
        class="space-y-2"
        style="touch-action: pan-y;"
        on:touchstart={handleTouchStart}
        on:touchmove={handleTouchMove}
        on:touchend={handleTouchEnd}
        on:touchcancel={handleTouchEnd}
    >
        <div class="grid grid-cols-7 gap-2">
            {#each calendarCells as cell}
                {@const isToday = sameDate(cell.date, today)}
                {@const isSelectedWeek =
                    viewMode === "week" &&
                    cell.week === currentWeek &&
                    cell.year === currentYear}
                {@const isSelectedDay =
                    viewMode === "month" &&
                    sameDate(cell.date, selectedMonthDate)}

                <button
                    type="button"
                    on:click={() => handleCellClick(cell)}
                    class={`flex h-11 items-center justify-center rounded-xl text-sm font-semibold transition-colors ${
                        isSelectedWeek || isSelectedDay
                            ? "bg-primary text-primary-foreground"
                            : cell.inCurrentMonth
                              ? "bg-muted text-foreground hover:bg-muted/80"
                              : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                    } ${
                        isToday && !(isSelectedWeek || isSelectedDay)
                            ? "ring-2 ring-foreground/70 ring-offset-1 ring-offset-background"
                            : ""
                    }`}
                    aria-pressed={isSelectedWeek || isSelectedDay}
                >
                    {cell.date.getDate()}
                </button>
            {/each}
        </div>
    </div>
</div>
