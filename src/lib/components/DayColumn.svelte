<script lang="ts">
    import type { CalendarItem } from "../types/index";
    import { WEEKDAYS } from "../types/index";
    import { activities } from "../stores/activities";
    import ActivityCard from "./ActivityCard.svelte";
    import ActivityEditSheet from "./ActivityEditSheet.svelte";

    export let day: Date;
    export let dayIndex: number;
    export let dayActivities: CalendarItem[] = [];

    let editingActivity: CalendarItem | null = null;

    function formatDate(date: Date): string {
        return date.toLocaleDateString("de-DE", {
            month: "short",
            day: "numeric",
        });
    }

    function handleEditActivity(event: CustomEvent<CalendarItem>) {
        editingActivity = event.detail;
    }

    function handleDeleteActivity(activity: CalendarItem) {
        activities.removeActivity(activity.id);
    }

    function handleSaveActivity(event: CustomEvent<CalendarItem>) {
        const updatedActivity = event.detail;
        activities.updateActivity(updatedActivity);
        editingActivity = null;
    }

    function handleCloseEditSheet() {
        editingActivity = null;
    }
</script>

<div
    class="flex flex-col h-full bg-card rounded-lg border border-border p-2 md:p-3 {dayIndex ===
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

<!-- Edit Sheet -->
{#if editingActivity}
    <ActivityEditSheet
        activity={editingActivity}
        on:save={handleSaveActivity}
        on:delete={() => {
            if (editingActivity) {
                activities.removeActivity(editingActivity.id);
            }
            editingActivity = null;
        }}
        on:close={handleCloseEditSheet}
    />
{/if}
