<script lang="ts">
    import type { CalendarItem } from "../types/index";
    import { createEventDispatcher } from "svelte";
    import IconButton from "./IconButton.svelte";

    export let activity: CalendarItem;

    const dispatch = createEventDispatcher();

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let swipeOffset = 0;
    let isDragging = false;
    let isDesktop = false;
    let isHovering = false;

    function handleResize() {
        isDesktop = window.innerWidth >= 768;
    }

    function handleTouchStart(e: TouchEvent) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        swipeOffset = 0;
        isDragging = false;
    }

    function handleTouchMove(e: TouchEvent) {
        const currentX = e.changedTouches[0].screenX;
        const currentY = e.changedTouches[0].screenY;
        const deltaX = currentX - touchStartX;
        const deltaY = Math.abs(currentY - touchStartY);

        // Only track horizontal movement (ignore vertical scroll)
        // Require 15px horizontal movement AND horizontal movement > vertical movement
        if (Math.abs(deltaX) > 15 && Math.abs(deltaX) > deltaY * 1.5) {
            isDragging = true;
            e.preventDefault();

            // Limit swipe offset based on direction
            if (deltaX > 0) {
                // Right swipe (delete) - limit to 100px
                swipeOffset = Math.min(deltaX, 100);
            } else {
                // Left swipe (edit) - limit to -100px
                swipeOffset = Math.max(deltaX, -100);
            }
            touchEndX = currentX;
        }
    }

    function handleTouchEnd() {
        const deltaX = touchEndX - touchStartX;
        const minSwipeDistance = 50; // Minimum swipe distance to trigger action (increased from 40)

        // Only trigger actions if we were actually dragging
        if (isDragging) {
            // Right swipe (positive deltaX) = delete
            if (deltaX > minSwipeDistance) {
                handleDelete();
            }
            // Left swipe (negative deltaX) = edit
            else if (deltaX < -minSwipeDistance) {
                handleEdit();
            }
        }

        swipeOffset = 0;
        isDragging = false;
    }

    function handleEdit() {
        dispatch("edit", activity);
    }

    function handleDelete() {
        if (confirm(`Delete activity "${activity.summary}"?`)) {
            dispatch("delete");
        }
    }

    function isAllDayEvent(): boolean {
        // Check if explicitly marked as all-day
        if (activity.isAllDay) return true;

        // Check if start time equals end time
        if (activity.startTime === activity.endTime) return true;

        // Check if spans entire day (00:00 to 23:59)
        if (activity.startTime === "00:00" && activity.endTime === "23:59")
            return true;

        return false;
    }

    $: if (typeof window !== "undefined") {
        isDesktop = window.innerWidth >= 768;
    }
</script>

<svelte:window on:resize={handleResize} />

<div
    class="relative overflow-hidden rounded-md group"
    role="presentation"
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
    on:mouseenter={() => (isHovering = true)}
    on:mouseleave={() => (isHovering = false)}
>
    <!-- Delete action (right swipe reveal) - mobile only -->
    {#if !isDesktop}
        <div
            class="absolute inset-y-0 rounded-md left-0 w-24 bg-destructive/90 flex items-center justify-center text-white font-semibold"
        >
            Delete
        </div>
    {/if}

    <!-- Edit action (left swipe reveal) - mobile only -->
    {#if !isDesktop}
        <div
            class="absolute inset-y-0 rounded-md right-0 w-24 bg-primary/90 flex items-center justify-center text-white font-semibold"
        >
            Edit
        </div>
    {/if}

    <!-- Main card -->
    <div
        class="bg-secondary p-3 rounded-md transition-transform relative"
        style="transform: translateX({swipeOffset}px); {isDragging
            ? 'transition: none;'
            : ''}"
    >
        <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
                <div
                    class="font-semibold text-foreground text-sm md:text-base truncate"
                >
                    {activity.summary}
                </div>
                {#if isAllDayEvent()}
                    <div class="text-sm text-muted-foreground">All-Day</div>
                {:else}
                    <div class="text-sm text-muted-foreground">
                        {activity.startTime} - {activity.endTime}
                    </div>
                {/if}
            </div>

            <!-- Action buttons - visible on mobile, hover overlay on desktop -->

            <!-- Mobile: Always visible buttons -->
            <div
                class="bg-muted flex gap-0 shrink-0 absolute right-1 top-1 {isHovering &&
                isDesktop
                    ? 'opacity-100'
                    : 'opacity-0 pointer-events-none'}"
            >
                <IconButton
                    on:click={handleEdit}
                    class="px-1 py-1 hover:bg-primary/20 rounded text-primary transition-colors font-semibold md:text-lg active:bg-primary/30"
                    aria-label="Edit activity"
                    title="Edit activity"
                >
                    <svg
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        /></svg
                    >
                </IconButton>
                <IconButton
                    on:click={handleDelete}
                    class="px-1 py-1 hover:bg-destructive/20 rounded text-destructive transition-colors font-semibold md:text-lg active:bg-destructive/30 {isHovering &&
                    isDesktop
                        ? 'opacity-100'
                        : 'opacity-0 pointer-events-none'}"
                    aria-label="Delete activity"
                    title="Delete activity"
                >
                    <svg
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        /></svg
                    >
                </IconButton>
            </div>
        </div>
    </div>
</div>
