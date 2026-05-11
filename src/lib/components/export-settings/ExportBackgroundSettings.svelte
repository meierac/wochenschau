<script lang="ts">
    import { exportSettings } from "../../stores/exportSettings";
    import DefaultBackgroundSelector from "../DefaultBackgroundSelector.svelte";
    import ColorField from "./ColorField.svelte";
    import SliderField from "./SliderField.svelte";
    import type { BackgroundFieldIds } from "./types";

    export let fieldIds: BackgroundFieldIds;

    export let sectionClass = "space-y-4";
    export let labelClass =
        "block text-xs font-medium text-muted-foreground mb-2";
    export let colorInputClass =
        "w-12 h-10 rounded border border-input cursor-pointer";
    export let monoInputClass =
        "flex-1 px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm font-mono";
</script>

<section class={sectionClass} aria-labelledby="export-settings-background">
    <h4
        id="export-settings-background"
        class="text-sm font-semibold text-foreground"
    >
        Background
    </h4>

    <DefaultBackgroundSelector />

    {#if $exportSettings.backgroundMode === "color"}
        <ColorField
            id={fieldIds.backgroundColor}
            label="Background Color"
            bind:value={$exportSettings.backgroundColor}
            placeholder="#ffffff"
            {labelClass}
            {colorInputClass}
            textInputClass={monoInputClass}
        />

        <SliderField
            id={fieldIds.backgroundOpacity}
            label="Background Opacity"
            suffix="%"
            min={0}
            max={100}
            bind:value={$exportSettings.backgroundOpacity}
            {labelClass}
        />
    {/if}
</section>
