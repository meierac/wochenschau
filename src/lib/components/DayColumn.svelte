<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { CalendarItem } from "../types/index";
    import { WEEKDAYS } from "../types/index";
    import { activities } from "../stores/activities";
    import ActivityCard from "./ActivityCard.svelte";

    export let day: Date;
    export let dayIndex: number;
    export let dayActivities: CalendarItem[] = [];
    export let isDesktop = false;

    // Dispatch events upward so App (or a higher-level component) can manage the edit sheet
    const dispatch = createEventDispatcher<{
        requestEditActivity: CalendarItem;
        deleteActivity: string;
    }>();

    // Debug logging
    $: console.log("DayColumn isDesktop:", isDesktop);

    function formatDate(date: Date): string {
        return date.toLocaleDateString("de-DE", {
            month: "short",
            day: "numeric",
        });
    }

    function handleEditActivity(event: CustomEvent<CalendarItem>) {
        // Bubble the activity up to the parent – no local sheet management anymore
        dispatch("requestEditActivity", event.detail);
    }

    function handleDeleteActivity(activity: CalendarItem) {
        activities.removeActivity(activity.id);
        dispatch("deleteActivity", activity.id);
    }
</script>

<div
    class="flex flex-col h-full bg-card rounded-xl border border-border p-2 md:p-3 {dayIndex ===
    0
        ? 'md:mt-0 mt-14'
        : ''}"
>
    <!-- Day Header -->
    <div class="mb-2 md:mb-3 pb-2 md:pb-3 border-b border-border shrink-0">
        <div class="text-xs md:text-sm font-semibold text-foreground">
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
                        on:edit={handleEditActivity}
                        on:delete={() => handleDeleteActivity(activity)}
                    />
                {/each}
            </div>
        {/if}
    </div>
</div>

<!--
    ActivityEditSheet management removed.
    Parent component should listen for:
    - on:requestEditActivity to open the global ActivityEditSheet
    - on:deleteActivity (optional) if parent wants to react to deletions
-->
