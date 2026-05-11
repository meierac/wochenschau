<script lang="ts">
    import Button from "../../Button.svelte";
    import { bibleVerse } from "../../../stores/bibleVerse";
    import SettingsIntroCard from "../SettingsIntroCard.svelte";
    import SettingsSectionCard from "../SettingsSectionCard.svelte";

    export let toggleId = "enableBibleVerse";
</script>

<div class="space-y-4">
    <SettingsIntroCard
        title="Bible Verse of the Day"
        description="Add a daily verse to your export for a small moment of inspiration."
    />

    <SettingsSectionCard
        title="Display"
        description="Choose whether the verse should be shown in exported images."
    >
        <div
            class="rounded-2xl border border-border/70 bg-background/40 p-4 space-y-3"
        >
            <div class="flex items-center justify-between gap-3">
                <label
                    for={toggleId}
                    class="text-sm font-medium text-foreground cursor-pointer"
                >
                    Show Bible verse on export
                </label>
                <input
                    type="checkbox"
                    id={toggleId}
                    checked={$bibleVerse.enabled}
                    on:change={(e) =>
                        bibleVerse.toggleEnabled(e.currentTarget.checked)}
                    class="w-4 h-4 rounded border-input"
                />
            </div>
        </div>
    </SettingsSectionCard>

    {#if $bibleVerse.enabled}
        <SettingsSectionCard
            title="Current verse"
            description="Preview the verse that will be used in the export."
        >
            <div
                class="rounded-2xl border border-border/70 bg-background/40 p-4 space-y-3"
            >
                <p class="text-sm italic text-foreground">
                    "{$bibleVerse.currentVerse.text}"
                </p>
                <p class="text-xs text-muted-foreground text-right">
                    – {$bibleVerse.currentVerse.reference}
                </p>
            </div>

            <div class="mt-4">
                <Button
                    variant="secondary"
                    class="w-full sm:w-auto"
                    on:click={() => bibleVerse.refreshVerse()}
                >
                    <svg
                        class="w-4 h-4 inline-block mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        /></svg
                    >
                    Get new verse
                </Button>
            </div>
        </SettingsSectionCard>
    {/if}
</div>
