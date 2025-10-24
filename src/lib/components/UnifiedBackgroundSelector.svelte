<script lang="ts">
    import { onMount } from "svelte";
    import { exportSettings } from "../stores/exportSettings";
    import {
        getBackgroundsByCategory,
        getAllCategories,
    } from "../stores/defaultBackgrounds";
    import IconButton from "./IconButton.svelte";

    type BackgroundType = "color" | "default" | "custom";

    let selectedCategory: "gradient" | "solid" | "nature" = "gradient";
    let isLoading = false;
    let fileInput: HTMLInputElement;
    let colorInput: HTMLInputElement;
    let errorMessage: string | null = null;

    // Track which type is selected
    let selectedType: BackgroundType = "color";
    let selectedBackgroundId: string | null = null;

    // Initialize from store on mount
    onMount(() => {
        if ($exportSettings.backgroundImage) {
            if ($exportSettings.backgroundImageType === "custom") {
                selectedType = "custom";
                selectedBackgroundId = "custom";
            } else if ($exportSettings.backgroundImageType === "default") {
                selectedType = "default";
                selectedBackgroundId = $exportSettings.backgroundImageUrl;
            }
        } else {
            // No image, using solid color
            selectedType = "color";
        }
    });

    // Watch for store changes
    $: {
        if ($exportSettings.backgroundImage) {
            if ($exportSettings.backgroundImageType === "custom") {
                selectedType = "custom";
                selectedBackgroundId = "custom";
            } else if ($exportSettings.backgroundImageType === "default") {
                selectedType = "default";
                selectedBackgroundId = $exportSettings.backgroundImageUrl;
            }
        } else if (!$exportSettings.backgroundImage && selectedType !== "color") {
            selectedType = "color";
        }
    }

    async function loadBackgroundAsBase64(url: string): Promise<string> {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(blob);
        });
    }

    async function handleSelectSolidColor() {
        isLoading = true;
        errorMessage = null;
        try {
            // Clear any background image
            await exportSettings.setBackgroundImage(null, null, null);
            selectedType = "color";
            selectedBackgroundId = null;
        } catch (error) {
            console.error("Error setting solid color:", error);
            errorMessage = "Failed to set solid color";
        } finally {
            isLoading = false;
        }
    }

    function handleColorChange(e: Event) {
        const target = e.target as HTMLInputElement;
        exportSettings.update((current) => ({
            ...current,
            backgroundColor: target.value,
        }));
    }

    async function handleSelectBackground(url: string, id: string) {
        isLoading = true;
        errorMessage = null;
        try {
            const base64 = await loadBackgroundAsBase64(url);
            selectedType = "default";
            selectedBackgroundId = id;
            await exportSettings.setBackgroundImage(base64, id, "default");
        } catch (error) {
            console.error("Error loading background:", error);
            errorMessage = "Failed to load background. Please try again.";
        } finally {
            isLoading = false;
        }
    }

    async function handleFileUpload(e: Event) {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        errorMessage = null;

        if (!file.type.startsWith("image/")) {
            errorMessage = "Please select an image file";
            return;
        }

        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            errorMessage = "File size exceeds 10MB limit";
            return;
        }

        isLoading = true;
        try {
            const reader = new FileReader();
            const imageData = await new Promise<string>((resolve, reject) => {
                reader.onload = (event) => {
                    resolve(event.target?.result as string);
                };
                reader.onerror = () => {
                    reject(new Error("Failed to read file"));
                };
                reader.readAsDataURL(file);
            });

            selectedType = "custom";
            selectedBackgroundId = "custom";
            await exportSettings.setBackgroundImage(imageData, "custom", "custom");
        } catch (error) {
            console.error("Error uploading image:", error);
            errorMessage =
                error instanceof Error ? error.message : "Failed to upload image";
        } finally {
            isLoading = false;
        }
    }

    $: backgroundsInCategory = getBackgroundsByCategory(selectedCategory);
    $: categories = getAllCategories();
</script>

<div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <h4 class="text-sm font-semibold text-foreground">Background</h4>
        {#if selectedType}
            <span class="text-xs text-muted-foreground">
                {#if selectedType === "color"}
                    Solid Color
                {:else if selectedType === "custom"}
                    Custom Image
                {:else}
                    Default Image
                {/if}
            </span>
        {/if}
    </div>

    <!-- Category Tabs -->
    <div class="flex gap-2 border-b border-border overflow-x-auto">
        <button
            on:click={() => (selectedCategory = "gradient")}
            class="px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap {selectedCategory ===
            'gradient'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'}"
        >
            Colors
        </button>
        {#each categories.filter((c) => c !== "gradient") as category}
            <button
                on:click={() => (selectedCategory = category)}
                class="px-3 py-2 text-xs font-semibold transition-colors capitalize whitespace-nowrap {selectedCategory ===
                category
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'}"
            >
                {category}
            </button>
        {/each}
    </div>

    <!-- Error Message -->
    {#if errorMessage}
        <div
            class="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2"
        >
            <svg
                class="w-4 h-4 text-destructive mt-0.5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
            <p class="text-xs text-destructive flex-1">{errorMessage}</p>
            <IconButton
                on:click={() => (errorMessage = null)}
                class="text-destructive hover:text-destructive/80"
            >
                <svg
                    class="w-4 h-4"
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
        </div>
    {/if}

    <!-- Loading State -->
    {#if isLoading}
        <div
            class="p-4 bg-muted/50 border border-border rounded-lg flex items-center justify-center gap-3"
        >
            <svg
                class="w-5 h-5 text-primary animate-spin"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                />
                <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
            </svg>
            <span class="text-sm font-medium text-foreground"
                >Loading background...</span
            >
        </div
