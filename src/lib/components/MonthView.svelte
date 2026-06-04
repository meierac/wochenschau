<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { derived } from "svelte/store";

    import { activities } from "../stores/activities";
    import { subscriptions } from "../stores/ical";
    import { getCalendarToday } from "../utils/date";
    import { sortActivitiesByDisplayOrder } from "../utils/activityDisplay";
    import type { CalendarItem, ICalSubscription } from "../types/index";

    export let referenceDate: Date;

    const dispatch = createEventDispatcher<{
        requestEditActivity: CalendarItem;
    }>();

    type MonthCell = {
        date: Date;
        dateKey: string;
        inCurrentMonth: boolean;
        isToday: boolean;
        activities: CalendarItem[];
    };

    const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const enabledSubscriptions = derived(
        subscriptions,
        ($subs: ICalSubscription[]) =>
            new Set($subs.filter((s) => s.enabled).map((s) => s.id)),
    );

    function toDateKey(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}${month}${day}`;
    }

    function getMonthGridDates(date: Date): Date[] {
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const gridStart = new Date(monthStart);
        const startOffset = (monthStart.getDay() + 6) % 7;
        gridStart.setDate(monthStart.getDate() - startOffset);

        const gridEnd = new Date(monthEnd);
        const endOffset = 6 - ((monthEnd.getDay() + 6) % 7);
        gridEnd.setDate(monthEnd.getDate() + endOffset);

        const dates: Date[] = [];
        const cursor = new Date(gridStart);
        while (cursor <= gridEnd) {
            dates.push(new Date(cursor));
            cursor.setDate(cursor.getDate() + 1);
        }

        return dates;
    }

    function formatActivityMeta(activity: CalendarItem): string {
        return activity.isAllDay
            ? "All-day"
            : `${activity.startTime}–${activity.endTime}`;
    }

    function handleEditActivity(activity: CalendarItem) {
        dispatch("requestEditActivity", activity);
    }

    $: todayKey = toDateKey(getCalendarToday());
    $: monthGridDates = getMonthGridDates(referenceDate);
    $: monthDateKeys = new Set(monthGridDates.map((date) => toDateKey(date)));

    $: visibleActivities = sortActivitiesByDisplayOrder(
        $activities
            .filter((activity) => monthDateKeys.has(activity.startDate))
            .filter(
                (activity) =>
                    activity.source !== "ical" ||
                    (activity.sourceId &&
                        $enabledSubscriptions.has(activity.sourceId)),
            ),
    );

    $: activitiesByDate = visibleActivities.reduce((map, activity) => {
        const list = map.get(activity.startDate) ?? [];
        list.push(activity);
        map.set(activity.startDate, list);
        return map;
    }, new Map<string, CalendarItem[]>());

    $: monthCells = monthGridDates.map((date): MonthCell => {
        const dateKey = toDateKey(date);
        return {
            date,
            dateKey,
            inCurrentMonth: date.getMonth() === referenceDate.getMonth(),
            isToday: dateKey === todayKey,
            activities: activitiesByDate.get(dateKey) ?? [],
        };
    });
</script>

<div
    class="flex h-full min-h-0 flex-col rounded-t-3xl rounded-b-xl border border-border bg-card p-0.5 overflow-hidden"
>
    <div class="grid grid-cols-7 gap-2 py-3">
        {#each weekdayLabels as weekday}
            <div
                class="px-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
                {weekday}
            </div>
        {/each}
    </div>

    <div class="grid flex-1 auto-rows-fr grid-cols-7 gap-0.5 overflow-y-auto">
        {#each monthCells as cell}
            <div
                class={`flex min-h-[130px] flex-col rounded-lg border p-1 ${
                    cell.inCurrentMonth
                        ? "border-border bg-background"
                        : "border-border/60 bg-card text-muted-foreground"
                }`}
            >
                <div class="mb-1 flex items-center justify-between gap-2">
                    <span
                        class={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-2 text-sm font-semibold ${
                            cell.isToday
                                ? "bg-primary text-primary-foreground"
                                : cell.inCurrentMonth
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                        }`}
                    >
                        {cell.date.getDate()}
                    </span>
                </div>

                <div class=" overflow-y-scroll">
                    {#each cell.activities.slice(0, 3) as activity}
                        <button
                            type="button"
                            on:click={() => handleEditActivity(activity)}
                            class="w-full rounded-md bg-secondary/70 px-2 py-1 text-left transition-colors hover:bg-secondary"
                            style={`border-left-color: ${activity.color ?? "var(--primary)"};`}
                        >
                            <div
                                class="truncate text-xs font-semibold text-foreground"
                            >
                                {activity.summary}
                            </div>
                            <div
                                class="truncate text-[10px] text-muted-foreground"
                            >
                                {formatActivityMeta(activity)}
                            </div>
                        </button>
                    {/each}

                    {#if cell.activities.length > 3}
                        <div
                            class="px-1 text-[10px] font-medium text-muted-foreground"
                        >
                            +{cell.activities.length - 3} more
                        </div>
                    {/if}
                </div>
            </div>
        {/each}
    </div>
</div>
