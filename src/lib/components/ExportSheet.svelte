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

    async function embedFontsAsBase64(): Promise<HTMLStyleElement | null> {
        try {
            console.log(
                "[ExportSheet] Fetching and embedding fonts as base64...",
            );

            const fontsToEmbed = [
                $exportSettings.headerFontFamily,
                $exportSettings.bodyFontFamily,
            ];

            let fontFaceCSS = "";

            for (const fontFamily of fontsToEmbed) {
                // Extract font name from family string (e.g., "'Playfair Display', serif" -> "Playfair Display")
                const fontMatch = fontFamily.match(/'([^']+)'/);
                if (!fontMatch) continue;

                const fontName = fontMatch[1];
                console.log(`[ExportSheet] Processing font: ${fontName}`);

                // Get all loaded font faces for this font
                const loadedFonts = Array.from(document.fonts).filter(
                    (font) =>
                        font.family === fontName ||
                        font.family === `'${fontName}'`,
                );

                console.log(
                    `[ExportSheet] Found ${loadedFonts.length} font face(s) for ${fontName}`,
                );

                // Fetch the Google Fonts CSS to get font URLs
                const googleFontsLink = document.querySelector(
                    'link[href*="fonts.googleapis.com"]',
                ) as HTMLLinkElement;

                if (!googleFontsLink) {
                    console.warn("[ExportSheet] Google Fonts link not found");
                    continue;
                }

                // Fetch the CSS file
                const cssResponse = await fetch(googleFontsLink.href);
                const cssText = await cssResponse.text();

                // Extract font URLs for this specific font family
                const fontFaceRegex = new RegExp(
                    `@font-face\\s*{[^}]*font-family:\\s*['"]${fontName}['"][^}]*}`,
                    "gi",
                );
                const fontFaces = cssText.match(fontFaceRegex) || [];

                console.log(
                    `[ExportSheet] Found ${fontFaces.length} @font-face rule(s) for ${fontName}`,
                );

                for (const fontFace of fontFaces) {
                    // Extract the font URL
                    const urlMatch = fontFace.match(/url\(([^)]+)\)/);
                    if (!urlMatch) continue;

                    let fontUrl = urlMatch[1].replace(/['"]/g, "");

                    try {
                        console.log(
                            `[ExportSheet] Fetching font file: ${fontUrl.substring(0, 80)}...`,
                        );

                        // Fetch the font file
                        const fontResponse = await fetch(fontUrl);
                        const fontArrayBuffer =
                            await fontResponse.arrayBuffer();

                        // Convert to base64
                        const base64 = btoa(
                            new Uint8Array(fontArrayBuffer).reduce(
                                (data, byte) =>
                                    data + String.fromCharCode(byte),
                                "",
                            ),
                        );

                        // Determine format (woff2, woff, ttf, etc.)
                        let format = "woff2";
                        if (fontUrl.includes(".woff2")) format = "woff2";
                        else if (fontUrl.includes(".woff")) format = "woff";
                        else if (fontUrl.includes(".ttf")) format = "truetype";
                        else if (fontUrl.includes(".otf")) format = "opentype";

                        const dataUrl = `data:font/${format};base64,${base64}`;

                        // Replace the URL in the font-face rule with base64 data URL
                        const embeddedFontFace = fontFace.replace(
                            /url\([^)]+\)/,
                            `url(${dataUrl})`,
                        );

                        fontFaceCSS += embeddedFontFace + "\n";
                        console.log(
                            `[ExportSheet] Embedded font file (${base64.length} chars)`,
                        );
                    } catch (fetchError) {
                        console.warn(
                            `[ExportSheet] Failed to fetch font file:`,
                            fetchError,
                        );
                    }
                }
            }

            if (fontFaceCSS) {
                // Create and inject style element with embedded fonts
                const style = document.createElement("style");
                style.setAttribute("data-font-embed", "true");
                style.textContent = fontFaceCSS;
                document.head.appendChild(style);
                console.log("[ExportSheet] Font embedding complete");
                return style;
            }

            return null;
        } catch (error) {
            console.warn("[ExportSheet] Font embedding failed:", error);
            return null;
        }
    }

    async function generateImageBlob(): Promise<Blob | null> {
        let embeddedFontStyle: HTMLStyleElement | null = null;

        try {
            console.log(
                "[ExportSheet] Generating PNG. Background mode:",
                $exportSettings.backgroundMode,
            );
            console.log(
                "[ExportSheet] Background image exists:",
                !!$exportSettings.backgroundImage,
            );

            const { snapdom } = await import("@zumer/snapdom");

            const element = document.getElementById("export-preview");
            if (!element) {
                throw new Error("Export preview element not found");
            }

            // Wait for fonts to load normally first
            console.log("[ExportSheet] Waiting for fonts to load...");
            try {
                await document.fonts.ready;

                // Explicitly load and verify the fonts being used
                const fontsToLoad = [
                    $exportSettings.headerFontFamily,
                    $exportSettings.bodyFontFamily,
                ];

                for (const fontFamily of fontsToLoad) {
                    // Extract font name from family string
                    const fontMatch = fontFamily.match(/'([^']+)'/);
                    if (fontMatch) {
                        const fontName = fontMatch[1];

                        // Try to load multiple weights
                        const weights = ["300", "400", "500", "600", "700"];
                        for (const weight of weights) {
                            try {
                                await document.fonts.load(
                                    `${weight} 16px "${fontName}"`,
                                );
                            } catch (e) {
                                // Weight might not exist, continue
                            }
                        }

                        console.log(`[ExportSheet] Loaded font: ${fontName}`);
                    }
                }

                console.log("[ExportSheet] All fonts loaded successfully");
            } catch (error) {
                console.warn("[ExportSheet] Font loading failed:", error);
            }

            // Embed fonts as base64 for html-to-image
            embeddedFontStyle = await embedFontsAsBase64();

            // Delay to ensure fonts are fully rendered
            await new Promise((resolve) => setTimeout(resolve, 1000));

            console.log(
                "[ExportSheet] Starting screenshot capture with snapdom...",
            );

            // Capture with snapdom at high quality (4x scale for crisp exports)
            const blob = await snapdom.toBlob(element, {
                type: "png",
                scale: 4, // 4x scale for very high quality (3600px or 1600px output)
                embedFonts: false, // We manually embed fonts as base64
                backgroundColor:
                    $exportSettings.backgroundMode === "color"
                        ? $exportSettings.backgroundColor
                        : null,
                filter: (node) => {
                    const element = node as Element;
                    return !element.classList?.contains("no-export");
                },
            });

            if (!blob) {
                throw new Error("Failed to generate image blob");
            }

            console.log("[ExportSheet] Export successful");
            return blob;
        } catch (error) {
            exportError =
                error instanceof Error ? error.message : "Export failed";
            console.error("Export error:", error);
            return null;
        } finally {
            // Clean up embedded font style
            if (embeddedFontStyle && embeddedFontStyle.parentNode) {
                embeddedFontStyle.parentNode.removeChild(embeddedFontStyle);
                console.log("[ExportSheet] Cleaned up embedded font styles");
            }
        }
    }

    async function exportAsImage() {
        isExporting = true;
        exportError = "";

        try {
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

    async function shareAgenda() {
        isExporting = true;
        exportError = "";

        try {
            const blob = await generateImageBlob();
            if (!blob) {
                throw new Error("Failed to generate image");
            }

            const file = new File(
                [blob],
                `Wochenschau_W${$currentWeek}_${$currentYear}.png`,
                { type: "image/png" },
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

    function isAllDayEvent(activity: any): boolean {
        // Check if explicitly marked as all-day
        if (activity.isAllDay) return true;

        // Check if start time equals end time
        if (activity.startTime === activity.endTime) return true;

        // Check if spans entire day (00:00 to 23:59)
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

        <!-- Centered title -->
        <h3 class="text-lg font-semibold text-foreground flex-1 text-center">
            Export Week
        </h3>

        <!-- Placeholder for right alignment -->
        <div class="w-6"></div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-3 space-y-6 sheet-content">
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
                        class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors {showPreview
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'}"
                        on:click={toggleShowPreview}
                        title={showPreview ? "Hide preview" : "Show preview"}
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
        </fieldset>

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
                        style="width: {layoutMode === 'grid'
                            ? '900px'
                            : '400px'}; min-width: {layoutMode === 'grid'
                            ? '900px'
                            : '400px'}; max-width: {layoutMode === 'grid'
                            ? '900px'
                            : '400px'}; position: relative; {$exportSettings.backgroundMode ===
                        'color'
                            ? `background-color: ${$exportSettings.backgroundColor};`
                            : ''} color: {$exportSettings.textColor};"
                    >
                        <!-- Background Image (use img element for better html-to-image support) -->
                        {#if $exportSettings.backgroundMode === "image" && $exportSettings.backgroundImage}
                            <img
                                src={$exportSettings.backgroundImage}
                                alt=""
                                style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center; pointer-events: none; z-index: 0;"
                            />
                        {/if}

                        <!-- Background Overlay (only for solid color mode) -->
                        {#if $exportSettings.backgroundMode === "color"}
                            <div
                                style="position: absolute; inset: 0; background-color: {$exportSettings.backgroundColor}; opacity: {(100 -
                                    $exportSettings.backgroundOpacity) /
                                    100}; pointer-events: none; z-index: 1;"
                            ></div>
                        {/if}

                        <!-- Content wrapper with padding -->
                        <div
                            class="space-y-4"
                            style="padding: 1.5rem; position: relative; z-index: 10;"
                        >
                            <div class="mb-6 text-center">
                                <h2
                                    class="mb-2 font-medium"
                                    style="font-family: {$exportSettings.headerFontFamily}; color: {$exportSettings.textColor}; font-size: {$exportSettings.titleFontSize}px;"
                                >
                                    {$exportSettings.title}
                                </h2>
                                {#if $exportSettings.showWeekNumber}
                                    <p
                                        class="text-lg font-semibold"
                                        style="font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor}; opacity: 0.8;"
                                    >
                                        KW{$currentWeek}
                                    </p>
                                {/if}
                            </div>

                            {#if layoutMode === "grid"}
                                <div class="grid grid-cols-4 gap-3">
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
                                                                style="font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor};"
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
                                                style="font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor};"
                                            >
                                                "{$bibleVerse.currentVerse
                                                    .text}"
                                            </p>
                                            <p
                                                class="text-xs"
                                                style="font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor}; opacity: 0.7;"
                                            >
                                                – {$bibleVerse.currentVerse
                                                    .reference}
                                            </p>
                                        </div>
                                    {/if}
                                </div>
                            {:else}
                                <div class="space-y-1">
                                    {#each days as day, dayIndex}
                                        <div
                                            class="p-3"
                                            style="background-color: {getWeekContainerBackgroundStyle()}; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); border-radius: {dayIndex ===
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
                                            class="p-3 text-center"
                                            style="margin-top: 0.5rem;"
                                        >
                                            <p
                                                class="text-sm italic mb-2"
                                                style="font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor};"
                                            >
                                                "{$bibleVerse.currentVerse
                                                    .text}"
                                            </p>
                                            <p
                                                class="text-xs"
                                                style="font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor}; opacity: 0.7;"
                                            >
                                                – {$bibleVerse.currentVerse
                                                    .reference}
                                            </p>
                                        </div>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                        <!-- End content wrapper -->
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
        </fieldset>
    </div>
</SwipeableSheet>
