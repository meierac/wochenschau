<script lang="ts">
    import type { ActivityTemplate } from "../../../types/index";
    import Button from "../../Button.svelte";
    import SettingsIntroCard from "../SettingsIntroCard.svelte";
    import SettingsSectionCard from "../SettingsSectionCard.svelte";

    export let templates: ActivityTemplate[] = [];
    export let showNewTemplate = false;
    export let newTemplate = {
        name: "",
        startTime: "09:00",
        endTime: "10:00",
        location: "",
    };
    export let onDeleteTemplate: (id: string) => void;
    export let onAddTemplate: () => void;
    export let onCancelNewTemplate: () => void;
    export let onShowNewTemplate: () => void;
</script>

<div class="space-y-4">
    <SettingsIntroCard
        title="Activity Templates"
        description="Save common activity setups so you can reuse them quickly when planning your week."
    />

    <SettingsSectionCard
        title="Saved templates"
        description="Reuse your most common activity time slots and names."
    >
        {#if templates.length === 0}
            <div
                class="rounded-2xl border border-border/70 bg-background/40 p-4 text-center"
            >
                <p class="text-sm text-muted-foreground">No templates yet</p>
                <p class="mt-1 text-xs text-muted-foreground">
                    Create one by adding an activity with "Save as template".
                </p>
            </div>
        {:else}
            <div class="space-y-3">
                {#each templates as template}
                    <div
                        class="rounded-2xl border border-border/70 bg-background/40 p-4 flex items-center justify-between gap-3"
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
                            {#if template.location}
                                <div
                                    class="text-xs text-muted-foreground truncate"
                                >
                                    {template.location}
                                </div>
                            {/if}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            class="text-destructive hover:bg-destructive/10 shrink-0"
                            on:click={() => onDeleteTemplate(template.id)}
                        >
                            Delete
                        </Button>
                    </div>
                {/each}
            </div>
        {/if}
    </SettingsSectionCard>

    <SettingsSectionCard
        title="Add template"
        description="Create a reusable template with a name and time range."
    >
        {#if showNewTemplate}
            <div
                class="rounded-2xl border border-border/70 bg-background/40 p-4 space-y-3"
            >
                <input
                    type="text"
                    bind:value={newTemplate.name}
                    placeholder="Template name"
                    class="w-full px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm"
                />
                <input
                    type="text"
                    bind:value={newTemplate.location}
                    placeholder="Location (optional)"
                    class="w-full px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm"
                />
                <div class="grid grid-cols-2 gap-2">
                    <input
                        type="time"
                        bind:value={newTemplate.startTime}
                        class="px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm"
                    />
                    <input
                        type="time"
                        bind:value={newTemplate.endTime}
                        class="px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm"
                    />
                </div>
                <div class="flex gap-2">
                    <Button
                        variant="default"
                        class="flex-1"
                        disabled={!newTemplate.name.trim()}
                        on:click={onAddTemplate}
                    >
                        Save template
                    </Button>
                    <Button
                        variant="secondary"
                        class="flex-1"
                        on:click={onCancelNewTemplate}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        {:else}
            <Button
                variant="secondary"
                class="w-full sm:w-auto"
                on:click={onShowNewTemplate}
            >
                Add template
            </Button>
        {/if}
    </SettingsSectionCard>
</div>
