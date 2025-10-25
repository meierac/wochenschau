<script lang="ts">
    import { onMount } from "svelte";
    import { exportSettings } from "../stores/exportSettings";
    import IconButton from "./IconButton.svelte";

    type BackgroundType = "color" | "image";
    let backgroundType: BackgroundType = "color";
    let fileInput: HTMLInputElement;
    let errorMessage: string | null = null;
    let isLoading = false;

    onMount(() => {
        console.log("[DefaultBackgroundSelector] Component mounted");
        console.log(
            "[DefaultBackgroundSelector] Current backgroundImage:",
            $exportSettings.backgroundImage
                ? `exists (${$exportSettings.backgroundImage.length} chars)`
                : "null",
        );
        console.log(
            "[DefaultBackgroundSelector] Current backgroundImageUrl:",
            $exportSettings.backgroundImageUrl,
        );
        console.log(
            "[DefaultBackgroundSelector] Current backgroundImageType:",
            $exportSettings.backgroundImageType,
        );
    });

    // Reactive statement to track changes
    $: {
        console.log(
            "[DefaultBackgroundSelector] Reactive update - backgroundImage:",
            $exportSettings.backgroundImage
                ? `exists (${$exportSettings.backgroundImage.length} chars)`
                : "null",
        );
        console.log(
            "[DefaultBackgroundSelector] Reactive update - backgroundImageUrl:",
            $exportSettings.backgroundImageUrl,
        );
    }

    // Predefined images from public/backgrounds folder
    const predefinedImages = [
        "0A96161F-408D-41FA-8B45-72986B618824.JPG",
        "32C260C9-C5AF-421E-8E81-9112297ABC2D.JPG",
        "62536F58-8EFA-4C12-90DC-28C9BE3526F0.JPG",
        "IMG_0999.JPG",
        "IMG_1014.JPG",
        "IMG_1015.JPG",
        "IMG_1029.JPG",
        "IMG_2422.PNG",
        "IMG_2423.PNG",
        "IMG_2424.PNG",
        "IMG_2425.PNG",
        "IMG_2426.PNG",
        "IMG_3186.JPG",
    ].map((filename) => ({
        id: filename,
        url: `/wochenschau/backgrounds/${filename}`,
        name: filename.replace(/\.(JPG|PNG)$/i, ""),
    }));

    // Initialize background type based on current settings
    $: {
        backgroundType = $exportSettings.backgroundMode;
    }

    $: selectedImageId = $exportSettings.backgroundImageUrl;
    $: isCustomSelected =
        $exportSettings.backgroundImageType === "custom" &&
        $exportSettings.backgroundImage;

    async function loadImageAsBase64(url: string): Promise<string> {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(blob);
        });
    }

    async function handleSelectPredefinedImage(url: string, id: string) {
        isLoading = true;
        errorMessage = null;
        try {
            console.log("Loading image from URL:", url);
            const base64 = await loadImageAsBase64(url);
            console.log("Image loaded, base64 length:", base64.length);
            await exportSettings.setBackgroundImage(base64, id, "default");
            exportSettings.setBackgroundMode("image");
            console.log("Background image set successfully");
        } catch (error) {
            console.error("Error loading background:", error);
            errorMessage = "Failed to load background image.";
        } finally {
            isLoading = false;
        }
    }

    function handleFileUpload(e: Event) {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        errorMessage = null;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            errorMessage = "Please select an image file.";
            return;
        }

        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            errorMessage = "File size must be less than 10MB.";
            return;
        }

        isLoading = true;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const imageData = event.target?.result as string;
                await exportSettings.setBackgroundImage(
                    imageData,
                    "custom",
                    "custom",
                );
                exportSettings.setBackgroundMode("image");
                errorMessage = null;
            } catch (error) {
                console.error("Error uploading image:", error);
                errorMessage = "Failed to upload image.";
            } finally {
                isLoading = false;
            }
        };
        reader.onerror = () => {
            errorMessage = "Failed to read file.";
            isLoading = false;
        };
        reader.readAsDataURL(file);
    }

    async function handleClearImage() {
        try {
            await exportSettings.setBackgroundImage(null, null, null);
            if (fileInput) fileInput.value = "";
            errorMessage = null;
        } catch (error) {
            console.error("Error clearing image:", error);
            errorMessage = "Failed to clear image.";
        }
    }

    function handleTypeChange(type: BackgroundType) {
        exportSettings.setBackgroundMode(type);
    }
</script>

<div class="space-y-4">
    <!-- Type Selector -->
    <div class="flex gap-2">
        <button
            on:click={() => handleTypeChange("color")}
            class="flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all {backgroundType ===
            'color'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'}"
        >
            Solid Color
        </button>
        <button
            on:click={() => handleTypeChange("image")}
            class="flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all {backgroundType ===
            'image'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'}"
        >
            Background Image
        </button>
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

    {#if backgroundType !== "color"}
        <!-- Background Image Selector -->
        <div class="space-y-3">
            <!-- Clear Button -->
            {#if $exportSettings.backgroundImage}
                <div class="flex justify-end">
                    <button
                        on:click={handleClearImage}
                        class="text-xs font-semibold text-destructive hover:underline"
                        disabled={isLoading}
                    >
                        Clear Image
                    </button>
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
                        >Loading...</span
                    >
                </div>
            {/if}

            <!-- Image Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <!-- Predefined Images -->
                {#each predefinedImages as image}
                    <button
                        on:click={() =>
                            handleSelectPredefinedImage(image.url, image.id)}
                        disabled={isLoading}
                        class="group relative h-24 rounded-lg border-2 transition-all overflow-hidden disabled:opacity-50 {selectedImageId ===
                        image.id
                            ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background'
                            : 'border-border hover:border-primary'}"
                    >
                        <img
                            src={image.url}
                            alt={image.name}
                            class="w-full h-full object-cover transition-transform group-hover:scale-105"
                            loading="lazy"
                        />
                        {#if selectedImageId === image.id}
                            <div
                                class="absolute inset-0 bg-primary/20 flex items-center justify-center"
                            >
                                <div
                                    class="bg-primary text-primary-foreground rounded-full p-1.5"
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
                        {/if}
                    </button>
                {/each}

                <!-- Custom Image -->
                {#if isCustomSelected}
                    <button
                        disabled={isLoading}
                        class="group relative h-24 rounded-lg border-2 transition-all overflow-hidden disabled:opacity-50 border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
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
                                class="bg-primary text-primary-foreground rounded-full p-1.5"
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
                    <!-- Upload Button -->
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
                        <span
                            class="text-[10px] font-semibold text-muted-foreground"
                        >
                            Upload
                        </span>
                    </button>
                {/if}
            </div>

            <!-- File Info -->
            <p class="text-xs text-muted-foreground text-center">
                Upload your own image (max 10MB)
            </p>
        </div>
    {/if}

    <!-- Hidden File Input -->
    <input
        bind:this={fileInput}
        type="file"
        accept="image/*"
        on:change={handleFileUpload}
        class="hidden"
    />
</div>
