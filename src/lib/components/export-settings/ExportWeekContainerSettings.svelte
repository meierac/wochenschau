<script lang="ts">
    import { exportSettings } from "../../stores/exportSettings";
    import ColorField from "./ColorField.svelte";
    import SliderField from "./SliderField.svelte";
    import type { WeekContainerFieldIds } from "./types";

    export let fieldIds: WeekContainerFieldIds;

    export let sectionClass = "space-y-4";
    export let labelClass =
        "block text-xs font-medium text-muted-foreground mb-2";
    export let colorInputClass =
        "w-12 h-10 rounded border border-input cursor-pointer";
    export let monoInputClass =
        "flex-1 px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm font-mono";
</script>

<section class={sectionClass} aria-labelledby="export-settings-week-container">
    <h4
        id="export-settings-week-container"
        class="text-sm font-semibold text-foreground"
    >
        Week Container
    </h4>

    <ColorField
        id={fieldIds.weekContainerBackgroundColor}
        label="Background Color"
        bind:value={$exportSettings.weekContainerBackgroundColor}
        placeholder="rgba(255, 255, 255, 0.75)"
        {labelClass}
        {colorInputClass}
        textInputClass={monoInputClass}
    />

    <SliderField
        id={fieldIds.weekContainerBackgroundOpacity}
        label="Background Opacity"
        suffix="%"
        min={0}
        max={100}
        bind:value={$exportSettings.weekContainerBackgroundOpacity}
        {labelClass}
    />
</section>
