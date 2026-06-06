<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import CalendarDatePicker from "./CalendarDatePicker.svelte";
    import SubscriptionToggleList from "./SubscriptionToggleList.svelte";

    export let currentWeek: number;
    export let currentYear: number;
    export let desktopViewMode: "week" | "month" = "week";
    export let selectedMonthDate: Date = new Date();

    const dispatch = createEventDispatcher<{
        weekSelected: { week: number; year: number };
        monthSelected: { date: Date };
    }>();
</script>

<aside
    class="flex h-full min-w-[20rem] max-w-[25rem] shrink-0 flex-col flex-1 overflow-hidden rounded-3xl card-glass-surface"
>
    <div class="flex-1 overflow-y-auto">
        <div class="space-y-6 p-4">
            <CalendarDatePicker
                viewMode={desktopViewMode}
                {currentWeek}
                {currentYear}
                {selectedMonthDate}
                on:weekSelected={(event) =>
                    dispatch("weekSelected", event.detail)}
                on:monthSelected={(event) =>
                    dispatch("monthSelected", event.detail)}
            />

            <div class="border-t border-border pt-6">
                <SubscriptionToggleList />
            </div>
        </div>
    </div>
</aside>
