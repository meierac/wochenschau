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

    export let isDesktop = false;

    const dispatch = createEventDispatcher();

    let isExporting = false;
    let exportError = "";
    let layoutMode: "grid" | "list" = "grid";
    let showPreview = true;

    // Load preferences from localStorage on mount
    function loadPreferences() {
        if (typeof window !== "undefined") {
            const savedLayoutMode = localStorage.getItem("exportLayoutMode");
            const savedShowPreview = localStorage.getItem("exportShowPreview");

            if (savedLayoutMode === "list" || savedLayoutMode === "grid") {
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
    function saveLayoutMode(mode: "grid" | "list") {
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
    });

    function handleClose() {
        dispatch("close");
    }

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            dispatch("close");
        }
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

    async function generateJPGBlob(): Promise<Blob | null> {
        try {
            const { domToJpeg } = await import("modern-screenshot");

            const element = document.getElementById("export-preview");
            if (!element) {
                throw new Error("Export preview element not found");
            }

            const dataUrl = await domToJpeg(element, {
                scale: 2,
                quality: 0.95,
            });

            // Convert data URL to blob
            const response = await fetch(dataUrl);
            const blob = await response.blob();

            return blob;
        } catch (error) {
            exportError =
                error instanceof Error ? error.message : "Export failed";
            console.error("Export error:", error);
            return null;
        }
    }

    async function exportAsJPG() {
        isExporting = true;
        exportError = "";

        try {
            const blob = await generateJPGBlob();
            if (blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `Wochenschau_W${$currentWeek}_${$currentYear}.jpg`;
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
            const blob = await generateJPGBlob();
            if (!blob) {
                throw new Error("Failed to generate image");
            }

            try {
                await navigator.clipboard.write([
                    new ClipboardItem({ "image/jpeg": blob }),
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

    async function shareAgenda() {
        isExporting = true;
        exportError = "";

        try {
            const blob = await generateJPGBlob();
            if (!blob) {
                throw new Error("Failed to generate image");
            }

            const file = new File(
                [blob],
                `Wochenschau_W${$currentWeek}_${$currentYear}.jpg`,
                { type: "image/jpeg" },
            );

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: `Wochenschau Week ${$currentWeek}`,
                        text: `My weekly agenda for week ${$currentWeek} ${$currentYear}`,
                        files: [file],
                    });

                    setTimeout(() => {
                        dispatch("close");
                    }, 500);
                } catch (shareError: any) {
                    if (shareError.name !== "AbortError") {
                        exportError = "Failed to share";
                        console.error("Share error:", shareError);
                    }
                }
            } else {
                throw new Error("Web Share API not supported on this device");
            }
        } catch (error) {
            exportError =
                error instanceof Error ? error.message : "Share failed";
            console.error("Export error:", error);
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
</script>

<div
    class="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4"
    on:click={handleBackdropClick}
    role="presentation"
>
    <div
        class={`bg-card rounded-2xl md:rounded-lg shadow-lg w-full transition-all flex flex-col ${
            isDesktop ? "md:max-w-2xl md:max-h-[90vh]" : "max-h-[90vh]"
        }`}
    >
        <!-- Header -->
        <div
            class="border-b border-border px-4 py-4 flex items-center justify-between shrink-0"
        >
            <IconButton
                variant="ghost"
                size="md"
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

            <h3
                class="text-lg font-semibold text-foreground flex-1 text-center"
            >
                Export Agenda
            </h3>

            <div class="w-6"></div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
            {#if exportError}
                <div
                    class="p-4 bg-destructive/10 border border-destructive/30 rounded-lg"
                >
                    <p class="text-sm text-destructive">{exportError}</p>
                </div>
            {/if}

            <!-- Preview Controls -->
            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <label class="text-sm font-semibold text-foreground"
                        >Preview</label
                    >
                    <div class="flex gap-2 items-center">
                        <!-- Preview Visibility Toggle -->
                        <button
                            class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors {showPreview
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'}"
                            on:click={toggleShowPreview}
                            title={showPreview
                                ? "Hide preview"
                                : "Show preview"}
                        >
                            {showPreview ? "Preview On" : "Preview Off"}
                        </button>

                        <!-- Grid/List View Buttons -->
                        <div class="flex gap-1 bg-muted p-1 rounded-md">
                            <button
                                class="px-3 py-1.5 rounded text-sm font-medium transition-colors {layoutMode ===
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
                                class="px-3 py-1.5 rounded text-sm font-medium transition-colors {layoutMode ===
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
                        </div>
                    </div>
                </div>

                <!-- Preview -->
                {#if showPreview}
                    <div
                        class="bg-background rounded-lg border border-border overflow-auto max-h-[55vh]"
                    >
                        <div
                            class={layoutMode === "list"
                                ? "flex justify-center min-w-full"
                                : ""}
                        >
                            <div
                                id="export-preview"
                                class="space-y-4"
                                style="width: {layoutMode === 'grid'
                                    ? '900px'
                                    : '400px'}; min-width: {layoutMode ===
                                'grid'
                                    ? '900px'
                                    : '400px'}; max-width: {layoutMode ===
                                'grid'
                                    ? '900px'
                                    : '400px'}; position: relative; background-color: {$exportSettings.backgroundColor}; background-image: {$exportSettings.backgroundImage
                                    ? `url(${$exportSettings.backgroundImage})`
                                    : 'none'}; background-size: cover; background-position: center; color: {$exportSettings.textColor}; padding: 1.5rem;"
                            >
                                <!-- Background Overlay -->
                                {#if $exportSettings.backgroundImage}
                                    <div
                                        style="position: absolute; inset: 0; background-color: {$exportSettings.backgroundColor}; opacity: {(100 -
                                            $exportSettings.backgroundOpacity) /
                                            100}; pointer-events: none; z-index: 1;"
                                    ></div>
                                {/if}

                                <div class="mb-6 text-center relative z-10">
                                    <h2
                                        class="text-3xl font-bold mb-2"
                                        style="font-family: {$exportSettings.headerFontFamily}; color: {$exportSettings.textColor};"
                                    >
                                        Wochenschau
                                    </h2>
                                    <p
                                        class="text-lg font-semibold"
                                        style="font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor}; opacity: 0.8;"
                                    >
                                        KW{$currentWeek}
                                    </p>
                                </div>

                                {#if layoutMode === "grid"}
                                    <div
                                        class="grid grid-cols-4 gap-3 relative z-10"
                                    >
                                        {#each days as day, dayIndex}
                                            <div
                                                class="p-2"
                                                style="background-color: {getWeekContainerBackgroundStyle()}; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); border-radius: {$exportSettings.borderRadius}px;"
                                            >
                                                <div
                                                    class="mb-2 pb-2"
                                                    style="border-bottom: 1px solid {$exportSettings.accentColor}30;"
                                                >
                                                    <div
                                                        class="font-semibold text-xs"
                                                        style="font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor};"
                                                    >
                                                        {WEEKDAYS_DE[dayIndex]}
                                                    </div>
                                                    <div
                                                        class="text-[10px]"
                                                        style="font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor}; opacity: 0.7;"
                                                    >
                                                        {formatDate(day)}
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
                                                                    style="font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor};"
                                                                >
                                                                    {activity.summary}
                                                                </div>
                                                                <div
                                                                    class="text-xs"
                                                                    style="font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor}; opacity: 0.7;"
                                                                >
                                                                    {activity.startTime}
                                                                    - {activity.endTime}
                                                                </div>
                                                            </div>
                                                        {/each}
                                                    {/if}
                                                </div>
                                            </div>
                                        {/each}

                                        {#if $bibleVerse.enabled}
                                            <div
                                                class="p-2"
                                                style="background-color: {getWeekContainerBackgroundStyle()}; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); border-radius: {$exportSettings.borderRadius}px;"
                                            >
                                                <div
                                                    class="font-semibold text-xs mb-2"
                                                    style="font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor};"
                                                >
                                                    Wort des Tages
                                                </div>
                                                <p
                                                    class="text-[9px] italic mb-1"
                                                    style="font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor};"
                                                >
                                                    "{$bibleVerse.currentVerse
                                                        .text}"
                                                </p>
                                                <p
                                                    class="text-[8px]"
                                                    style="font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor}; opacity: 0.7;"
                                                >
                                                    – {$bibleVerse.currentVerse
                                                        .reference}
                                                </p>
                                            </div>
                                        {/if}
                                    </div>
                                {:else}
                                    <div class="space-y-4 relative z-10">
                                        {#each days as day, dayIndex}
                                            <div
                                                class="p-3"
                                                style="background-color: {getWeekContainerBackgroundStyle()}; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); border-radius: {$exportSettings.borderRadius}px;"
                                            >
                                                <div
                                                    class="mb-2 pb-2"
                                                    style="border-bottom: 1px solid {$exportSettings.accentColor}30;"
                                                >
                                                    <div
                                                        class="font-semibold text-sm"
                                                        style="font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor};"
                                                    >
                                                        {WEEKDAYS_DE[dayIndex]} ·
                                                        {formatDate(day)}
                                                    </div>
                                                </div>
                                                <div class="space-y-2">
                                                    {#if getDayActivities(dayIndex).length === 0}
                                                        <div
                                                            class="text-sm text-center"
                                                            style="font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor}; opacity: 0.5;"
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
                                                                    style="font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor};"
                                                                >
                                                                    {activity.summary}
                                                                </div>
                                                                <div
                                                                    class="text-xs"
                                                                    style="font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor}; opacity: 0.7;"
                                                                >
                                                                    {activity.startTime}
                                                                    - {activity.endTime}
                                                                </div>
                                                            </div>
                                                        {/each}
                                                    {/if}
                                                </div>
                                            </div>
                                        {/each}

                                        {#if $bibleVerse.enabled}
                                            <div
                                                class="p-3"
                                                style="background-color: {getWeekContainerBackgroundStyle()}; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); border-radius: {$exportSettings.borderRadius}px;"
                                            >
                                                <div
                                                    class="mb-2 pb-2"
                                                    style="border-bottom: 1px solid {$exportSettings.accentColor}30;"
                                                >
                                                    <div
                                                        class="font-semibold text-sm"
                                                        style="font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor};"
                                                    >
                                                        Wort des Tages
                                                    </div>
                                                </div>
                                                <div class="space-y-2">
                                                    <p
                                                        class="text-[9px] italic"
                                                        style="font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor};"
                                                    >
                                                        "{$bibleVerse
                                                            .currentVerse.text}"
                                                    </p>
                                                    <p
                                                        class="text-[8px]"
                                                        style="font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor}; opacity: 0.7;"
                                                    >
                                                        – {$bibleVerse
                                                            .currentVerse
                                                            .reference}
                                                    </p>
                                                </div>
                                            </div>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Export Options -->
            <div class="space-y-4">
                <label class="block text-sm font-semibold text-foreground"
                    >Export Options</label
                >

                {#if isDesktop}
                    <div class="grid grid-cols-2 gap-3">
                        <Button
                            variant="default"
                            disabled={isExporting}
                            on:click={exportAsJPG}
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
                                Download JPG
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
                    <!-- Mobile: Native Share -->
                    <Button
                        variant="default"
                        disabled={isExporting}
                        on:click={shareAgenda}
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
                            Share
                        {/if}
                    </Button>
                {/if}
            </div>
        </div>
    </div>
</div>
