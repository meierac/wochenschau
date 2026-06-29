<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { CalendarItem } from "../types/index";
    import { WEEKDAYS } from "../types/index";
    import ActivityCard from "./ActivityCard.svelte";

    export let day: Date;
    export let dayIndex: number;
    export let dayActivities: CalendarItem[] = [];

    // Dispatch events upward so App (or a higher-level component) can manage the edit sheet
    const dispatch = createEventDispatcher<{
        requestViewActivity: CalendarItem;
        requestEditActivity: CalendarItem;
        requestDeleteActivity: CalendarItem;
    }>();

    function formatDate(date: Date): string {
        return date.toLocaleDateString("de-DE", {
            month: "short",
            day: "numeric",
        });
    }

    function handleOpenActivity(event: CustomEvent<CalendarItem>) {
        dispatch("requestViewActivity", event.detail);
    }

    function handleEditActivity(event: CustomEvent<CalendarItem>) {
        // Bubble the activity up to the parent – no local sheet management anymore
        dispatch("requestEditActivity", event.detail);
    }

    function handleDeleteActivity(event: CustomEvent<CalendarItem>) {
        dispatch("requestDeleteActivity", event.detail);
    }
</script>

<div
    class="flex flex-col min-w-[12rem] h-full card-glass-surface rounded-3xl p-2 md:p-3 {dayIndex ===
    0
        ? 'md:mt-0 mt-14'
        : ''}"
>
    <!-- Day Header -->
    <div class="mb-2 md:mb-3 pb-2 md:pb-3 border-b border-border shrink-0">
        <div class="text-xs ml-3 md:text-sm font-semibold text-foreground">
            {WEEKDAYS[dayIndex]} • {formatDate(day)}
        </div>
    </div>

    <!-- Activities List -->
    <div class="flex-1 space-y-1 md:space-y-2 overflow-hidden">
        {#if dayActivities.length === 0}
            <div class="text-xs text-muted-foreground text-center py-4 md:py-8">
                No activities
            </div>
        {:else}
            <div class="space-y-1 md:space-y-2">
                {#each dayActivities as activity (activity.id)}
                    <ActivityCard
                        {activity}
                        on:open={handleOpenActivity}
                        on:edit={handleEditActivity}
                        on:delete={handleDeleteActivity}
                    />
                {/each}
            </div>
        {/if}
    </div>
</div>

<!--
    ActivityEditSheet management removed.
    Parent component should listen for:
    - on:requestViewActivity to open the global ActivityDetailsSheet
    - on:requestEditActivity to open the global ActivityEditSheet
    - on:requestDeleteActivity to open the global ConfirmDialog
-->
