<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { activities } from "../stores/activities";
    import { templates } from "../stores/templates";
    import { currentWeek, currentYear } from "../stores/week";
    import {
        WEEKDAYS_DE,
        type CalendarItem,
        type ActivityTemplate,
    } from "../types/index";
    import IconButton from "./IconButton.svelte";
    import SwipeableSheet from "./SwipeableSheet.svelte";

    export let isDesktop = false;

    const dispatch = createEventDispatcher();

    let step: "selectDay" | "details" = "selectDay";
    let selectedDay: number | null = null;
    let activityName = "";
    let startTime = "09:00";
    let endTime = "10:00";
    let saveAsTemplate = false;
    let selectedTemplate: string | null = null;

    $: filteredTemplates = $templates;
    $: isCurrentActivityTemplate =
        selectedTemplate !== null ||
        $templates.some(
            (t) =>
                t.name === activityName &&
                t.startTime === startTime &&
                t.endTime === endTime,
        );

    function handleSelectDay(day: number) {
        selectedDay = day;
        step = "details";
    }

    function handleUseTemplate(templateId: string) {
        const template = $templates.find((t) => t.id === templateId);
        if (template) {
            activityName = template.name;
            startTime = template.startTime;
            endTime = template.endTime;
            selectedTemplate = templateId;
        }
    }

    function formatDateToICalDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}${month}${day}`;
    }

    function getDayDate(dayIndex: number): Date {
        // Calculate the actual date for the given day in current week
        const firstDay = new Date($currentYear, 0, 1);
        const weekStart = new Date(firstDay);
        const dayOfWeek = firstDay.getDay();
        const daysUntilMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weekStart.setDate(
            firstDay.getDate() - daysUntilMonday + ($currentWeek - 1) * 7,
        );

        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + dayIndex);
        return dayDate;
    }

    function formatDateForDisplay(date: Date): string {
        return date.toLocaleDateString("de-DE", {
            month: "short",
            day: "numeric",
        });
    }

    function handleSaveActivity() {
        if (!activityName.trim() || selectedDay === null) return;

        const now = Date.now();
        const dayDate = getDayDate(selectedDay);
        const startDate = formatDateToICalDate(dayDate);
        const dtstart = `${startDate}T${startTime.replace(":", "")}00`;
        const dtend = `${startDate}T${endTime.replace(":", "")}00`;

        const activity: CalendarItem = {
            id: `manual-${now}`,
            summary: activityName,
            description: "",
            dtstart,
            dtend,
            startDate,
            endDate: startDate,
            startTime,
            endTime,
            day: selectedDay,
            week: $currentWeek,
            year: $currentYear,
            isAllDay: false,
            source: "manual",
            createdAt: now,
            lastModified: now,
        };

        activities.addActivity(activity);

        if (saveAsTemplate) {
            const template: ActivityTemplate = {
                id: `template-${Date.now()}`,
                name: activityName,
                startTime,
                endTime,
                createdAt: Date.now(),
            };
            templates.addTemplate(template);
        }

        dispatch("close");
    }

    function handleClose() {
        dispatch("close");
    }
</script>

<SwipeableSheet
    {isDesktop}
    desktopMaxWidth="28rem"
    maxHeight="95vh"
    on:close={handleClose}
>
    <!-- Header with centered title and icon buttons -->
    <div class="px-3 py-3 flex items-center justify-between">
        <!-- Cancel button (left) -->
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

        <!-- Centered title -->
        <h3 class="text-lg font-semibold text-foreground flex-1 text-center">
            {step === "selectDay" ? "Select Day" : "Activity Details"}
        </h3>

        <!-- Next/Save button (right) -->
        <IconButton
            variant="secondary"
            size="lg"
            ariaLabel={step === "selectDay" ? "Next" : "Save activity"}
            disabled={step === "selectDay"
                ? selectedDay === null
                : !activityName.trim()}
            on:click={step === "selectDay"
                ? () => {
                      if (selectedDay !== null) {
                          handleSelectDay(selectedDay);
                      }
                  }
                : handleSaveActivity}
        >
            {#if step === "selectDay"}
                <!-- Chevron Right for Next -->
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
                        d="M9 5l7 7-7 7"
                    />
                </svg>
            {:else}
                <!-- Checkmark for Save -->
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
            {/if}
        </IconButton>
    </div>

    <!-- Content -->
    <div class="p-3 pb-8 max-h-[60vh] overflow-y-auto sheet-content">
        {#if step === "selectDay"}
            <!-- Day Selection -->
            <div class="space-y-2">
                <p class="text-sm text-muted-foreground mb-4">
                    Select a day to add activity
                </p>
                <div class="space-y-2">
                    {#each WEEKDAYS_DE as day, index}
                        {@const dayDate = getDayDate(index)}
                        <button
                            on:click={() => handleSelectDay(index)}
                            class="w-full p-3 rounded-2xl font-semibold text-sm transition-colors bg-muted/50 hover:bg-primary hover:text-primary-foreground active:opacity-80 flex items-center justify-between"
                        >
                            <span>{day}</span>
                            <span class="text-xs opacity-70">
                                {formatDateForDisplay(dayDate)}
                            </span>
                        </button>
                    {/each}
                </div>
            </div>
        {:else if step === "details" && selectedDay !== null}
            <!-- Activity Details -->
            <div class="space-y-4">
                <!-- Templates Section -->
                {#if filteredTemplates.length > 0}
                    <div class="space-y-2 p-3 bg-muted/50 rounded-2xl">
                        <div
                            class="text-xs font-semibold text-foreground block mb-2"
                        >
                            Use Template
                        </div>
                        <div class="space-y-1 max-h-32 overflow-y-auto">
                            {#each filteredTemplates as template}
                                <button
                                    on:click={() =>
                                        handleUseTemplate(template.id)}
                                    class={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                                        selectedTemplate === template.id
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-background hover:bg-primary/10"
                                    }`}
                                >
                                    <div class="font-semibold">
                                        {template.name}
                                    </div>
                                    <div class="text-muted-foreground">
                                        {template.startTime} - {template.endTime}
                                    </div>
                                </button>
                            {/each}
                        </div>
                    </div>
                {/if}

                <!-- Activity Name -->
                <div>
                    <label
                        for="activity-name"
                        class="text-xs font-semibold text-foreground block mb-2"
                        >Activity Name</label
                    >
                    <input
                        id="activity-name"
                        type="text"
                        bind:value={activityName}
                        placeholder="Enter activity name"
                        class="w-full px-3 py-2 bg-background border border-input rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>

                <!-- Time Selection -->
                <div class="grid grid-cols-2 gap-1">
                    <div>
                        <label
                            for="start-time"
                            class="text-xs font-semibold text-foreground block mb-2"
                            >Start Time</label
                        >
                        <input
                            id="start-time"
                            type="time"
                            bind:value={startTime}
                            class="w-full min-w-10 px-3 py-2 bg-background border border-input rounded-2xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <div>
                        <label
                            for="end-time"
                            class="text-xs font-semibold text-foreground block mb-2"
                            >End Time</label
                        >
                        <input
                            id="end-time"
                            type="time"
                            bind:value={endTime}
                            class="w-full min-w-10 px-3 py-2 bg-background border border-input rounded-2xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                </div>

                <!-- Save as Template -->
                <label
                    class="flex items-center gap-2 {isCurrentActivityTemplate
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer'}"
                >
                    <input
                        type="checkbox"
                        bind:checked={saveAsTemplate}
                        disabled={isCurrentActivityTemplate}
                        class="w-4 h-4 rounded border-input {isCurrentActivityTemplate
                            ? 'cursor-not-allowed'
                            : 'cursor-pointer'}"
                    />
                    <span class="text-sm text-foreground">
                        {isCurrentActivityTemplate
                            ? "Already a template"
                            : "Save as template for reuse"}
                    </span>
                </label>

                <!-- Selected Day Info -->
                <div class="p-2 rounded-lg text-sm">
                    <span class="text-muted-foreground">Adding to:</span>
                    <span class="font-semibold text-foreground ml-1"
                        >{WEEKDAYS_DE[selectedDay]} ({formatDateForDisplay(
                            getDayDate(selectedDay),
                        )})</span
                    >
                </div>
            </div>
        {/if}
    </div>
</SwipeableSheet>
