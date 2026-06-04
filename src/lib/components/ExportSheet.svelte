<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import { activities } from "../stores/activities";
    import { currentWeek, currentYear } from "../stores/week";
    import { exportSettings } from "../stores/exportSettings";
    import { bibleVerse } from "../stores/bibleVerse";
    import { getDaysOfWeek, getNextWeek, getPreviousWeek } from "../utils/date";
    import {
        isAllDayActivity,
        sortActivitiesByDisplayOrder,
    } from "../utils/activityDisplay";
    import { WEEKDAYS_DE } from "../types/index";
    import type { ICalSubscription } from "../types/index";
    import { subscriptions } from "../stores/ical";
    import IconButton from "./IconButton.svelte";
    import Button from "./Button.svelte";
    import SwipeableSheet from "./SwipeableSheet.svelte";

    export let isDesktop = false;

    type LayoutMode = "grid" | "list" | "compact";
    type ExportRangeMode = "this-week" | "weekend" | "custom";
    type ExportWindowWeekKey = "previous" | "current" | "next";
    type ExportWindowDay = {
        globalIndex: number;
        dayIndex: number;
        date: Date;
        week: number;
        year: number;
        weekKey: ExportWindowWeekKey;
        activities: any[];
    };

    const dispatch = createEventDispatcher();

    let isExporting = false;
    let exportError = "";
    let layoutMode: LayoutMode = "grid";
    let showPreview = true;
    let rangeMode: ExportRangeMode = "this-week";
    let rangeStartIndex = 7;
    let rangeEndIndex = 13;
    let previousWeekDays: Date[] = [];
    let currentWeekDays: Date[] = [];
    let nextWeekDays: Date[] = [];
    let previousWeekInfo = { week: 1, year: 1970 };
    let nextWeekInfo = { week: 1, year: 1970 };
    let exportWindowDays: ExportWindowDay[] = [];
    let visibleDays: ExportWindowDay[] = [];
    let selectedDaysLabel = "Current week";
    let gridColumnCount = 4;
    let shouldCenterGridDays = false;
    let centeredGridWidth = "100%";
    let previewWidth = "900px";

    const THIS_WEEK_RANGE = { start: 7, end: 13 };
    const WEEKEND_RANGE = { start: 11, end: 13 };

    function clampRangeIndex(index: number): number {
        if (Number.isNaN(index)) return 7;
        return Math.min(20, Math.max(0, index));
    }

    function inferRangeMode(start: number, end: number): ExportRangeMode {
        if (start === THIS_WEEK_RANGE.start && end === THIS_WEEK_RANGE.end) {
            return "this-week";
        }
        if (start === WEEKEND_RANGE.start && end === WEEKEND_RANGE.end) {
            return "weekend";
        }
        return "custom";
    }

    function persistRangePreferences() {
        if (typeof window !== "undefined") {
            localStorage.setItem("exportRangeMode", rangeMode);
            localStorage.setItem(
                "exportDayRangeStart",
                String(rangeStartIndex),
            );
            localStorage.setItem("exportDayRangeEnd", String(rangeEndIndex));
        }
    }

    function applyRange(
        start: number,
        end: number,
        mode: ExportRangeMode = "custom",
    ) {
        rangeStartIndex = clampRangeIndex(start);
        rangeEndIndex = clampRangeIndex(end);
        if (rangeEndIndex < rangeStartIndex) {
            rangeEndIndex = rangeStartIndex;
        }
        rangeMode = mode;
        persistRangePreferences();
    }

    function setRangeMode(mode: ExportRangeMode) {
        if (mode === "this-week") {
            applyRange(THIS_WEEK_RANGE.start, THIS_WEEK_RANGE.end, mode);
            return;
        }

        if (mode === "weekend") {
            applyRange(WEEKEND_RANGE.start, WEEKEND_RANGE.end, mode);
            return;
        }

        rangeMode = mode;
        persistRangePreferences();
    }

    function handleDayRangeStartChange(event: Event) {
        const value = clampRangeIndex(
            Number((event.currentTarget as HTMLSelectElement).value),
        );
        applyRange(value, Math.max(value, rangeEndIndex), "custom");
    }

    function handleDayRangeEndChange(event: Event) {
        const value = clampRangeIndex(
            Number((event.currentTarget as HTMLSelectElement).value),
        );
        applyRange(Math.min(rangeStartIndex, value), value, "custom");
    }

    function saveLayoutMode(mode: LayoutMode) {
        layoutMode = mode;

        if (typeof window !== "undefined") {
            localStorage.setItem("exportLayoutMode", mode);
        }
    }

    function toggleShowPreview() {
        showPreview = !showPreview;
        if (typeof window !== "undefined") {
            localStorage.setItem("exportShowPreview", String(showPreview));
        }
    }

    function loadPreferences() {
        if (typeof window === "undefined") return;

        const savedLayoutMode = localStorage.getItem("exportLayoutMode");
        const savedShowPreview = localStorage.getItem("exportShowPreview");
        const savedRangeMode = localStorage.getItem("exportRangeMode");
        const savedDayRangeStart = localStorage.getItem("exportDayRangeStart");
        const savedDayRangeEnd = localStorage.getItem("exportDayRangeEnd");

        if (
            savedLayoutMode === "list" ||
            savedLayoutMode === "grid" ||
            savedLayoutMode === "compact"
        ) {
            layoutMode = savedLayoutMode;
        }

        if (savedShowPreview === "false") {
            showPreview = false;
        } else if (savedShowPreview === "true") {
            showPreview = true;
        }

        if (savedDayRangeStart !== null && savedDayRangeEnd !== null) {
            const parsedStart = Number(savedDayRangeStart);
            const parsedEnd = Number(savedDayRangeEnd);

            // Migrate old single-week values (0-6) into the 3-week window.
            if (
                parsedStart >= 0 &&
                parsedStart <= 6 &&
                parsedEnd >= 0 &&
                parsedEnd <= 6
            ) {
                rangeStartIndex = parsedStart + 7;
                rangeEndIndex =
                    parsedEnd >= parsedStart ? parsedEnd + 7 : parsedEnd + 14;
            } else {
                rangeStartIndex = clampRangeIndex(parsedStart);
                rangeEndIndex = clampRangeIndex(parsedEnd);
            }

            if (rangeEndIndex < rangeStartIndex) {
                rangeEndIndex = rangeStartIndex;
            }
        }

        if (
            savedRangeMode === "this-week" ||
            savedRangeMode === "weekend" ||
            savedRangeMode === "custom"
        ) {
            rangeMode = savedRangeMode;
        } else {
            rangeMode = inferRangeMode(rangeStartIndex, rangeEndIndex);
        }

        if (rangeMode === "this-week") {
            rangeStartIndex = THIS_WEEK_RANGE.start;
            rangeEndIndex = THIS_WEEK_RANGE.end;
        } else if (rangeMode === "weekend") {
            rangeStartIndex = WEEKEND_RANGE.start;
            rangeEndIndex = WEEKEND_RANGE.end;
        }
    }

    // Detect iOS Safari for scale adjustment
    const ua = navigator.userAgent;

    const isIOSSafari =
        /iPad|iPhone|iPod/.test(ua) &&
        /Safari/.test(ua) &&
        !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);

    onMount(() => {
        loadPreferences();
    });

    // Reactive: Check if background is ready for export
    $: isBackgroundReady =
        $exportSettings.backgroundMode === "image"
            ? !!$exportSettings.backgroundImage
            : true;

    /**
     * Validate and sanitize background image data URL for CSS usage
     */
    function getSafeBackgroundImageUrl(img: string | null): string {
        if (!img || !img.startsWith("data:image/")) {
            return "";
        }

        const validPrefixes = [
            "data:image/png",
            "data:image/jpeg",
            "data:image/webp",
            "data:image/gif",
        ];

        if (!validPrefixes.some((prefix) => img.startsWith(prefix))) {
            return "";
        }

        return img;
    }

    // Reactive: Get safe background image URL for CSS
    $: safeBackgroundImageUrl = getSafeBackgroundImageUrl(
        $exportSettings.backgroundImage,
    );

    function handleClose() {
        dispatch("close");
    }

    $: weekNumberFontFamily = $exportSettings.syncWeekNumberWithTitle
        ? $exportSettings.headerFontFamily
        : $exportSettings.weekNumberFontFamily;
    $: weekNumberFontSize = $exportSettings.syncWeekNumberWithTitle
        ? $exportSettings.titleFontSize
        : $exportSettings.weekNumberFontSize;
    $: weekNumberColor = $exportSettings.syncWeekNumberWithTitle
        ? $exportSettings.titleColor
        : $exportSettings.weekNumberColor;
    $: weekNumberOpacity = $exportSettings.syncWeekNumberWithTitle
        ? $exportSettings.titleOpacity / 100
        : $exportSettings.weekNumberOpacity / 100;
    $: syncedTitle =
        $exportSettings.showWeekNumber &&
        $exportSettings.syncWeekNumberWithTitle
            ? `${$exportSettings.title} KW${$currentWeek}`
            : $exportSettings.title;

    /**
     * Generate text-shadow CSS for title drop shadow
     */
    function getTitleTextShadow(): string {
        if (!$exportSettings.titleDropShadowEnabled) {
            return "none";
        }
        return `${$exportSettings.titleDropShadowOffsetX}px ${$exportSettings.titleDropShadowOffsetY}px 0 ${$exportSettings.titleDropShadowColor}`;
    }

    $: titleTextShadow = getTitleTextShadow();

    /**
     * Generate text-shadow CSS for week number drop shadow
     */
    function getWeekNumberTextShadow(): string {
        if (!$exportSettings.weekNumberDropShadowEnabled) {
            return "none";
        }
        return `${$exportSettings.weekNumberDropShadowOffsetX}px ${$exportSettings.weekNumberDropShadowOffsetY}px 0 ${$exportSettings.weekNumberDropShadowColor}`;
    }

    $: weekNumberTextShadow = getWeekNumberTextShadow();

    /**
     * Get week container background style with opacity
     */
    function getWeekContainerBackgroundStyle(): string {
        const color = $exportSettings.weekContainerBackgroundColor;
        const opacity = $exportSettings.weekContainerBackgroundOpacity;

        // If it's already an rgba color, extract and update opacity
        if (color.includes("rgba")) {
            return color.replace(/[\d.]+\)$/, `${opacity / 100})`);
        }

        // If it's a hex color, convert to rgba
        if (color.startsWith("#")) {
            const hex = color.replace("#", "");
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
        }

        // Default fallback
        return `rgba(255, 255, 255, ${opacity / 100})`;
    }

    /**
     * Generate image blob from the export preview element
     * Uses modern-screenshot for better iOS/Safari compatibility
     */
    async function generateImageBlob(): Promise<Blob | null> {
        try {
            const element = document.getElementById("export-preview");
            if (!element) {
                throw new Error("Export preview element not found");
            }

            // Import modern-screenshot
            const { domToBlob } = await import("modern-screenshot");

            // Ensure all fonts are loaded (defined in CSS via @font-face)
            await document.fonts.ready;

            // Wait for background image to be ready if using image mode
            if (
                $exportSettings.backgroundMode === "image" &&
                $exportSettings.backgroundImage
            ) {
                const bgImageElement = element.querySelector(
                    'img[alt="Background"]',
                ) as HTMLImageElement;

                if (bgImageElement && !bgImageElement.complete) {
                    await new Promise<void>((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            resolve(); // Continue anyway
                        }, 5000);

                        bgImageElement.onload = () => {
                            clearTimeout(timeout);
                            resolve();
                        };
                        bgImageElement.onerror = () => {
                            clearTimeout(timeout);
                            reject(
                                new Error("Background image failed to load"),
                            );
                        };
                    });
                }
            }

            // Wait for layout to stabilize
            await new Promise((r) => requestAnimationFrame(r));

            // Determine optimal scale based on device
            const scaleAttempts = isIOSSafari ? [3, 2] : [4];
            let blob: Blob | null = null;
            let lastError: unknown = null;

            for (const scale of scaleAttempts) {
                try {
                    blob = await domToBlob(element, {
                        scale,
                        type: "image/png",
                        quality: 1,
                        backgroundColor:
                            $exportSettings.backgroundMode === "color"
                                ? $exportSettings.backgroundColor
                                : null,
                        filter: (node) => {
                            if (node instanceof Element) {
                                return !node.classList.contains("no-export");
                            }
                            return true;
                        },
                    });

                    if (blob) {
                        break;
                    }
                } catch (error) {
                    lastError = error;
                }
            }

            if (!blob && lastError) {
                throw lastError;
            }

            if (!blob) {
                throw new Error("Failed to generate image");
            }

            return blob;
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Export failed";
            exportError = message;
            return null;
        }
    }

    function formatFileDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function getExportFileName(): string {
        if (visibleDays.length === 0) {
            return `Wochenschau_W${$currentWeek}_${$currentYear}.png`;
        }

        const startDate = visibleDays[0].date;
        const endDate = visibleDays[visibleDays.length - 1].date;
        const startPart = formatFileDate(startDate);
        const endPart = formatFileDate(endDate);
        const rangePart =
            startPart === endPart ? startPart : `${startPart}_${endPart}`;

        return `Wochenschau_${rangePart}.png`;
    }

    /**
     * Export the selected days as a downloadable PNG image
     */
    async function exportAsImage() {
        isExporting = true;
        exportError = "";

        try {
            // Refresh background image from IndexedDB if needed
            if (
                $exportSettings.backgroundMode === "image" &&
                !$exportSettings.backgroundImage
            ) {
                await exportSettings.refreshImage();
                await new Promise((r) => setTimeout(r, 500));
            }

            const blob = await generateImageBlob();
            if (!blob) {
                throw new Error("Failed to generate image");
            }

            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = getExportFileName();
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            // Close sheet after successful export
            setTimeout(() => dispatch("close"), 500);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Export failed";
            exportError = message;
        } finally {
            isExporting = false;
        }
    }

    /**
     * Copy the exported image to clipboard
     */
    async function copyToClipboard() {
        isExporting = true;
        exportError = "";

        try {
            const blob = await generateImageBlob();
            if (!blob) {
                throw new Error("Failed to generate image");
            }

            await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob }),
            ]);

            // Close sheet after successful copy
            setTimeout(() => dispatch("close"), 500);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to copy to clipboard";
            exportError = message;
        } finally {
            isExporting = false;
        }
    }

    /**
     * Share the exported image using native share API
     */
    async function performShare() {
        isExporting = true;
        exportError = "";

        try {
            // Refresh background image from IndexedDB if needed
            if (
                $exportSettings.backgroundMode === "image" &&
                !$exportSettings.backgroundImage
            ) {
                await exportSettings.refreshImage();
                await new Promise((r) => setTimeout(r, 500));
            }

            const blob = await generateImageBlob();
            if (!blob) {
                throw new Error("Failed to generate image");
            }

            // Create file for sharing
            const file = new File([blob], getExportFileName(), {
                type: "image/png",
            });

            if (!navigator.share) {
                throw new Error("Web Share API not supported on this device");
            }

            await navigator.share({
                files: [file],
            });

            // Close sheet after successful share
            setTimeout(() => dispatch("close"), 500);
        } catch (error: any) {
            // Don't show error if user cancelled share
            if (error.name !== "AbortError") {
                const message =
                    error instanceof Error ? error.message : "Failed to share";
                exportError = message;
            }
        } finally {
            isExporting = false;
        }
    }

    // Reactive: build a 3-week export window (previous/current/next)
    $: previousWeekInfo = getPreviousWeek($currentWeek, $currentYear);
    $: currentWeekDays = getDaysOfWeek($currentWeek, $currentYear);
    $: previousWeekDays = getDaysOfWeek(
        previousWeekInfo.week,
        previousWeekInfo.year,
    );
    $: nextWeekInfo = getNextWeek($currentWeek, $currentYear);
    $: nextWeekDays = getDaysOfWeek(nextWeekInfo.week, nextWeekInfo.year);

    function getWeekLabel(weekKey: ExportWindowWeekKey): string {
        if (weekKey === "previous") return "Previous week";
        if (weekKey === "next") return "Upcoming week";
        return "Current week";
    }

    function getWindowDayLabel(day: ExportWindowDay): string {
        return `${WEEKDAYS_DE[day.dayIndex]} · ${formatDate(day.date)} · ${getWeekLabel(day.weekKey)}`;
    }

    function formatSelectionLabel(days: ExportWindowDay[]): string {
        if (days.length === 0) return "No days selected";
        if (
            days.length === 7 &&
            days.every((day) => day.weekKey === "current")
        ) {
            return "Current week";
        }
        if (days.length === 1) {
            return getWindowDayLabel(days[0]);
        }

        const startDay = days[0];
        const endDay = days[days.length - 1];
        return `${getWindowDayLabel(startDay)} → ${getWindowDayLabel(endDay)} (${days.length} days)`;
    }

    // Reactive: Enabled subscription IDs (only active ones)
    $: enabledSubscriptions = new Set(
        $subscriptions
            .filter((s: ICalSubscription) => s.enabled)
            .map((s: ICalSubscription) => s.id),
    );

    $: exportActivities = sortActivitiesByDisplayOrder(
        $activities
            .filter(
                (a) =>
                    (a.week === previousWeekInfo.week &&
                        a.year === previousWeekInfo.year) ||
                    (a.week === $currentWeek && a.year === $currentYear) ||
                    (a.week === nextWeekInfo.week &&
                        a.year === nextWeekInfo.year),
            )
            .filter(
                (a) =>
                    a.source !== "ical" ||
                    (a.sourceId && enabledSubscriptions.has(a.sourceId)),
            ),
    );

    function getActivitiesForExportDay(day: ExportWindowDay) {
        return exportActivities.filter(
            (activity) =>
                activity.week === day.week &&
                activity.year === day.year &&
                activity.day === day.dayIndex,
        );
    }

    $: exportWindowDays = [
        ...previousWeekDays.map((date, dayIndex) => ({
            globalIndex: dayIndex,
            dayIndex,
            date,
            week: previousWeekInfo.week,
            year: previousWeekInfo.year,
            weekKey: "previous" as const,
            activities: [],
        })),
        ...currentWeekDays.map((date, dayIndex) => ({
            globalIndex: dayIndex + 7,
            dayIndex,
            date,
            week: $currentWeek,
            year: $currentYear,
            weekKey: "current" as const,
            activities: [],
        })),
        ...nextWeekDays.map((date, dayIndex) => ({
            globalIndex: dayIndex + 14,
            dayIndex,
            date,
            week: nextWeekInfo.week,
            year: nextWeekInfo.year,
            weekKey: "next" as const,
            activities: [],
        })),
    ];
    $: visibleDays = exportWindowDays
        .slice(rangeStartIndex, rangeEndIndex + 1)
        .map((day) => ({
            ...day,
            activities: getActivitiesForExportDay(day),
        }));
    $: selectedDaysLabel = formatSelectionLabel(visibleDays);
    $: shouldCenterGridDays = visibleDays.length <= 3;
    $: gridColumnCount = shouldCenterGridDays
        ? Math.max(1, visibleDays.length)
        : 4;
    $: centeredGridWidth = "100%";
    $: previewWidth =
        layoutMode === "grid"
            ? "900px"
            : layoutMode === "list"
              ? "400px"
              : "360px";

    /**
     * Format date for display
     */
    function formatDate(date: Date): string {
        return date.toLocaleDateString("de-DE", {
            month: "short",
            day: "numeric",
        });
    }

    /**
     * Check if an activity is an all-day event
     */
    function isAllDayEvent(activity: any): boolean {
        return isAllDayActivity(activity);
    }
