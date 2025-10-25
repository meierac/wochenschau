<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import { activities } from "../stores/activities";
    import { currentWeek, currentYear } from "../stores/week";
    import { exportSettings } from "../stores/exportSettings";
    import { bibleVerse } from "../stores/bibleVerse";
    import { getDaysOfWeek } from "../utils/date";
    import { WEEKDAYS_DE } from "../types";
    import IconButton from "./IconButton.svelte";
    import Button from "./Button.svelte";
    import SwipeableSheet from "./SwipeableSheet.svelte";

    export let isDesktop = false;

    const dispatch = createEventDispatcher();

    let isExporting = false;
    let exportError = "";
    let layoutMode: "grid" | "list" | "compact" = "grid";
    let showPreview = true;

    // Preferences -------------------------------------------------------------
    function loadPreferences() {
        if (typeof window === "undefined") return;
        const savedLayoutMode = localStorage.getItem("exportLayoutMode");
        const savedShowPreview = localStorage.getItem("exportShowPreview");
        if (
            savedLayoutMode === "grid" ||
            savedLayoutMode === "list" ||
            savedLayoutMode === "compact"
        ) {
            layoutMode = savedLayoutMode;
        }
        if (savedShowPreview === "false") showPreview = false;
        if (savedShowPreview === "true") showPreview = true;
    }

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

    // Lifecycle ---------------------------------------------------------------
    onMount(() => {
        loadPreferences();
    });

    function handleClose() {
        dispatch("close");
    }

