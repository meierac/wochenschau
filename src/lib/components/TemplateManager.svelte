<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { templates } from "../stores/templates";
    import type { ActivityTemplate } from "../types/index";
    import IconButton from "./IconButton.svelte";

    export let isDesktop = false;

    const dispatch = createEventDispatcher();

    let showNewTemplate = false;
    let newTemplate = {
        name: "",
        startTime: "09:00",
        endTime: "10:00",
    };

    function handleAddTemplate() {
        if (!newTemplate.name.trim()) return;

        const template: ActivityTemplate = {
            id: `template-${Date.now()}`,
            name: newTemplate.name,
            startTime: newTemplate.startTime,
            endTime: newTemplate.endTime,
            createdAt: Date.now(),
        };

        templates.addTemplate(template);
        showNewTemplate = false;
        newTemplate = { name: "", startTime: "09:00", endTime: "10:00" };
    }

    function handleDeleteTemplate(id: string) {
        if (confirm("Delete this template?")) {
            templates.removeTemplate(id);
        }
    }

    function handleClose() {
        dispatch("close");
    }

    function handleCancelNewTemplate() {
        showNewTemplate = false;
        newTemplate = { name: "", startTime: "09:00", endTime: "10:00" };
    }
</script>

<div
    class="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4"
>
    <div
        class={`bg-card rounded-3xl md:rounded-lg shadow-lg w-full transition-all flex flex-col ${
            isDesktop ? "md:max-w-md" : ""
        }`}
    >
        <!-- Header with centered title and icon buttons -->
        <div
            class="border-b border-border px-4 py-4 flex items-center justify-between"
        >
            <!-- Cancel button (left) -->
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

            <!-- Centered title -->
            <h3
                class="text-lg font-semibold text-foreground flex-1 text-center"
            >
                Activity Templates
            </h3>

            <!-- Save button (right) - only visible when adding template -->
            {#if showNewTemplate}
                <IconButton
                    variant="ghost"
                    size="md"
                    ariaLabel="Save template"
                    disabled={!newTemplate.name.trim()}
                    on:click={handleAddTemplate}
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
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                </IconButton>
            {:else}
                <div class="w-10 h-10"></div>
            {/if}
        </div>

        <!-- Content -->
        <div class="p-6 max-h-[60vh] overflow-y-auto">
            {#if $templates.length === 0 && !showNewTemplate}
                <div class="text-center py-8">
                    <p class="text-muted-foreground text-sm">
                        No templates yet
                    </p>
                    <p class="text-muted-foreground text-xs mt-1">
                        Create one by adding an activity with "Save as template"
                    </p>
                </div>
            {:else if !showNewTemplate}
                <div class="space-y-2">
                    {#each $templates as template}
                        <div
                            class="p-3 bg-muted rounded-lg border border-border flex items-center justify-between gap-2"
                        >
                            <div class="flex-1 min-w-0">
                                <div
                                    class="font-semibold text-foreground text-sm truncate"
                                >
                                    {template.name}
                                </div>
                                <div class="text-xs text-muted-foreground">
                                    {template.startTime} - {template.endTime}
                                </div>
                            </div>
                            <button
                                on:click={() =>
                                    handleDeleteTemplate(template.id)}
                                class="text-destructive hover:bg-destructive/10 px-2 py-1 rounded transition-colors text-sm"
                            >
                                Delete
                            </button>
                        </div>
                    {/each}
                </div>
            {/if}

            <!-- Add Template Form -->
            {#if showNewTemplate}
                <div
                    class="mt-4 p-3 bg-muted rounded-lg border border-border space-y-3"
                >
                    <input
                        type="text"
                        bind:value={newTemplate.name}
                        placeholder="Template name"
                        class="w-full px-3 py-2 bg-background border border-input rounded text-foreground text-sm"
                    />
                    <div class="grid grid-cols-2 gap-2">
                        <input
                            type="time"
                            bind:value={newTemplate.startTime}
                            class="px-3 py-2 bg-background border border-input rounded text-foreground text-sm"
                        />
                        <input
                            type="time"
                            bind:value={newTemplate.endTime}
                            class="px-3 py-2 bg-background border border-input rounded text-foreground text-sm"
                        />
                    </div>
                    <button
                        on:click={handleCancelNewTemplate}
                        class="flex items-center gap-2 w-full px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted rounded-lg transition-colors"
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
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                        Back
                    </button>
                </div>
            {:else}
                <button
                    on:click={() => (showNewTemplate = true)}
                    class="w-full mt-4 px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted rounded-lg transition-colors border border-input"
                >
                    + New Template
                </button>
            {/if}
        </div>
    </div>
</div>