</script>

<SwipeableSheet
    {isDesktop}
    maxHeight="95vh"
    desktopMaxWidth="56rem"
    on:close={handleClose}
>
    <!-- Header -->
    <div class="px-3 py-3 flex items-center justify-between shrink-0">
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
            Export
        </h3>

        <div class="w-6"></div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-3 space-y-3 sheet-content">
        {#if exportError}
            <div
                class="p-4 bg-destructive/10 border border-destructive/30 rounded-lg"
            >
                <p class="text-sm text-destructive">{exportError}</p>
            </div>
        {/if}

        <!-- Preview Controls -->
        <fieldset class="space-y-3">
            <div class="flex items-center justify-between">
                <legend class="text-sm font-semibold text-foreground"
                    >Preview</legend
                >
                <div class="flex gap-2 items-center">
                    <!-- Preview Visibility Toggle -->
                    <button
                        class="px-3 py-1.5 rounded-3xl text-sm font-medium transition-colors {showPreview
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'}"
                        on:click={toggleShowPreview}
                        title={showPreview ? "Hide preview" : "Show preview"}
                    >
                        {showPreview ? "Preview On" : "Preview Off"}
                    </button>

                    <!-- Grid/List/Compact View Buttons -->
                    <div class="flex gap-1 bg-muted/50 p-1 rounded-3xl">
                        <button
                            class="px-3 py-1.5 rounded-3xl text-sm font-medium transition-colors {layoutMode ===
                            'grid'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-transparent text-foreground hover:bg-muted-foreground/10'}"
                            on:click={() => saveLayoutMode("grid")}
                            title="Grid view"
                        >
                            <svg
                                class="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"
                                />
                            </svg>
                        </button>
                        <button
                            class="px-3 py-1.5 rounded-3xl text-sm font-medium transition-colors {layoutMode ===
                            'list'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-transparent text-foreground hover:bg-muted-foreground/10'}"
                            on:click={() => saveLayoutMode("list")}
                            title="List view"
                        >
                            <svg
                                class="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"
                                />
                            </svg>
                        </button>
                        <button
                            class="px-3 py-1.5 rounded-3xl text-sm font-medium transition-colors {layoutMode ===
                            'compact'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-transparent text-foreground hover:bg-muted-foreground/10'}"
                            on:click={() => saveLayoutMode("compact")}
                            title="Compact view"
                        >
                            <svg
                                class="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    d="M3 6h18v2H3V6zm0 5h12v2H3v-2zm0 5h8v2H3v-2z"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </fieldset>

        <fieldset class="space-y-3">
            <div class="flex items-center justify-between gap-3 flex-wrap">
                <legend class="text-sm font-semibold text-foreground"
                    >Days</legend
                >
                <span class="text-xs text-muted-foreground">
                    {selectedDaysLabel}
                </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                    class="px-3 py-2 rounded-2xl text-sm font-medium transition-colors {rangeMode ===
                    'this-week'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground hover:bg-muted/80'}"
                    on:click={() => setRangeMode("this-week")}
                >
                    This Week
                </button>
                <button
                    class="px-3 py-2 rounded-2xl text-sm font-medium transition-colors {rangeMode ===
                    'weekend'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground hover:bg-muted/80'}"
                    on:click={() => setRangeMode("weekend")}
                >
                    Weekend
                </button>
                <button
                    class="px-3 py-2 rounded-2xl text-sm font-medium transition-colors {rangeMode ===
                    'custom'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground hover:bg-muted/80'}"
                    on:click={() => setRangeMode("custom")}
                >
                    Custom
                </button>
            </div>

            {#if rangeMode === "custom"}
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label class="space-y-1.5">
                        <span class="text-xs font-medium text-muted-foreground"
                            >From</span
                        >
                        <select
                            class="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                            value={rangeStartIndex}
                            on:change={handleDayRangeStartChange}
                        >
                            {#each exportWindowDays as day}
                                <option value={day.globalIndex}>
                                    {getWindowDayLabel(day)}
                                </option>
                            {/each}
                        </select>
                    </label>

                    <label class="space-y-1.5">
                        <span class="text-xs font-medium text-muted-foreground"
                            >To</span
                        >
                        <select
                            class="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                            value={rangeEndIndex}
                            on:change={handleDayRangeEndChange}
                        >
                            {#each exportWindowDays as day}
                                <option value={day.globalIndex}>
                                    {getWindowDayLabel(day)}
                                </option>
                            {/each}
                        </select>
                    </label>
                </div>

                <p class="text-xs text-muted-foreground leading-relaxed">
                    Custom can span across
                    <span class="font-medium text-foreground">previous</span>,
                    <span class="font-medium text-foreground">current</span>,
                    and
                    <span class="font-medium text-foreground">upcoming</span>
                    week. Example:
                    <span class="font-medium text-foreground"
                        >last Sunday → next Tuesday</span
                    >.
                </p>
            {/if}
        </fieldset>

        <!-- Preview -->
        {#if showPreview}
            <div
                class="bg-background/30 rounded-lg border border-border/70 overflow-auto max-h-[55vh]"
            >
                <div
                    class={layoutMode === "list" || layoutMode === "compact"
                        ? "flex justify-center min-w-full"
                        : ""}
                >
                    <div
                        id="export-preview"
                        style="width: {previewWidth}; min-width: {previewWidth}; max-width: {previewWidth}; position: relative; {$exportSettings.backgroundMode ===
                        'color'
                            ? `background-color: ${$exportSettings.backgroundColor};`
                            : ''} font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor};"
                    >
                        <!-- Background Image: Using <img> element instead of CSS background-image
                             for better iOS/Safari compatibility with snapdom. While snapdom can handle
                             CSS backgrounds, using an actual DOM element is more reliable across all browsers. -->
                        {#if $exportSettings.backgroundMode === "image" && safeBackgroundImageUrl}
                            <img
                                src={safeBackgroundImageUrl}
                                alt="Background"
                                style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center; pointer-events: none; z-index: 0;"
                            />
                        {/if}

                        {#if $exportSettings.backgroundMode === "color"}
                            <div
                                style="position: absolute; inset: 0; background-color: {$exportSettings.backgroundColor}; opacity: {$exportSettings.backgroundOpacity /
                                    100}; pointer-events: none; z-index: 1;"
                            ></div>
                        {/if}

                        <div style="position: relative; z-index: 10;">
                            <div class="space-y-2 pt-7 text-center">
                                {#if $exportSettings.syncWeekNumberWithTitle}
                                    <h2
                                        class="mb-0 font-medium"
                                        style="font-family: {$exportSettings.headerFontFamily}; color: {$exportSettings.titleColor}; font-size: {$exportSettings.titleFontSize}px; opacity: {$exportSettings.titleOpacity /
                                            100}; text-shadow: {titleTextShadow};"
                                    >
                                        {syncedTitle}
                                    </h2>
                                {:else if $exportSettings.showWeekNumber && $exportSettings.weekNumberLayout === "inline"}
                                    <div
                                        class="flex items-baseline justify-center gap-3 flex-wrap"
                                    >
                                        <h2
                                            class="mb-0 font-medium"
                                            style="font-family: {$exportSettings.headerFontFamily}; color: {$exportSettings.titleColor}; font-size: {$exportSettings.titleFontSize}px; opacity: {$exportSettings.titleOpacity /
                                                100}; text-shadow: {titleTextShadow};"
                                        >
                                            {$exportSettings.title}
                                        </h2>
                                        <p
                                            class="font-semibold"
                                            style="font-family: {weekNumberFontFamily}; color: {weekNumberColor}; font-size: {weekNumberFontSize}px; opacity: {weekNumberOpacity}; text-shadow: {weekNumberTextShadow};"
                                        >
                                            KW{$currentWeek}
                                        </p>
                                    </div>
                                {:else}
                                    <h2
                                        class="mb-0 font-medium"
                                        style="font-family: {$exportSettings.headerFontFamily}; color: {$exportSettings.titleColor}; font-size: {$exportSettings.titleFontSize}px; opacity: {$exportSettings.titleOpacity /
                                            100}; text-shadow: {titleTextShadow};"
                                    >
                                        {$exportSettings.title}
                                    </h2>
                                    {#if $exportSettings.showWeekNumber}
                                        <p
                                            class="font-semibold"
                                            style="font-family: {weekNumberFontFamily}; color: {weekNumberColor}; font-size: {weekNumberFontSize}px; opacity: {weekNumberOpacity}; text-shadow: {weekNumberTextShadow};"
                                        >
                                            KW{$currentWeek}
                                        </p>
                                    {/if}
                                {/if}
                            </div>

                            {#if layoutMode === "grid"}
                                <div class="p-4 pt-0 space-y-3">
                                    <div>
                                        <div
                                            class="grid gap-3"
                                            style="grid-template-columns: repeat({gridColumnCount}, minmax(0, 1fr)); width: {shouldCenterGridDays
                                                ? centeredGridWidth
                                                : '100%'};"
                                        >
                                            {#each visibleDays as dayEntry}
                                                <div
                                                    class="p-2"
                                                    style="background-color: {getWeekContainerBackgroundStyle()}; border-radius: {$exportSettings.borderRadius}px;"
                                                >
                                                    <div
                                                        class="mb-2 pb-2"
                                                        style="border-bottom: 1px solid {$exportSettings.accentColor}30;"
                                                    >
                                                        <div
                                                            class="font-semibold text-xs"
                                                            style="color: {$exportSettings.textColor};"
                                                        >
                                                            {WEEKDAYS_DE[
                                                                dayEntry
                                                                    .dayIndex
                                                            ]} ·
                                                            <span
                                                                style="opacity: 0.7; font-weight: normal;"
                                                                >{formatDate(
                                                                    dayEntry.date,
                                                                )}</span
                                                            >
                                                        </div>
                                                    </div>
                                                    <div class="space-y-2">
                                                        {#if dayEntry.activities.length === 0}
                                                            <div
                                                                class="text-xs text-center"
                                                                style="font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor}; opacity: 0.5;"
                                                            >
                                                                No activities
                                                            </div>
                                                        {:else}
                                                            {#each dayEntry.activities as activity}
                                                                <div
                                                                    class="px-1.5 text-xs"
                                                                    style="border-left: 3px solid {activity.color ||
                                                                        $exportSettings.accentColor};"
                                                                >
                                                                    <div
                                                                        class="font-semibold truncate"
                                                                        style="color: {$exportSettings.textColor};"
                                                                    >
                                                                        {activity.summary}
                                                                    </div>
                                                                    {#if isAllDayEvent(activity)}
                                                                        <div
                                                                            class="text-xs"
                                                                            style="font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor}; opacity: 0.7;"
                                                                        >
                                                                            All-Day
                                                                        </div>
                                                                    {:else}
                                                                        <div
                                                                            class="text-xs"
                                                                            style="font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor}; opacity: 0.7;"
                                                                        >
                                                                            {activity.startTime}
                                                                            - {activity.endTime}
                                                                        </div>
                                                                    {/if}
                                                                </div>
                                                            {/each}
                                                        {/if}
                                                    </div>
                                                </div>
                                            {/each}

                                            {#if $bibleVerse.enabled && !shouldCenterGridDays}
                                                <div
                                                    class="p-2 text-center flex flex-col justify-center items-center h-full"
                                                    style="border-radius: {$exportSettings.borderRadius}px;"
                                                >
                                                    <p
                                                        class="text-sm italic mb-1"
                                                        style="color: {$exportSettings.textColor};"
                                                    >
                                                        "{$bibleVerse
                                                            .currentVerse.text}"
                                                    </p>
                                                    <p
                                                        class="text-xs"
                                                        style="color: {$exportSettings.textColor}; opacity: 0.7;"
                                                    >
                                                        – {$bibleVerse
                                                            .currentVerse
                                                            .reference}
                                                    </p>
                                                </div>
                                            {/if}
                                        </div>
                                    </div>

                                    {#if $bibleVerse.enabled && shouldCenterGridDays}
                                        <div>
                                            <div
                                                class="p-2 text-center flex flex-col justify-center items-center"
                                                style="border-radius: {$exportSettings.borderRadius}px; width: {centeredGridWidth};"
                                            >
                                                <p
                                                    class="text-sm italic mb-1"
                                                    style="color: {$exportSettings.textColor};"
                                                >
                                                    "{$bibleVerse.currentVerse
                                                        .text}"
                                                </p>
                                                <p
                                                    class="text-xs"
                                                    style="color: {$exportSettings.textColor}; opacity: 0.7;"
                                                >
                                                    – {$bibleVerse.currentVerse
                                                        .reference}
                                                </p>
                                            </div>
                                        </div>
                                    {/if}
                                </div>
                            {:else if layoutMode === "list"}
                                <div class="space-y-1 p-4 pt-0">
                                    {#each visibleDays as dayEntry, visibleIndex}
                                        <div
                                            class="p-3"
                                            style="background-color: {getWeekContainerBackgroundStyle()}; border-radius: {visibleDays.length ===
                                            1
                                                ? '16px'
                                                : visibleIndex === 0
                                                  ? '16px 16px 4px 4px'
                                                  : visibleIndex ===
                                                      visibleDays.length - 1
                                                    ? '4px 4px 16px 16px'
                                                    : '4px'};"
                                        >
                                            <div
                                                class="mb-2 pb-2"
                                                style="border-bottom: 1px solid {$exportSettings.accentColor}30;"
                                            >
                                                <div
                                                    class="font-semibold text-sm"
                                                    style="color: {$exportSettings.textColor};"
                                                >
                                                    {WEEKDAYS_DE[
                                                        dayEntry.dayIndex
                                                    ]} ·
                                                    {formatDate(dayEntry.date)}
                                                </div>
                                            </div>
                                            <div class="space-y-2">
                                                {#if dayEntry.activities.length === 0}
                                                    <div
                                                        class="text-sm text-center"
                                                        style="color: {$exportSettings.textColor}; opacity: 0.5;"
                                                    >
                                                        No activities
                                                    </div>
                                                {:else}
                                                    {#each dayEntry.activities as activity}
                                                        <div
                                                            class="px-2 text-sm"
                                                            style="border-left: 3px solid {activity.color ||
                                                                $exportSettings.accentColor};"
                                                        >
                                                            <div
                                                                class="font-semibold"
                                                                style="color: {$exportSettings.textColor};"
                                                            >
                                                                {activity.summary}
                                                            </div>
                                                            {#if isAllDayEvent(activity)}
                                                                <div
                                                                    class="text-xs"
                                                                    style="color: {$exportSettings.textColor}; opacity: 0.7;"
                                                                >
                                                                    All-Day
                                                                </div>
                                                            {:else}
                                                                <div
                                                                    class="text-xs"
                                                                    style="color: {$exportSettings.textColor}; opacity: 0.7;"
                                                                >
                                                                    {activity.startTime}
                                                                    - {activity.endTime}
                                                                </div>
                                                            {/if}
                                                        </div>
                                                    {/each}
                                                {/if}
                                            </div>
                                        </div>
                                    {/each}

                                    {#if $bibleVerse.enabled}
                                        <div
                                            class="p-3 text-center"
                                            style="margin-top: 0.5rem;"
                                        >
                                            <p
                                                class="text-sm italic mb-2"
                                                style="color: {$exportSettings.textColor};"
                                            >
                                                "{$bibleVerse.currentVerse
                                                    .text}"
                                            </p>
                                            <p
                                                class="text-xs"
                                                style="color: {$exportSettings.textColor}; opacity: 0.7;"
                                            >
                                                – {$bibleVerse.currentVerse
                                                    .reference}
                                            </p>
                                        </div>
                                    {/if}
                                </div>
                            {:else}
                                <!-- Compact view (revised) -->
                                <div class="space-y-1.5 p-4 pt-0 pr-0">
                                    {#each visibleDays as dayEntry}
                                        <div class="p-0">
                                            <div class="flex gap-0.5">
                                                <div
                                                    class=" py-3 pr-0 pl-2 min-w-20"
                                                    style="background-color: {getWeekContainerBackgroundStyle()};border-radius: {$exportSettings.borderRadius}px 2px 2px {$exportSettings.borderRadius}px;"
                                                >
                                                    <div
                                                        class="flex flex-col h-full pr-2 text-right gap-1"
                                                        style="line-height:1; "
                                                    >
                                                        <div
                                                            style="font-size:14px; font-weight:600; color: {$exportSettings.textColor};"
                                                        >
                                                            {formatDate(
                                                                dayEntry.date,
                                                            )}
                                                        </div>
                                                        <div
                                                            style="font-size:11px; font-weight:500; opacity:0.7; color: {$exportSettings.textColor}; text-align:right;"
                                                        >
                                                            {WEEKDAYS_DE[
                                                                dayEntry
                                                                    .dayIndex
                                                            ]}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div
                                                    class="flex-1"
                                                    style="background-color: {getWeekContainerBackgroundStyle()};border-radius: 2px 0 0 2px;"
                                                >
                                                    {#if dayEntry.activities.length === 0}
                                                        <div
                                                            class="italic opacity-40 flex justify-center items-center h-full p-1"
                                                            style="font-size:11px; color: {$exportSettings.textColor};"
                                                        >
                                                            Keine Aktivitäten
                                                        </div>
                                                    {:else}
                                                        <div
                                                            class="space-y-1 p-1"
                                                        >
                                                            {#each dayEntry.activities as activity}
                                                                <div
                                                                    class="grid"
                                                                    style="grid-template-columns: 80px 1fr; font-size:11px; line-height:1.2; color: {$exportSettings.textColor}; font-family: {$exportSettings.bodyFontFamily};"
                                                                >
                                                                    <div
                                                                        class="pr-1 opacity-60"
                                                                        style="text-align:right;"
                                                                    >
                                                                        {#if isAllDayEvent(activity)}
                                                                            All-Day
                                                                        {:else}
                                                                            {activity.startTime}-{activity.endTime}
                                                                        {/if}
                                                                    </div>
                                                                    <div
                                                                        class="pl-1"
                                                                        style="border-left:2px solid {activity.color ||
                                                                            $exportSettings.accentColor}; font-weight:500; overflow-wrap:anywhere; word-break:break-word;"
                                                                    >
                                                                        {activity.summary}
                                                                    </div>
                                                                </div>
                                                            {/each}
                                                        </div>
                                                    {/if}
                                                </div>
                                            </div>
                                        </div>
                                    {/each}

                                    {#if $bibleVerse.enabled}
                                        <div class="p-2 pt-4">
                                            <div
                                                class="text-center italic"
                                                style="font-size:11px; opacity:1;"
                                            >
                                                "{$bibleVerse.currentVerse
                                                    .text}"
                                            </div>
                                            <div
                                                class=" text-center"
                                                style="font-size:10px; opacity:0.7;"
                                            >
                                                {$bibleVerse.currentVerse
                                                    .reference}
                                            </div>
                                        </div>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Export Options -->
        <fieldset class="space-y-4">
            {#if isDesktop}
                <div class="grid grid-cols-2 gap-3">
                    <Button
                        variant="default"
                        disabled={isExporting}
                        on:click={exportAsImage}
                    >
                        {#if isExporting}
                            <svg
                                class="w-4 h-4 animate-spin mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            Exporting...
                        {:else}
                            <svg
                                class="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M12 16v-4m0 0V8m0 4H8m4 0h4m6 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            Download PNG
                        {/if}
                    </Button>

                    <Button
                        variant="secondary"
                        disabled={isExporting}
                        on:click={copyToClipboard}
                    >
                        {#if isExporting}
                            <svg
                                class="w-4 h-4 animate-spin mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            Copying...
                        {:else}
                            <svg
                                class="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                            </svg>
                            Copy Image
                        {/if}
                    </Button>
                </div>
            {:else}
                <Button
                    variant="default"
                    disabled={isExporting || !isBackgroundReady}
                    on:click={performShare}
                    class="w-full"
                >
                    {#if !isBackgroundReady}
                        <span class="sr-only">Background loading</span>
                    {/if}
                    {#if isExporting}
                        <svg
                            class="w-4 h-4 animate-spin mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                        Sharing...
                    {:else}
                        <svg
                            class="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                            />
                        </svg>
                        Share
                    {/if}
                </Button>
            {/if}
        </fieldset>
    </div>
</SwipeableSheet>
