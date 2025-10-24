<script lang="ts">
    import { onMount } from "svelte";
    import { exportSettings } from "../stores/exportSettings";
    import {
        getBackgroundsByCategory,
        getAllCategories,
    } from "../stores/defaultBackgrounds";
    import IconButton from "./IconButton.svelte";

    let selectedCategory: "gradient" | "solid" | "nature" = "gradient";
    let isLoading = false;
    let fileInput: HTMLInputElement;
    let errorMessage: string | null = null;

    // Simple state - just track what's selected
    let selectedBackgroundId: string | null = null;

    // Initialize from store on mount
    onMount(() => {
        const stored = $exportSettings.backgroundImageUrl;
        if (stored) {
            selectedBackgroundId = stored;
        }
    });

    // Watch for store changes
    $: {
        if ($exportSettings.backgroundImageUrl) {
            selectedBackgroundId = $exportSettings.backgroundImageUrl;
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

    async function handleSelectBackground(url: string, id: string) {
        isLoading = true;
        errorMessage = null;
        try {
            const base64 = await loadBackgroundAsBase64(url);
            selectedBackgroundId = id;
            exportSettings.setBackgroundImage(base64, id, "default");
        } catch (error) {
            console.error("Error loading background:", error);
            errorMessage = "Failed to load background. Please try again.";
        } finally {
            isLoading = false;
        }
    }

    function handleFileUpload(e: Event) {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        errorMessage = null;

        if (!file.type.startsWith("image/")) {
            errorMessage = "Please select an image file";
            return;
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            errorMessage = "File size exceeds 5MB limit";
            return;
        }

        isLoading = true;
        const reader = new FileReader();
        reader.onload = (event) => {
            const imageData = event.target?.result as string;
            selectedBackgroundId = "custom";
            exportSettings.setBackgroundImage(imageData, "custom", "custom");
            isLoading = false;
        };
        reader.onerror = () => {
            errorMessage = "Failed to read file";
            isLoading = false;
        };
        reader.readAsDataURL(file);
    }

    function handleClearBackground() {
        exportSettings.setBackgroundImage(null, null, null);
        selectedBackgroundId = null;
        if (fileInput) fileInput.value = "";
    }

    $: backgroundsInCategory = getBackgroundsByCategory(selectedCategory);
    $: categories = getAllCategories();
    $: isCustomSelected =
        selectedBackgroundId === "custom" &&
        $exportSettings.backgroundImageType === "custom";
</script>

<div class="space-y-4">
    <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-foreground">
            Background Options
        </h3>
        {#if $exportSettings.backgroundImage}
            <button
                on:click={handleClearBackground}
                class="text-xs font-semibold text-destructive hover:underline"
            >
                Clear
            </button>
        {/if}
    </div>

    <!-- Category Tabs -->
    {#if categories.length > 1}
        <div class="flex gap-2 border-b border-border overflow-x-auto">
            {#each categories as category}
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
    {/if}

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
        </div>
    {/if}

    <!-- Background Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        <!-- Default Background Tiles -->
        {#each backgroundsInCategory as background (background.id)}
            <button
                on:click={() =>
                    handleSelectBackground(background.url, background.id)}
                disabled={isLoading}
                class="group relative h-24 rounded-lg border-2 transition-all overflow-hidden disabled:opacity-50 {selectedBackgroundId ===
                background.id
                    ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg'
                    : 'border-border hover:border-primary hover:shadow-md'}"
            >
                <img
                    src={background.url}
                    alt={background.name}
                    class="w-full h-full object-cover transition-transform {selectedBackgroundId ===
                    background.id
                        ? ''
                        : 'group-hover:scale-105'}"
                    loading="lazy"
                />

                {#if selectedBackgroundId === background.id}
                    <!-- Selected State -->
                    <div
                        class="absolute inset-0 bg-primary/20 flex items-center justify-center"
                    >
                        <div
                            class="bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg"
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
                                    stroke-width="3"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                    </div>
                    <div
                        class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2"
                    >
                        <span class="text-xs text-white font-semibold">
                            {background.name}
                        </span>
                    </div>
                {:else}
                    <!-- Hover State -->
                    <div
                        class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end p-2"
                    >
                        <span
                            class="text-xs text-white drop-shadow font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            {background.name}
                        </span>
                    </div>
                {/if}
            </button>
        {/each}

        <!-- Custom Image Upload / Display -->
        {#if isCustomSelected && $exportSettings.backgroundImage}
            <!-- Show custom image tile -->
            <button
                disabled={isLoading}
                class="group relative h-24 rounded-lg border-2 transition-all overflow-hidden disabled:opacity-50 border-primary ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg"
            >
                <img
                    src={$exportSettings.backgroundImage}
                    alt="Custom background"
                    class="w-full h-full object-cover"
                />
                <div
                    class="absolute inset-0 bg-primary/20 flex items-center justify-center"
                >
                    <div
                        class="bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg"
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
                                stroke-width="3"
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                </div>
                <div
                    class="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded"
                >
                    CUSTOM
                </div>
            </button>
        {:else}
            <!-- Upload button -->
            <button
                on:click={() => fileInput?.click()}
                disabled={isLoading}
                class="relative h-24 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-muted/50 transition-all disabled:opacity-50 flex flex-col items-center justify-center gap-1"
            >
                <svg
                    class="w-6 h-6 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 4v16m8-8H4"
                    />
                </svg>
                <span class="text-[10px] font-semibold text-muted-foreground">
                    Upload Custom
                </span>
            </button>
        {/if}
    </div>

    <!-- Hidden File Input -->
    <input
        bind:this={fileInput}
        type="file"
        accept="image/*"
        on:change={handleFileUpload}
        class="hidden"
    />

    <!-- Status Info -->
    {#if $exportSettings.backgroundImage}
        <div class="p-3 bg-muted/50 rounded-lg">
            <p class="text-xs text-muted-foreground">✅ Background active</p>
        </div>
    {/if}
</div>
