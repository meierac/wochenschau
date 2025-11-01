<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { CalendarItem } from "../types/index";
    import { WEEKDAYS_DE } from "../types/index";
    import { currentWeek, currentYear } from "../stores/week";
    import { getWeekNumber, getDaysOfWeek } from "../utils/date";
    import IconButton from "./IconButton.svelte";
    import SwipeableSheet from "./SwipeableSheet.svelte";

    export let activity: CalendarItem;
    export let isDesktop = false;

    const dispatch = createEventDispatcher();

    // Debug logging
    $: console.log("ActivityEditSheet isDesktop:", isDesktop);

    let editData = { ...activity };
    let selectedDay = activity.day;
    let hasChanges = false;

    $: days = getDaysOfWeek($currentWeek, $currentYear);

    $: {
        hasChanges =
            editData.summary !== activity.summary ||
            editData.startTime !== activity.startTime ||
            editData.endTime !== activity.endTime ||
            editData.description !== activity.description ||
            selectedDay !== activity.day;
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

    function handleSave() {
        // If day changed, update all date-related fields
        if (selectedDay !== activity.day) {
            const newDate = days[selectedDay];
            const startDate = formatDateToICalDate(newDate);
            const dtstart = `${startDate}T${editData.startTime.replace(":", "")}00`;
            const dtend = `${startDate}T${editData.endTime.replace(":", "")}00`;

            editData.dtstart = dtstart;
            editData.dtend = dtend;
            editData.startDate = startDate;
            editData.endDate = startDate;
            editData.day = selectedDay;
            editData.week = getWeekNumber(newDate);
            editData.year = newDate.getFullYear();
        }

        dispatch("save", editData);
    }

    function handleCancel() {
        dispatch("close");
    }

    function handleDelete() {
        if (confirm(`Delete activity "${activity.summary}"?`)) {
            dispatch("delete");
        }
    }

    function timeToMinutes(time: string): number {
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m;
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
            <div class="grid grid-cols-2 gap-2">
                {#each WEEKDAYS_DE as day, index}
                    {@const dayDate = days[index]}
                    <button
                        type="button"
                        on:click={() => (selectedDay = index)}
                        class="p-2 rounded-lg text-xs font-semibold transition-colors {selectedDay ===
                        index
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'}"
                    >
                        <div>{day}</div>
                        <div class="text-[10px] opacity-70 mt-0.5">
                            {formatDateForDisplay(dayDate)}
                        </div>
                    </button>
                {/each}
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
