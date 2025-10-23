<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { activities } from "../stores/activities";
    import { currentWeek, currentYear } from "../stores/week";
    import { formatDateRange, getDaysOfWeek } from "../utils/date";
    import { WEEKDAYS } from "../types/index";
    import IconButton from "./IconButton.svelte";
    import Button from "./Button.svelte";

    export let isDesktop = false;

    const dispatch = createEventDispatcher();

    let isExporting = false;
    let exportError = "";
    let layoutMode: "grid" | "list" = "grid";
    let showPreview = true;

    function handleClose() {
        dispatch("close");
    }

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            dispatch("close");
        }
    }

    async function generateJPGBlob(): Promise<Blob | null> {
        try {
            const html2canvas = (await import("html2canvas")).default as any;

            const element = document.getElementById("export-preview");
            if (!element) {
                throw new Error("Export preview element not found");
            }

            const canvas = await html2canvas(element, {
                backgroundColor: "#ffffff",
                scale: 2,
                useCORS: true,
                allowTaint: true,
            });

            return new Promise((resolve) => {
                canvas.toBlob(
                    (blob: Blob | null) => {
                        resolve(blob);
                    },
                    "image/jpeg",
                    0.95,
                );
            });
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
                    <div class="flex gap-2">
                        <IconButton
                            variant="ghost"
                            size="md"
                            ariaLabel={showPreview
                                ? "Hide preview"
                                : "Show preview"}
                            on:click={() => (showPreview = !showPreview)}
                        >
                            <svg
                                class="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                {#if showPreview}
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                {:else}
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                {/if}
                            </svg>
                        </IconButton>

                        <IconButton
                            variant="ghost"
                            size="md"
                            ariaLabel={layoutMode === "grid"
                                ? "Switch to list view"
                                : "Switch to grid view"}
                            on:click={() =>
                                (layoutMode =
                                    layoutMode === "grid" ? "list" : "grid")}
                        >
                            <svg
                                class="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"
                                />
                            </svg>
                        </IconButton>
                    </div>
                </div>

                <!-- Preview -->
                {#if showPreview}
                    <div
                        class="bg-white text-black p-6 rounded-lg border border-border max-h-96 overflow-auto"
                    >
                        <div id="export-preview" class="space-y-4">
                            <div class="mb-6 text-center">
                                <h2 class="text-3xl font-bold mb-2">
                                    Wochenschau
                                </h2>
                                <p class="text-lg font-semibold text-gray-700">
                                    Week {$currentWeek} · {formatDateRange(
                                        $currentWeek,
                                        $currentYear,
                                    )}
                                </p>
                            </div>

                            {#if layoutMode === "grid"}
                                <div class="grid grid-cols-4 gap-3">
                                    {#each days as day, dayIndex}
                                        <div
                                            class="border border-gray-300 rounded-lg p-2 bg-gray-50"
                                        >
                                            <div
                                                class="mb-2 pb-2 border-b border-gray-300"
                                            >
                                                <div
                                                    class="font-semibold text-sm text-gray-900"
                                                >
                                                    {WEEKDAYS[dayIndex]}
                                                </div>
                                                <div
                                                    class="text-xs text-gray-600"
                                                >
                                                    {formatDate(day)}
                                                </div>
                                            </div>
                                            <div class="space-y-2">
                                                {#if getDayActivities(dayIndex).length === 0}
                                                    <div
                                                        class="text-xs text-gray-500 text-center"
                                                    >
                                                        No activities
                                                    </div>
                                                {:else}
                                                    {#each getDayActivities(dayIndex) as activity}
                                                        <div
                                                            class="p-1.5 bg-white rounded border-l-2 text-xs"
                                                            style="border-color: {activity.color ||
                                                                '#9333ea'}"
                                                        >
                                                            <div
                                                                class="font-semibold text-gray-900 truncate"
                                                            >
                                                                {activity.summary}
                                                            </div>
                                                            <div
                                                                class="text-gray-600 text-xs"
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
                                </div>
                            {:else}
                                <div class="space-y-4">
                                    {#each days as day, dayIndex}
                                        <div
                                            class="border-l-4 border-primary pl-3"
                                        >
                                            <div
                                                class="mb-2 pb-2 border-b border-gray-300"
                                            >
                                                <div
                                                    class="font-semibold text-gray-900"
                                                >
                                                    {WEEKDAYS[dayIndex]} · {formatDate(
                                                        day,
                                                    )}
                                                </div>
                                            </div>
                                            <div class="space-y-2">
                                                {#if getDayActivities(dayIndex).length === 0}
                                                    <div
                                                        class="text-sm text-gray-500 text-center"
                                                    >
                                                        No activities
                                                    </div>
                                                {:else}
                                                    {#each getDayActivities(dayIndex) as activity}
                                                        <div
                                                            class="p-2 bg-gray-50 rounded border-l-2 text-sm"
                                                            style="border-color: {activity.color ||
                                                                '#9333ea'}"
                                                        >
                                                            <div
                                                                class="font-semibold text-gray-900"
                                                            >
                                                                {activity.summary}
                                                            </div>
                                                            <div
                                                                class="text-gray-600 text-xs"
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
                                </div>
                            {/if}
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
                    <p class="text-xs text-muted-foreground text-center">
                        Download or copy the weekly agenda as an image to share
                    </p>
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
                    <p class="text-xs text-muted-foreground text-center">
                        Share your agenda with all available options on your
                        device
                    </p>
                {/if}
            </div>
        </div>
    </div>
</div>
