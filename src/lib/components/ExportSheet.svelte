<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import { activities } from "../stores/activities";
    import { currentWeek, currentYear } from "../stores/week";
    import { exportSettings } from "../stores/exportSettings";
    import { bibleVerse } from "../stores/bibleVerse";
    import { getDaysOfWeek } from "../utils/date";
    import { WEEKDAYS_DE } from "../types/index";
    import IconButton from "./IconButton.svelte";
    import Button from "./Button.svelte";
    import SwipeableSheet from "./SwipeableSheet.svelte";

    export let isDesktop = false;

    const dispatch = createEventDispatcher();

    let isExporting = false;
    let exportError = "";
    let layoutMode: "grid" | "list" | "compact" = "grid";
    let showPreview = true;

    // Load preferences from localStorage on mount
    function loadPreferences() {
        if (typeof window !== "undefined") {
            const savedLayoutMode = localStorage.getItem("exportLayoutMode");
            const savedShowPreview = localStorage.getItem("exportShowPreview");

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
        }
    }

    // Save preferences to localStorage
    function saveLayoutMode(mode: "grid" | "list" | "compact") {
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

    // Initialize on component mount
    onMount(() => {
        loadPreferences();
        console.log(
            "ExportSheet mounted. Background image:",
            $exportSettings.backgroundImage
                ? `${$exportSettings.backgroundImage.substring(0, 50)}...`
                : "none",
        );
        console.log(
            "Background image URL:",
            $exportSettings.backgroundImageUrl,
        );
        console.log(
            "Background image type:",
            $exportSettings.backgroundImageType,
        );
    });

    // Reactive debugging - log when background image changes
    $: {
        console.log(
            "[ExportSheet] Background image changed:",
            $exportSettings.backgroundImage
                ? `Data URL of length ${$exportSettings.backgroundImage.length}`
                : "null",
        );
        console.log(
            "[ExportSheet] Background URL ID:",
            $exportSettings.backgroundImageUrl,
        );
        console.log(
            "[ExportSheet] Background type:",
            $exportSettings.backgroundImageType,
        );
        console.log(
            "[ExportSheet] Background MODE:",
            $exportSettings.backgroundMode,
        );
        console.log(
            "[ExportSheet] Will use:",
            $exportSettings.backgroundMode === "image" &&
                $exportSettings.backgroundImage
                ? "BACKGROUND IMAGE"
                : "SOLID COLOR",
        );
    }
    $: isBackgroundReady =
        $exportSettings.backgroundMode === "image"
            ? !!$exportSettings.backgroundImage
            : true;

    function handleClose() {
        dispatch("close");
    }

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

    async function generateImageBlob(): Promise<Blob | null> {
        try {
            console.log("[GenerateBlob] Starting image generation...");
            console.log("[GenerateBlob] Background settings:", {
                mode: $exportSettings.backgroundMode,
                hasImage: !!$exportSettings.backgroundImage,
                imageLength: $exportSettings.backgroundImage?.length,
                imageUrl: $exportSettings.backgroundImageUrl,
                imageType: $exportSettings.backgroundImageType,
            });

            const element = document.getElementById("export-preview");
            if (!element) throw new Error("Export preview element not found");

            const { toBlob } = await import("html-to-image");

            // Detect iOS Safari for scale adjustment
            const ua = navigator.userAgent;
            const isIOSSafari =
                /iPad|iPhone|iPod/.test(ua) &&
                /Safari/.test(ua) &&
                !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);

            // Wait for all fonts to be ready (fonts are loaded via CSS in main.ts)
            await document.fonts.ready;

            // Extra frame to ensure layout is complete
            await new Promise((r) => requestAnimationFrame(() => r(null)));

            // If using image background (now via CSS background-image), 
            // give extra time for the browser to process the data URL
            if ($exportSettings.backgroundMode === "image" && $exportSettings.backgroundImage) {
                console.log(
                    "[GenerateBlob] Mode is IMAGE, using CSS background-image",
                );
                console.log(
                    "[GenerateBlob] Background image data URL length:",
                    $exportSettings.backgroundImage.length,
                );
                
                // Wait additional frames to ensure CSS background-image is processed
                // This is similar to how fonts are handled - they're in CSS and need time to render
                await new Promise((r) => requestAnimationFrame(() => r(null)));
                await new Promise((r) => requestAnimationFrame(() => r(null)));
                
                console.log(
                    "[GenerateBlob] Background image ready for export",
                );
            } else {
                console.log(
                    "[GenerateBlob] Mode is COLOR, no background image",
                );
            }

            // Use lower scale on iOS to avoid memory issues
            const scale = isIOSSafari ? 3 : 4;

            console.log("[ExportSheet][Export] Starting export", {
                width: element.getBoundingClientRect().width,
                height: element.getBoundingClientRect().height,
                scale,
                userAgent: ua,
                backgroundMode: $exportSettings.backgroundMode,
                hasImage: !!$exportSettings.backgroundImage,
            });

            // Generate the image blob
            let blob = await toBlob(element, {
                pixelRatio: scale,
                backgroundColor:
                    $exportSettings.backgroundMode === "color"
                        ? $exportSettings.backgroundColor
                        : "#ffffff",
                filter: (node) =>
                    !(node as Element).classList?.contains("no-export"),
                cacheBust: true, // Important for iOS Safari to render data URL images correctly
            });

            // iOS memory fallback - try lower scale if first attempt fails
            if (!blob && isIOSSafari) {
                console.warn("[ExportSheet][Export] iOS fallback to scale=2");
                blob = await toBlob(element, {
                    pixelRatio: 2,
                    backgroundColor:
                        $exportSettings.backgroundMode === "color"
                            ? $exportSettings.backgroundColor
                            : "#ffffff",
                    filter: (node) =>
                        !(node as Element).classList?.contains("no-export"),
                    cacheBust: true, // Important for iOS Safari to render data URL images correctly
                });
            }

            if (!blob) throw new Error("Failed to generate image");

            console.log("[ExportSheet][Export] Success", {
                size: `${(blob.size / 1024).toFixed(0)}KB`,
                scale,
            });

            return blob;
        } catch (e) {
            exportError = e instanceof Error ? e.message : "Export failed";
            console.error("[ExportSheet][Export] Error:", e);
            return null;
        }
    }

    async function exportAsImage() {
        isExporting = true;
        exportError = "";

        try {
            // Force refresh background image from IndexedDB before export
            console.log(
                "[ExportAsImage] Refreshing background image from IndexedDB...",
            );
            await exportSettings.refreshImage();

            // Wait a bit for the store to update
            await new Promise((r) => setTimeout(r, 1000));

            console.log("[ExportAsImage] Current settings:", {
                mode: $exportSettings.backgroundMode,
                hasImage: !!$exportSettings.backgroundImage,
                imageLength: $exportSettings.backgroundImage?.length,
                imageUrl: $exportSettings.backgroundImageUrl,
                imageType: $exportSettings.backgroundImageType,
            });

            const blob = await generateImageBlob();
            if (blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `Wochenschau_W${$currentWeek}_${$currentYear}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                setTimeout(() => {
                    dispatch("close");
                }, 500);
            }
        } catch (error) {
            exportError =
                error instanceof Error ? error.message : "Export failed";
            console.error("Export error:", error);
        } finally {
            isExporting = false;
        }
    }

    async function copyToClipboard() {
        isExporting = true;
        exportError = "";

        try {
            const blob = await generateImageBlob();
            if (!blob) {
                throw new Error("Failed to generate image");
            }

            try {
                await navigator.clipboard.write([
                    new ClipboardItem({ "image/png": blob }),
                ]);

                setTimeout(() => {
                    dispatch("close");
                }, 500);
            } catch (clipboardError) {
                exportError = "Failed to copy to clipboard";
                console.error("Clipboard error:", clipboardError);
            }
        } catch (error) {
            exportError =
                error instanceof Error ? error.message : "Export failed";
            console.error("Export error:", error);
        } finally {
            isExporting = false;
        }
    }

    // Two-phase sharing: prepare image fully, then invoke native share
    let preparedFile: File | null = null;
    let isPreparingShare = false;

    async function prepareShare() {
        if (isPreparingShare) return;
        isPreparingShare = true;
        exportError = "";
        preparedFile = null;
        try {
            // Force refresh background image from IndexedDB before export
            console.log(
                "[PrepareShare] Refreshing background image from IndexedDB...",
            );
            await exportSettings.refreshImage();

            // Wait a bit for the store to update
            await new Promise((r) => setTimeout(r, 1000));

            console.log("[PrepareShare] Current settings:", {
                mode: $exportSettings.backgroundMode,
                hasImage: !!$exportSettings.backgroundImage,
                imageLength: $exportSettings.backgroundImage?.length,
                imageUrl: $exportSettings.backgroundImageUrl,
                imageType: $exportSettings.backgroundImageType,
            });

            const blob = await generateImageBlob();
            if (!blob) throw new Error("Failed to generate image");
            preparedFile = new File(
                [blob],
                `Wochenschau_W${$currentWeek}_${$currentYear}.png`,
                { type: "image/png" },
            );
        } catch (error) {
            exportError =
                error instanceof Error ? error.message : "Prepare failed";
            preparedFile = null;
            console.error("Prepare share error:", error);
        } finally {
            isPreparingShare = false;
        }
    }

    async function performShare() {
        // Ensure we have a prepared file (in case user bypassed phase)
        if (!preparedFile) {
            await prepareShare();
            if (!preparedFile) return;
        }
        isExporting = true;
        exportError = "";
        try {
            if (!navigator.share) {
                throw new Error("Web Share API not supported on this device");
            }
            await navigator.share({
                title: `Wochenschau Week ${$currentWeek}`,
                text: `My weekly agenda for week ${$currentWeek} ${$currentYear}`,
                files: [preparedFile],
            });
            setTimeout(() => {
                dispatch("close");
            }, 500);
        } catch (shareError: any) {
            if (shareError.name !== "AbortError") {
                exportError =
                    shareError instanceof Error
                        ? shareError.message
                        : "Failed to share";
                console.error("Share error:", shareError);
            }
        } finally {
            isExporting = false;
        }
    }

    $: days = getDaysOfWeek($currentWeek, $currentYear);
    $: weekActivities = $activities.filter(
        (a) => a.week === $currentWeek && a.year === $currentYear,
    );

    function getDayActivities(dayIndex: number) {
        return weekActivities.filter((a) => a.day === dayIndex);
    }

    function formatDate(date: Date): string {
        return date.toLocaleDateString("de-DE", {
            month: "short",
            day: "numeric",
        });
    }

    function isAllDayEvent(activity: any): boolean {
        if (activity.isAllDay) return true;
        if (activity.startTime === activity.endTime) return true;
        if (activity.startTime === "00:00" && activity.endTime === "23:59")
            return true;
        return false;
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
            Export Week
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
                        style="width: {layoutMode === 'grid'
                            ? '900px'
                            : layoutMode === 'list'
                              ? '400px'
                              : '360px'}; min-width: {layoutMode === 'grid'
                            ? '900px'
                            : layoutMode === 'list'
                              ? '400px'
                              : '360px'}; max-width: {layoutMode === 'grid'
                            ? '900px'
                            : layoutMode === 'list'
                              ? '400px'
                              : '360px'};  position: relative; {$exportSettings.backgroundMode ===
                        'image' && $exportSettings.backgroundImage
                            ? `background-image: url(${$exportSettings.backgroundImage}); background-size: cover; background-position: center; background-repeat: no-repeat;`
                            : $exportSettings.backgroundMode === 'color'
                              ? `background-color: ${$exportSettings.backgroundColor};`
                              : ''} font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor};"
                    >
                        {#if $exportSettings.backgroundMode === "color"}
                            <div
                                style="position: absolute; inset: 0; background-color: {$exportSettings.backgroundColor}; opacity: {$exportSettings.backgroundOpacity /
                                    100}; pointer-events: none; z-index: 1;"
                            ></div>
                        {/if}

                        <div style="position: relative; z-index: 10;">
                            <div class="space-y-4 pt-7 text-center">
                                <h2
                                    class="mb-2 font-medium"
                                    style="font-family: {$exportSettings.headerFontFamily}; color: {$exportSettings.textColor}; font-size: {$exportSettings.titleFontSize}px;"
                                >
                                    {$exportSettings.title}
                                </h2>
                                {#if $exportSettings.showWeekNumber}
                                    <p
                                        class="text-lg font-semibold"
                                        style="color: {$exportSettings.textColor}; opacity: 0.8;"
                                    >
                                        KW{$currentWeek}
                                    </p>
                                {/if}
                            </div>

                            {#if layoutMode === "grid"}
                                <div class="grid grid-cols-4 gap-3 p-4 pt-0">
                                    {#each days as day, dayIndex}
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
                                                    {WEEKDAYS_DE[dayIndex]} ·
                                                    <span
                                                        style="opacity: 0.7; font-weight: normal;"
                                                        >{formatDate(day)}</span
                                                    >
                                                </div>
                                            </div>
                                            <div class="space-y-2">
                                                {#if getDayActivities(dayIndex).length === 0}
                                                    <div
                                                        class="text-xs text-center"
                                                        style="font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor}; opacity: 0.5;"
                                                    >
                                                        No activities
                                                    </div>
                                                {:else}
                                                    {#each getDayActivities(dayIndex) as activity}
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
                                    {#if $bibleVerse.enabled}
                                        <div
                                            class="p-2 text-center flex flex-col justify-center items-center h-full"
                                            style="border-radius: {$exportSettings.borderRadius}px;"
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
                                    {/if}
                                </div>
                            {:else if layoutMode === "list"}
                                <div class="space-y-1 p-4 pt-0">
                                    {#each days as day, dayIndex}
                                        <div
                                            class="p-3"
                                            style="background-color: {getWeekContainerBackgroundStyle()}; border-radius: {dayIndex ===
                                            0
                                                ? '16px 16px 4px 4px'
                                                : dayIndex === 6
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
                                                    {WEEKDAYS_DE[dayIndex]} ·
                                                    {formatDate(day)}
                                                </div>
                                            </div>
                                            <div class="space-y-2">
                                                {#if getDayActivities(dayIndex).length === 0}
                                                    <div
                                                        class="text-sm text-center"
                                                        style="color: {$exportSettings.textColor}; opacity: 0.5;"
                                                    >
                                                        No activities
                                                    </div>
                                                {:else}
                                                    {#each getDayActivities(dayIndex) as activity}
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
                                    {#each days as day, dayIndex}
                                        <div class="p-0">
                                            <div class="flex gap-0.5">
                                                <div
                                                    class=" py-3 pr-0 pl-2 min-w-20"
                                                    style="background-color: {getWeekContainerBackgroundStyle()};border-radius: {$exportSettings.borderRadius}px 0 0 {$exportSettings.borderRadius}px;"
                                                >
                                                    <div
                                                        class="flex flex-col h-full pr-2 text-right gap-1"
                                                        style="line-height:1; "
                                                    >
                                                        <div
                                                            style="font-size:14px; font-weight:600; color: {$exportSettings.textColor};"
                                                        >
                                                            {formatDate(day)}
                                                        </div>
                                                        <div
                                                            style="font-size:11px; font-weight:500; opacity:0.7; color: {$exportSettings.textColor}; text-align:right;"
                                                        >
                                                            {WEEKDAYS_DE[
                                                                dayIndex
                                                            ]}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div
                                                    class="flex-1"
                                                    style="background-color: {getWeekContainerBackgroundStyle()};border-radius: 0;"
                                                >
                                                    {#if getDayActivities(dayIndex).length === 0}
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
                                                            {#each getDayActivities(dayIndex) as activity}
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
            {:else if preparedFile}
                <div class="grid grid-cols-2 gap-3">
                    <Button
                        variant="default"
                        disabled={isExporting || !isBackgroundReady}
                        on:click={performShare}
                        class="w-full"
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
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                            </svg>
                            Share
                        {/if}
                    </Button>
                    <Button
                        variant="secondary"
                        disabled={isExporting ||
                            isPreparingShare ||
                            !isBackgroundReady}
                        on:click={exportAsImage}
                        class="w-full"
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
                </div>
            {:else}
                <div class="grid grid-cols-2 gap-3">
                    <Button
                        variant="default"
                        disabled={isPreparingShare || !isBackgroundReady}
                        on:click={prepareShare}
                        class="w-full"
                    >
                        {#if !isBackgroundReady}
                            <span class="sr-only">Background loading</span>
                        {/if}
                        {#if isPreparingShare}
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
                            Preparing...
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
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                            </svg>
                            Prepare Share
                        {/if}
                    </Button>
                    <Button
                        variant="secondary"
                        disabled={isExporting ||
                            isPreparingShare ||
                            !isBackgroundReady}
                        on:click={exportAsImage}
                        class="w-full"
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
                </div>
            {/if}
        </fieldset>
    </div>
</SwipeableSheet>