<<<<<<< HEAD
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

    // Extracted font embedding so it can be reused and not nested (avoids scope issues).
    async function minimalEmbedSelectedFonts(): Promise<(() => void) | null> {
        try {
            const families = [
                $exportSettings.headerFontFamily,
                $exportSettings.bodyFontFamily,
            ].filter(Boolean);
            const unique = [...new Set(families)];
            const names = unique
                .map((f) => {
                    const m = f.match(/'([^']+)'/);
                    return m
                        ? m[1]
                        : f
                              .split(",")[0]
                              .trim()
                              .replace(/^['"]|['"]$/g, "");
                })
                .filter(Boolean);

            if (names.length === 0) return null;

            const FONT_FILES: Record<string, string> = {
                Archivo: "/fonts/Archivo-VariableFont_wdth,wght.ttf",
                "Dancing Script": "/fonts/DancingScript-VariableFont_wght.ttf",
                "Edu QLD Hand": "/fonts/EduQLDHand-VariableFont_wght.ttf",
                "Edu SA Hand": "/fonts/EduSAHand-VariableFont_wght.ttf",
                Handlee: "/fonts/Handlee-Regular.ttf",
                Lora: "/fonts/Lora-VariableFont_wght.ttf",
                Manrope: "/fonts/Manrope-VariableFont_wght.ttf",
                "Ms Madi": "/fonts/MsMadi-Regular.ttf",
                "Noto Sans": "/fonts/NotoSans-VariableFont_wdth,wght.ttf",
                "Pirata One": "/fonts/PirataOne-Regular.ttf",
                "Space Mono": "/fonts/SpaceMono-Regular.ttf",
            };

            let css = "";
            for (const name of names) {
                const path = FONT_FILES[name];
                if (!path) {
                    console.warn("[FontEmbed] Missing mapping for", name);
                    continue;
                }
                try {
                    const res = await fetch(path);
                    if (!res.ok) {
                        console.warn(
                            "[FontEmbed] Fetch failed:",
                            name,
                            res.status,
                        );
                        continue;
                    }
                    const buf = await res.arrayBuffer();
                    const base64 = btoa(
                        String.fromCharCode(...new Uint8Array(buf)),
                    );
                    css += `@font-face {
    font-family: '${name}';
    src: url(data:font/truetype;base64,${base64}) format('truetype');
    font-weight: 100 900;
    font-style: normal;
    font-display: swap;
}\n`;
                } catch (e) {
                    console.warn("[FontEmbed] Error embedding:", name, e);
                }
            }

            if (!css) return null;
            const existing = document.getElementById("embedded-export-fonts");
            if (existing) existing.remove();

            const styleEl = document.createElement("style");
            styleEl.id = "embedded-export-fonts";
            styleEl.textContent = css;
            document.head.appendChild(styleEl);
            return () => styleEl.parentNode?.removeChild(styleEl);
        } catch (e) {
            console.warn("[FontEmbed] Unexpected error:", e);
            return null;
        }
    }

    async function generateImageBlob(): Promise<Blob | null> {
        let manualFontCleanup: (() => void) | null = null;
        try {
            const { snapdom } = await import("@zumer/snapdom");
            const element = document.getElementById("export-preview");
            if (!element) throw new Error("Export preview element not found");

            const ua = navigator.userAgent;
            const isIOSSafari =
                /iPad|iPhone|iPod/.test(ua) &&
                /Safari/.test(ua) &&
                !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);

            // Ensure all fonts declared in stylesheets are loaded first.
            await document.fonts.ready;
            await new Promise((r) => requestAnimationFrame(() => r(null)));

            // First attempt: use snapdom's font embedding (fast path).
            // removed unused rect to avoid unused variable diagnostic
            let scale = isIOSSafari ? 3 : 4;

            console.log("[ExportSheet][Export] First attempt scale:", scale);

            let blob = await snapdom.toBlob(element, {
                type: "png",
                scale,
                embedFonts: true,
                backgroundColor:
                    $exportSettings.backgroundMode === "color"
                        ? $exportSettings.backgroundColor
                        : null,
                filter: (node) => {
                    const el = node as Element;
                    return !el.classList?.contains("no-export");
                },
            });

            // If that failed or produced null, embed manually and retry with embedFonts:false
            if (!blob) {
                console.warn(
                    "[ExportSheet][Export] First attempt failed - embedding fonts manually and retrying.",
                );
                manualFontCleanup = await minimalEmbedSelectedFonts();
                await new Promise((r) => setTimeout(r, 120));
                blob = await snapdom.toBlob(element, {
                    type: "png",
                    scale,
                    embedFonts: false,
                    backgroundColor:
                        $exportSettings.backgroundMode === "color"
                            ? $exportSettings.backgroundColor
                            : null,
                    filter: (node) => {
                        const el = node as Element;
                        return !el.classList?.contains("no-export");
                    },
                });
            }

            // iOS fallback: reduce scale if still failing
            if (!blob && isIOSSafari) {
                console.warn(
                    "[ExportSheet][Export] iOS Safari fallback with reduced scale 2.",
                );
                if (!manualFontCleanup) {
                    manualFontCleanup = await minimalEmbedSelectedFonts();
                    await new Promise((r) => setTimeout(r, 100));
                }
                scale = 2;
                blob = await snapdom.toBlob(element, {
                    type: "png",
                    scale,
                    embedFonts: false,
                    backgroundColor:
                        $exportSettings.backgroundMode === "color"
                            ? $exportSettings.backgroundColor
                            : null,
                    filter: (node) => {
                        const el = node as Element;
                        return !el.classList?.contains("no-export");
                    },
                });
            }

            if (!blob) throw new Error("Failed to generate image");

            console.log(
                "[ExportSheet][Export] Success (final scale:",
                scale,
                ")",
            );
            return blob;
        } catch (e) {
            exportError =
                e instanceof Error ? e.message : "Export failed unexpectedly";
            console.error("[ExportSheet][Export] Error:", e);
            return null;
        } finally {
            try {
                manualFontCleanup?.();
            } catch (e) {
                console.warn("[ExportSheet][Export] Font cleanup error:", e);
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

=======
    // Derived data ------------------------------------------------------------
>>>>>>> ac006417d457e261a0b37700cf4c95498a9fb927
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

    function getWeekContainerBackgroundStyle(): string {
        const color = $exportSettings.weekContainerBackgroundColor;
        const opacity = $exportSettings.weekContainerBackgroundOpacity;
        if (color.includes("rgba")) {
            return color.replace(
                /rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/,
                (_m, r, g, b) => {
                    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
                },
            );
        }
        if (color.startsWith("#")) {
            const hex = color.slice(1);
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
        }
        return `rgba(255, 255, 255, ${opacity / 100})`;
    }

    // Manual font embedding ---------------------------------------------------
    async function minimalEmbedSelectedFonts(): Promise<(() => void) | null> {
        try {
            const families = [
                $exportSettings.headerFontFamily,
                $exportSettings.bodyFontFamily,
            ].filter(Boolean);
            const names = [
                ...new Set(
                    families.map((f) => {
                        const quoted = f.match(/'([^']+)'/);
                        if (quoted) return quoted[1];
                        return f
                            .split(",")[0]
                            .trim()
                            .replace(/^['"]|['"]$/g, "");
                    }),
                ),
            ];

            if (names.length === 0) return null;

            const FONT_FILES: Record<string, string> = {
                Archivo: "/fonts/Archivo-VariableFont_wdth,wght.ttf",
                "Dancing Script": "/fonts/DancingScript-VariableFont_wght.ttf",
                "Edu QLD Hand": "/fonts/EduQLDHand-VariableFont_wght.ttf",
                "Edu SA Hand": "/fonts/EduSAHand-VariableFont_wght.ttf",
                Handlee: "/fonts/Handlee-Regular.ttf",
                Lora: "/fonts/Lora-VariableFont_wght.ttf",
                Manrope: "/fonts/Manrope-VariableFont_wght.ttf",
                "Ms Madi": "/fonts/MsMadi-Regular.ttf",
                "Noto Sans": "/fonts/NotoSans-VariableFont_wdth,wght.ttf",
                "Pirata One": "/fonts/PirataOne-Regular.ttf",
                "Space Mono": "/fonts/SpaceMono-Regular.ttf",
            };

            let css = "";
            for (const name of names) {
                const path = FONT_FILES[name];
                if (!path) {
                    console.warn("[FontEmbed] Missing mapping for", name);
                    continue;
                }
                try {
                    const res = await fetch(path);
                    if (!res.ok) {
                        console.warn(
                            "[FontEmbed] Fetch failed:",
                            name,
                            res.status,
                        );
                        continue;
                    }
                    const buf = await res.arrayBuffer();
                    const base64 = btoa(
                        String.fromCharCode(...new Uint8Array(buf)),
                    );
                    css += `@font-face {
    font-family: '${name}';
    src: url(data:font/truetype;base64,${base64}) format('truetype');
    font-weight: 100 900;
    font-style: normal;
    font-display: swap;
}\n`;
                } catch (e) {
                    console.warn("[FontEmbed] Error embedding:", name, e);
                }
            }

            if (!css) return null;
            const existing = document.getElementById("embedded-export-fonts");
            if (existing) existing.remove();

            const styleEl = document.createElement("style");
            styleEl.id = "embedded-export-fonts";
            styleEl.textContent = css;
            document.head.appendChild(styleEl);
            return () => {
                styleEl.parentNode?.removeChild(styleEl);
            };
        } catch (e) {
            console.warn("[FontEmbed] Unexpected error:", e);
            return null;
        }
    }

    // High fidelity image export ---------------------------------------------
    async function generateImageBlob(): Promise<Blob | null> {
        let manualFontCleanup: (() => void) | null = null;
        let sandbox: HTMLDivElement | null = null;

        try {
            const { snapdom } = await import("@zumer/snapdom");
            const element = document.getElementById("export-preview");
            if (!element) throw new Error("Export preview element not found");

            // Wait for fonts then next frame
            await document.fonts.ready;
            await new Promise((r) => requestAnimationFrame(() => r(null)));

            // Manual font embedding first
            manualFontCleanup = await minimalEmbedSelectedFonts();

            // Ensure images loaded
            const imgPromises: Promise<void>[] = [];
            element.querySelectorAll("img").forEach((img) => {
                if (!img.complete || img.naturalWidth === 0) {
                    imgPromises.push(
                        new Promise((res, rej) => {
                            img.addEventListener("load", () => res(), {
                                once: true,
                            });
                            img.addEventListener("error", () => rej(), {
                                once: true,
                            });
                        }),
                    );
                }
            });
            if (imgPromises.length) {
                await Promise.allSettled(imgPromises);
            }

            // Clone subtree
            const clone = element.cloneNode(true) as HTMLElement;

            // Inline critical computed styles
            const origNodes = element.querySelectorAll<HTMLElement>("*");
            const cloneNodes = clone.querySelectorAll<HTMLElement>("*");
            origNodes.forEach((orig, idx) => {
                const target = cloneNodes[idx];
                if (!target) return;
                const cs = getComputedStyle(orig);
                const props = [
                    "position",
                    "display",
                    "flexDirection",
                    "flexWrap",
                    "alignItems",
                    "justifyContent",
                    "gap",
                    "gridTemplateColumns",
                    "gridTemplateRows",
                    "top",
                    "left",
                    "right",
                    "bottom",
                    "margin",
                    "marginTop",
                    "marginBottom",
                    "marginLeft",
                    "marginRight",
                    "padding",
                    "paddingTop",
                    "paddingBottom",
                    "paddingLeft",
                    "paddingRight",
                    "width",
                    "height",
                    "minWidth",
                    "minHeight",
                    "maxWidth",
                    "maxHeight",
                    "fontFamily",
                    "fontSize",
                    "fontWeight",
                    "fontStyle",
                    "lineHeight",
                    "color",
                    "backgroundColor",
                    "backgroundImage",
                    "backgroundPosition",
                    "backgroundSize",
                    "backgroundRepeat",
                    "border",
                    "borderTop",
                    "borderBottom",
                    "borderLeft",
                    "borderRight",
                    "borderRadius",
                    "boxShadow",
                    "textAlign",
                    "letterSpacing",
                    "whiteSpace",
                    "overflow",
                    "overflowX",
                    "overflowY",
                    "textDecoration",
                    "opacity",
                ];
                let styleText = "";
                props.forEach((p) => {
                    const v = (cs as any)[p];
                    if (v && v !== "initial") styleText += `${p}:${v};`;
                });
                target.setAttribute("style", styleText);
            });

            // Inline <img> sources (small same-origin only)
            async function inlineImg(img: HTMLImageElement) {
                try {
                    if (!img.src.startsWith("data:")) {
                        const resp = await fetch(img.src, {
                            cache: "force-cache",
                        });
                        if (!resp.ok) return;
                        const blob = await resp.blob();
                        if (blob.size > 2_500_000) return; // skip huge
                        const dataUrl = await new Promise<string>((res) => {
                            const reader = new FileReader();
                            reader.onload = () => res(reader.result as string);
                            reader.readAsDataURL(blob);
                        });
                        img.src = dataUrl;
                    }
                } catch {
                    // ignore failures
                }
            }
            await Promise.all(
                Array.from(clone.querySelectorAll("img")).map((img) =>
                    inlineImg(img),
                ),
            );

            // Sandbox container off-screen
            sandbox = document.createElement("div");
            sandbox.style.position = "fixed";
            sandbox.style.left = "-100000px";
            sandbox.style.top = "0";
            sandbox.style.pointerEvents = "none";
            sandbox.appendChild(clone);
            document.body.appendChild(sandbox);

            // Dimensions & scale
            const rect = clone.getBoundingClientRect();
            const baseWidth = rect.width;
            const baseHeight = rect.height;
            const ua = navigator.userAgent;
            const isIOSSafari =
                /iPad|iPhone|iPod/.test(ua) &&
                /Safari/.test(ua) &&
                !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);

            const targetScale = isIOSSafari ? 3 : 4;
            const maxPixels = 35_000_000;
            let scale = targetScale;
            const pixels = baseWidth * targetScale * baseHeight * targetScale;
            if (pixels > maxPixels) {
                scale = Math.max(
                    1,
                    Math.floor(Math.sqrt(maxPixels / (baseWidth * baseHeight))),
                );
            }

            // First attempt (manual fonts already embedded)
            let blob = await snapdom.toBlob(clone, {
                type: "png",
                scale,
                embedFonts: false,
                backgroundColor:
                    $exportSettings.backgroundMode === "color"
                        ? $exportSettings.backgroundColor
                        : null,
                filter: (node) => {
                    const el = node as Element;
                    return !el.classList?.contains("no-export");
                },
            });

            // Fallback with snapdom font embedding
            if (!blob) {
                blob = await snapdom.toBlob(clone, {
                    type: "png",
                    scale,
                    embedFonts: true,
                    backgroundColor:
                        $exportSettings.backgroundMode === "color"
                            ? $exportSettings.backgroundColor
                            : null,
                    filter: (node) => {
                        const el = node as Element;
                        return !el.classList?.contains("no-export");
                    },
                });
            }

            // iOS scale fallback
            if (!blob && isIOSSafari && scale > 2) {
                blob = await snapdom.toBlob(clone, {
                    type: "png",
                    scale: 2,
                    embedFonts: true,
                    backgroundColor:
                        $exportSettings.backgroundMode === "color"
                            ? $exportSettings.backgroundColor
                            : null,
                    filter: (node) => {
                        const el = node as Element;
                        return !el.classList?.contains("no-export");
                    },
                });
            }

            if (!blob) throw new Error("Failed to generate image");

            return blob;
        } catch (e) {
            exportError =
                e instanceof Error ? e.message : "Export failed unexpectedly";
            console.error("[ExportSheet] Export error:", e);
            return null;
        } finally {
            try {
                manualFontCleanup?.();
            } catch (e) {
                console.warn("[ExportSheet] Font cleanup error:", e);
            }
            sandbox?.remove();
        }
    }

    // Export actions ----------------------------------------------------------
    async function exportAsImage() {
        isExporting = true;
        exportError = "";
        const blob = await generateImageBlob();
        if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Wochenschau_W${$currentWeek}_${$currentYear}.png`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            setTimeout(() => dispatch("close"), 500);
        }
        isExporting = false;
    }

    async function copyToClipboard() {
        isExporting = true;
        exportError = "";
        const blob = await generateImageBlob();
        if (!blob) {
            isExporting = false;
            return;
        }
        try {
            await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob }),
            ]);
            setTimeout(() => dispatch("close"), 500);
        } catch (e) {
            exportError = "Failed to copy image to clipboard";
            console.error(e);
        } finally {
            isExporting = false;
        }
    }

    async function shareAgenda() {
        isExporting = true;
        exportError = "";
        const blob = await generateImageBlob();
        if (!blob) {
            isExporting = false;
            return;
        }
        try {
            const file = new File(
                [blob],
                `Wochenschau_W${$currentWeek}_${$currentYear}.png`,
                { type: "image/png" },
            );
            if (navigator.share) {
                await navigator.share({
                    title: `Wochenschau KW ${$currentWeek}`,
                    text: `Meine Wochenansicht KW ${$currentWeek} ${$currentYear}`,
                    files: [file],
                });
                setTimeout(() => dispatch("close"), 500);
            } else {
                exportError = "Web Share API wird nicht unterstützt";
            }
        } catch (e: any) {
            if (e?.name !== "AbortError") {
                exportError =
                    e instanceof Error ? e.message : "Share fehlgeschlagen";
            }
        } finally {
            isExporting = false;
        }
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
                <legend class="text-sm font-semibold text-foreground">
                    Preview
                </legend>
                <div class="flex gap-2 items-center">
                    <button
                        class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors {showPreview
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'}"
                        on:click={toggleShowPreview}
                        title={showPreview ? "Hide preview" : "Show preview"}
                    >
                        {showPreview ? "Preview On" : "Preview Off"}
                    </button>

                    <!-- Layout Buttons -->
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
                        <button
                            class="px-3 py-1.5 rounded text-sm font-medium transition-colors {layoutMode ===
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
                class="bg-background rounded-lg border border-border overflow-auto max-h-[55vh]"
            >
                <div
                    class={layoutMode === "grid"
                        ? ""
                        : "flex justify-center min-w-full"}
                >
                    <div
                        id="export-preview"
                        style="
                            width:{layoutMode === 'grid'
                            ? '900px'
                            : layoutMode === 'list'
                              ? '400px'
                              : '360px'};
                            min-width:{layoutMode === 'grid'
                            ? '900px'
                            : layoutMode === 'list'
                              ? '400px'
                              : '360px'};
                            max-width:{layoutMode === 'grid'
                            ? '900px'
                            : layoutMode === 'list'
                              ? '400px'
                              : '360px'};
                            padding:10px;
                            position:relative;
                            font-family:{$exportSettings.bodyFontFamily};
                            color:{$exportSettings.textColor};
                            {$exportSettings.backgroundMode === 'color'
                            ? `background-color: ${$exportSettings.backgroundColor};`
                            : ''}
                        "
                    >
                        {#if $exportSettings.backgroundMode === "image" && $exportSettings.backgroundImage}
                            <img
                                src={$exportSettings.backgroundImage}
                                alt=""
                                style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;pointer-events:none;z-index:0;"
                            />
                        {/if}

                        {#if $exportSettings.backgroundMode === "color"}
                            <div
                                style="position:absolute;inset:0;background-color:{$exportSettings.backgroundColor};opacity:{(100 -
                                    $exportSettings.backgroundOpacity) /
                                    100};pointer-events:none;z-index:1;"
                            ></div>
                        {/if}

                        <div
                            class="space-y-4"
                            style="position:relative;z-index:10;"
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
                                        style="color: {$exportSettings.textColor}; opacity:0.8;"
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
                                            style="background-color:{getWeekContainerBackgroundStyle()}; box-shadow:0 2px 8px rgba(0,0,0,0.1); border-radius:{$exportSettings.borderRadius}px;"
                                        >
                                            <div
                                                class="mb-2 pb-2"
                                                style="border-bottom:1px solid {$exportSettings.accentColor}30;"
                                            >
                                                <div
                                                    class="font-semibold text-xs"
                                                    style="color:{$exportSettings.textColor};"
                                                >
                                                    {WEEKDAYS_DE[dayIndex]} ·
                                                    <span
                                                        style="opacity:0.7;font-weight:normal;"
                                                        >{formatDate(day)}</span
                                                    >
                                                </div>
                                            </div>
                                            <div class="space-y-2">
                                                {#if getDayActivities(dayIndex).length === 0}
                                                    <div
                                                        class="text-xs text-center"
                                                        style="font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor}; opacity:0.5;"
                                                    >
                                                        No activities
                                                    </div>
                                                {:else}
                                                    {#each getDayActivities(dayIndex) as activity}
                                                        <div
                                                            class="px-1.5 text-xs"
                                                            style="border-left:3px solid {activity.color ||
                                                                $exportSettings.accentColor};"
                                                        >
                                                            <div
                                                                class="font-semibold truncate"
                                                                style="color:{$exportSettings.textColor};"
                                                            >
                                                                {activity.summary}
                                                            </div>
                                                            {#if isAllDayEvent(activity)}
                                                                <div
                                                                    class="text-xs"
                                                                    style="font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor}; opacity:0.7;"
                                                                >
                                                                    All-Day
                                                                </div>
                                                            {:else}
                                                                <div
                                                                    class="text-xs"
                                                                    style="font-family: {$exportSettings.bodyFontFamily}; color: {$exportSettings.textColor}; opacity:0.7;"
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
                                            style="border-radius:{$exportSettings.borderRadius}px;"
                                        >
                                            <p
                                                class="text-sm italic mb-1"
                                                style="color:{$exportSettings.textColor};"
                                            >
                                                "{$bibleVerse.currentVerse
                                                    .text}"
                                            </p>
                                            <p
                                                class="text-xs"
                                                style="color:{$exportSettings.textColor};opacity:0.7;"
                                            >
                                                – {$bibleVerse.currentVerse
                                                    .reference}
                                            </p>
                                        </div>
                                    {/if}
                                </div>
                            {:else if layoutMode === "list"}
                                <div class="space-y-1">
                                    {#each days as day, dayIndex}
                                        <div
                                            class="p-3"
                                            style="background-color:{getWeekContainerBackgroundStyle()}; box-shadow:0 2px 8px rgba(0,0,0,0.1); border-radius:{dayIndex ===
                                            0
                                                ? '16px 16px 4px 4px'
                                                : dayIndex === 6
                                                  ? '4px 4px 16px 16px'
                                                  : '4px'};"
                                        >
                                            <div
                                                class="mb-2 pb-2"
                                                style="border-bottom:1px solid {$exportSettings.accentColor}30;"
                                            >
                                                <div
                                                    class="font-semibold text-sm"
                                                    style="color:{$exportSettings.textColor};"
                                                >
                                                    {WEEKDAYS_DE[dayIndex]} · {formatDate(
                                                        day,
                                                    )}
                                                </div>
                                            </div>
                                            <div class="space-y-2">
                                                {#if getDayActivities(dayIndex).length === 0}
                                                    <div
                                                        class="text-sm text-center"
                                                        style="color:{$exportSettings.textColor};opacity:0.5;"
                                                    >
                                                        No activities
                                                    </div>
                                                {:else}
                                                    {#each getDayActivities(dayIndex) as activity}
                                                        <div
                                                            class="px-2 text-sm"
                                                            style="border-left:3px solid {activity.color ||
                                                                $exportSettings.accentColor};"
                                                        >
                                                            <div
                                                                class="font-semibold"
                                                                style="color:{$exportSettings.textColor};"
                                                            >
                                                                {activity.summary}
                                                            </div>
                                                            {#if isAllDayEvent(activity)}
                                                                <div
                                                                    class="text-xs"
                                                                    style="color:{$exportSettings.textColor};opacity:0.7;"
                                                                >
                                                                    All-Day
                                                                </div>
                                                            {:else}
                                                                <div
                                                                    class="text-xs"
                                                                    style="color:{$exportSettings.textColor};opacity:0.7;"
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
                                            style="margin-top:0.5rem;"
                                        >
                                            <p
                                                class="text-sm italic mb-2"
                                                style="color:{$exportSettings.textColor};"
                                            >
                                                "{$bibleVerse.currentVerse
                                                    .text}"
                                            </p>
                                            <p
                                                class="text-xs"
                                                style="color:{$exportSettings.textColor};opacity:0.7;"
                                            >
                                                – {$bibleVerse.currentVerse
                                                    .reference}
                                            </p>
                                        </div>
                                    {/if}
                                </div>
                            {:else}
                                <!-- Compact view -->
                                <div class="space-y-1">
                                    {#each days as day, dayIndex}
                                        <div
                                            class="p-2"
                                            style="background-color:{getWeekContainerBackgroundStyle()}; border-radius:{$exportSettings.borderRadius}px;"
                                        >
                                            <div class="flex gap-2">
                                                <div
                                                    class="flex flex-col items-center w-10"
                                                    style="line-height:1;"
                                                >
                                                    <div
                                                        style="font-size:12px;font-weight:600;color:{$exportSettings.textColor};"
                                                    >
                                                        {formatDate(day)}
                                                    </div>
                                                    <div
                                                        style="font-size:10px;font-weight:500;opacity:0.7;color:{$exportSettings.textColor};text-align:center;"
                                                    >
                                                        {WEEKDAYS_DE[dayIndex]}
                                                    </div>
                                                </div>
                                                <div class="flex-1">
                                                    {#if getDayActivities(dayIndex).length === 0}
                                                        <div
                                                            class="italic opacity-40"
                                                            style="font-size:11px;color:{$exportSettings.textColor};"
                                                        >
                                                            –
                                                        </div>
                                                    {:else}
                                                        <div
                                                            class="space-y-0.5"
                                                        >
                                                            {#each getDayActivities(dayIndex) as activity}
                                                                <div
                                                                    class="grid"
                                                                    style="grid-template-columns:56px 1fr;font-size:11px;line-height:1.2;color:{$exportSettings.textColor};font-family:{$exportSettings.bodyFontFamily};"
                                                                >
                                                                    <div
                                                                        class="pr-1 opacity-60"
                                                                        style="text-align:right;"
                                                                    >
                                                                        {#if isAllDayEvent(activity)}
                                                                            All
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
                                        <div
                                            class="p-2 text-center italic"
                                            style="font-size:10px;opacity:0.7;"
                                        >
                                            "{$bibleVerse.currentVerse.text}" – {$bibleVerse
                                                .currentVerse.reference}
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
