<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { CalendarItem } from "../types/index";
    import { WEEKDAYS_DE } from "../types/index";
    import { currentWeek, currentYear } from "../stores/week";
    import { getDaysOfWeek, getNextWeek, getPreviousWeek } from "../utils/date";
    import { timeToMinutes } from "../utils/activityDisplay";
    import IconButton from "./IconButton.svelte";
    import SwipeableSheet from "./SwipeableSheet.svelte";

    export let activity: CalendarItem;
    export let isDesktop = false;

    type MoveDayOption = {
        weekOffset: number;
        week: number;
        year: number;
        dayIndex: number;
        date: Date;
        id: string;
    };

    type MoveWeekOption = {
        weekOffset: number;
        week: number;
        year: number;
        days: MoveDayOption[];
    };

    const dispatch = createEventDispatcher();

    let editData = { ...activity };
    let hasChanges = false;
    let dayOptions: MoveDayOption[] = [];
    let weekOptions: MoveWeekOption[] = [];
    let selectedDayOptionId = "";
    let visibleWeekOffset = 0;
    let visibleWeek: MoveWeekOption | undefined;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let isWeekSwipeActive = false;

    const MIN_WEEK_OFFSET = -10;
    const MAX_WEEK_OFFSET = 10;
    const MIN_SWIPE_DISTANCE = 50;

    function toOptionId(week: number, year: number, dayIndex: number): string {
        return `${year}-${week}-${dayIndex}`;
    }

    function shiftWeek(
        baseWeek: number,
        baseYear: number,
        offset: number,
    ): { week: number; year: number } {
        let week = baseWeek;
        let year = baseYear;

        if (offset > 0) {
            for (let i = 0; i < offset; i++) {
                const next = getNextWeek(week, year);
                week = next.week;
                year = next.year;
            }
        } else if (offset < 0) {
            for (let i = 0; i < Math.abs(offset); i++) {
                const previous = getPreviousWeek(week, year);
                week = previous.week;
                year = previous.year;
            }
        }

        return { week, year };
    }

    function createWeekDayOptions(
        week: number,
        year: number,
        weekOffset: number,
    ): MoveDayOption[] {
        const days = getDaysOfWeek(week, year);
        return days.map((date, dayIndex) => ({
            weekOffset,
            week,
            year,
            dayIndex,
            date,
            id: toOptionId(week, year, dayIndex),
        }));
    }

    function formatWeekRange(days: MoveDayOption[]): string {
        if (days.length === 0) return "";
        return `${formatDateForDisplay(days[0].date)} – ${formatDateForDisplay(days[days.length - 1].date)}`;
    }

    function getWeekLabel(offset: number): string {
        if (offset === 0) return "Current week";
        if (offset === -1) return "Last week";
        if (offset === 1) return "Next week";
        if (offset < 0) return `${Math.abs(offset)} weeks ago`;
        return `In ${offset} weeks`;
    }

    function setVisibleWeekOffset(offset: number) {
        visibleWeekOffset = Math.min(
            MAX_WEEK_OFFSET,
            Math.max(MIN_WEEK_OFFSET, offset),
        );
    }

    function navigateWeek(direction: -1 | 1) {
        setVisibleWeekOffset(visibleWeekOffset + direction);
    }

    function handleWeekTouchStart(e: TouchEvent) {
        const touch = e.changedTouches[0];
        if (!touch) return;

        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchEndX = touch.clientX;
        isWeekSwipeActive = false;
    }

    function handleWeekTouchMove(e: TouchEvent) {
        const touch = e.changedTouches[0];
        if (!touch) return;

        const deltaX = touch.clientX - touchStartX;
        const deltaY = Math.abs(touch.clientY - touchStartY);

        if (Math.abs(deltaX) > 15 && Math.abs(deltaX) > deltaY * 1.5) {
            isWeekSwipeActive = true;
            touchEndX = touch.clientX;
            e.preventDefault();
        }
    }

    function handleWeekTouchEnd(e?: TouchEvent) {
        if (e?.changedTouches?.[0]) {
            touchEndX = e.changedTouches[0].clientX;
        }

        if (!isWeekSwipeActive) return;

        const deltaX = touchEndX - touchStartX;
        if (Math.abs(deltaX) < MIN_SWIPE_DISTANCE) {
            isWeekSwipeActive = false;
            return;
        }

        if (deltaX < 0) {
            navigateWeek(1);
        } else {
            navigateWeek(-1);
        }

        isWeekSwipeActive = false;
    }

    $: weekOptions = Array.from(
        { length: MAX_WEEK_OFFSET - MIN_WEEK_OFFSET + 1 },
        (_, index) => {
            const weekOffset = MIN_WEEK_OFFSET + index;
            const { week, year } = shiftWeek(
                $currentWeek,
                $currentYear,
                weekOffset,
            );
            const days = createWeekDayOptions(week, year, weekOffset);

            return {
                weekOffset,
                week,
                year,
                days,
            };
        },
    );
    $: dayOptions = weekOptions.flatMap((option) => option.days);

    $: {
        const selectedOptionStillExists = dayOptions.some(
            (option) => option.id === selectedDayOptionId,
        );

        if (!selectedOptionStillExists) {
            const matchingOption = dayOptions.find(
                (option) =>
                    option.week === activity.week &&
                    option.year === activity.year &&
                    option.dayIndex === activity.day,
            );

            selectedDayOptionId = matchingOption
                ? matchingOption.id
                : toOptionId(activity.week, activity.year, activity.day);
        }
    }

    $: selectedDayOption = dayOptions.find(
        (option) => option.id === selectedDayOptionId,
    );

    $: {
        hasChanges =
            editData.summary !== activity.summary ||
            editData.startTime !== activity.startTime ||
            editData.endTime !== activity.endTime ||
            editData.description !== activity.description ||
            selectedDayOption?.week !== activity.week ||
            selectedDayOption?.year !== activity.year ||
            selectedDayOption?.dayIndex !== activity.day;
    }

    function formatDateToICalDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}${month}${day}`;
    }

    function formatDateForDisplay(date: Date): string {
        return date.toLocaleDateString("de-DE", {
            day: "numeric",
            month: "short",
        });
    }

    $: visibleWeek = weekOptions.find(
        (option) => option.weekOffset === visibleWeekOffset,
    );

    function handleSave() {
        // If day changed, update all date-related fields
        if (
            selectedDayOption &&
            (selectedDayOption.dayIndex !== activity.day ||
                selectedDayOption.week !== activity.week ||
                selectedDayOption.year !== activity.year)
        ) {
            const newDate = selectedDayOption.date;
            const startDate = formatDateToICalDate(newDate);
            const dtstart = `${startDate}T${editData.startTime.replace(":", "")}00`;
            const dtend = `${startDate}T${editData.endTime.replace(":", "")}00`;

            editData.dtstart = dtstart;
            editData.dtend = dtend;
            editData.startDate = startDate;
            editData.endDate = startDate;
            editData.day = selectedDayOption.dayIndex;
            editData.week = selectedDayOption.week;
            editData.year = selectedDayOption.year;
        }

        dispatch("save", editData);
    }

    function handleCancel() {
        dispatch("close");
    }

    function handleDelete() {
        dispatch("requestDelete");
    }

    $: duration =
        timeToMinutes(editData.endTime) - timeToMinutes(editData.startTime);
    $: durationStr = `${Math.floor(duration / 60)}h ${duration % 60}m`;
</script>

<SwipeableSheet {isDesktop} desktopMaxWidth="28rem" on:close={handleCancel}>
    <!-- Header with centered title and icon buttons -->
    <div class="px-3 py-3 flex items-center justify-between">
        <!-- Cancel button (left) -->
        <IconButton
            variant="secondary"
            size="lg"
            ariaLabel="Close"
            on:click={handleCancel}
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
            Edit Activity
        </h3>

        <!-- Save button (right) -->
        <IconButton
            variant="secondary"
            size="lg"
            ariaLabel="Save changes"
            disabled={!hasChanges}
            on:click={handleSave}
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
    <div class="p-3 space-y-4 max-h-[60vh] overflow-y-auto sheet-content">
        <!-- Activity Name -->
        <div>
            <label
                for="activity-name"
                class="text-xs font-semibold text-foreground block mb-2"
            >
                Activity Name
            </label>
            <input
                id="activity-name"
                type="text"
                bind:value={editData.summary}
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Activity name"
            />
        </div>

        <!-- Day Selection -->
        <div>
            <label
                for="activity-day"
                class="text-xs font-semibold text-foreground block mb-2"
            >
                Day
            </label>

            <div class="space-y-3">
                <div class="flex items-center justify-between gap-2">
                    <button
                        type="button"
                        aria-label="Show previous week"
                        disabled={visibleWeekOffset <= MIN_WEEK_OFFSET}
                        on:click={() => navigateWeek(-1)}
                        class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:pointer-events-none disabled:opacity-50"
                    >
                        <svg
                            class="w-4 h-4"
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

                    <div class="flex-1 text-center min-w-0">
                        <div class="text-xs font-semibold text-foreground">
                            {visibleWeek
                                ? getWeekLabel(visibleWeek.weekOffset)
                                : "Current week"}
                        </div>
                        <div class="text-[11px] text-muted-foreground mt-0.5">
                            {visibleWeek
                                ? formatWeekRange(visibleWeek.days)
                                : ""}
                        </div>
                    </div>

                    <button
                        type="button"
                        aria-label="Show next week"
                        disabled={visibleWeekOffset >= MAX_WEEK_OFFSET}
                        on:click={() => navigateWeek(1)}
                        class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:pointer-events-none disabled:opacity-50"
                    >
                        <svg
                            class="w-4 h-4"
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
                    on:touchstart={handleWeekTouchStart}
                    on:touchmove={handleWeekTouchMove}
                    on:touchend={handleWeekTouchEnd}
                    on:touchcancel={handleWeekTouchEnd}
                >
                    <div class="grid grid-cols-2 gap-2">
                        {#if visibleWeek}
                            {#each visibleWeek.days as option}
                                <button
                                    type="button"
                                    on:click={() => {
                                        selectedDayOptionId = option.id;
                                        setVisibleWeekOffset(option.weekOffset);
                                    }}
                                    class="p-2 rounded-lg text-xs font-semibold transition-colors {selectedDayOptionId ===
                                    option.id
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted hover:bg-muted/80'}"
                                >
                                    <div>{WEEKDAYS_DE[option.dayIndex]}</div>
                                    <div class="text-[10px] opacity-70 mt-0.5">
                                        {formatDateForDisplay(option.date)}
                                    </div>
                                </button>
                            {/each}
                        {/if}
                    </div>
                </div>
            </div>
        </div>

        <!-- Time Selection -->
        <div class="grid grid-cols-2 gap-1">
            <div>
                <label
                    for="start-time"
                    class="text-xs font-semibold text-foreground block mb-2"
                >
                    Start Time
                </label>
                <input
                    id="start-time"
                    type="time"
                    bind:value={editData.startTime}
                    style="width: stretch;"
                    class="min-w-10 px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </div>
            <div>
                <label
                    for="end-time"
                    class="text-xs font-semibold text-foreground block mb-2"
                >
                    End Time
                </label>
                <input
                    id="end-time"
                    type="time"
                    bind:value={editData.endTime}
                    style="width: stretch;"
                    class="min-w-10 px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </div>
        </div>

        <!-- Duration Display -->
        <div class="p-3 bg-muted rounded-lg">
            <div class="text-xs text-muted-foreground">Duration</div>
            <div class="text-sm font-semibold text-foreground">
                {durationStr}
            </div>
        </div>

        <!-- Description -->
        <div>
            <label
                for="activity-description"
                class="text-xs font-semibold text-foreground block mb-2"
            >
                Description
            </label>
            <textarea
                id="activity-description"
                bind:value={editData.description}
                placeholder="Add notes or details (optional)"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                rows="3"
            ></textarea>
        </div>

        <!-- Source Info -->
        {#if activity.source !== "manual"}
            <div class="p-3 bg-muted rounded-lg text-xs">
                <div class="text-muted-foreground">
                    Source: <span class="font-semibold capitalize"
                        >{activity.source}</span
                    >
                </div>
                {#if activity.sourceId}
                    <div class="text-muted-foreground text-xs mt-1">
                        ID: {activity.sourceId}
                    </div>
                {/if}
            </div>
        {/if}
    </div>

    <!-- Delete button at bottom -->
    <div class="border-t border-border px-6 py-4">
        <button
            on:click={handleDelete}
            class="w-full px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
        >
            Delete Activity
        </button>
    </div>
</SwipeableSheet>
