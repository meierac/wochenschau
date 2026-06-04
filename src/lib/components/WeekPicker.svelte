<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import IconButton from "./IconButton.svelte";
    import SwipeableSheet from "./SwipeableSheet.svelte";
    import CalendarDatePicker from "./CalendarDatePicker.svelte";
    import SubscriptionToggleList from "./SubscriptionToggleList.svelte";

    export let currentWeek: number;
    export let currentYear: number;
    export let isDesktop = false;
    export let desktopViewMode: "week" | "month" = "week";
    export let selectedMonthDate: Date = new Date();
    export let autoCloseOnWeekSelect = true;

    const dispatch = createEventDispatcher<{
        weekSelected: { week: number; year: number };
        monthSelected: { date: Date };
        close: void;
    }>();

    function handleClose() {
        dispatch("close");
    }

    function handleWeekSelected(
        event: CustomEvent<{ week: number; year: number }>,
    ) {
        dispatch("weekSelected", event.detail);
        if (autoCloseOnWeekSelect) {
            queueMicrotask(() => handleClose());
        }
    }

    function handleMonthSelected(event: CustomEvent<{ date: Date }>) {
        dispatch("monthSelected", event.detail);
        if (autoCloseOnWeekSelect) {
            queueMicrotask(() => handleClose());
        }
    }
</script>

<SwipeableSheet
    {isDesktop}
    desktopMaxWidth="28rem"
    maxHeight="95vh"
    on:close={handleClose}
>
    <div class="px-3 py-3 flex items-center justify-between">
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

        <h3 class="text-lg font-semibold text-foreground flex-1 text-center">
            {desktopViewMode === "month" ? "Select Month" : "Select Week"}
        </h3>

        <div class="w-10 h-10"></div>
    </div>

    <div class="p-3 space-y-6 pb-12 sheet-content">
        <CalendarDatePicker
            viewMode={desktopViewMode}
            {currentWeek}
            {currentYear}
            {selectedMonthDate}
            on:weekSelected={handleWeekSelected}
            on:monthSelected={handleMonthSelected}
        />

        <div class="border-t border-border pt-6">
            <SubscriptionToggleList />
        </div>
    </div>
</SwipeableSheet>
