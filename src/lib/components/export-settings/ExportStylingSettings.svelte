<script lang="ts">
    import { exportSettings } from "../../stores/exportSettings";
    import ColorField from "./ColorField.svelte";
    import SliderField from "./SliderField.svelte";
    import type { StylingFieldIds } from "./types";

    export let fieldIds: StylingFieldIds;

    export let sectionClass = "space-y-4";
    export let labelClass =
        "block text-xs font-medium text-muted-foreground mb-2";
    export let colorInputClass =
        "w-12 h-10 rounded border border-input cursor-pointer";
    export let monoInputClass =
        "flex-1 px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm font-mono";
</script>

<section class={sectionClass} aria-labelledby="export-settings-styling">
    <h4
        id="export-settings-styling"
        class="text-sm font-semibold text-foreground"
    >
        Styling
    </h4>

    <ColorField
        id={fieldIds.accentColor}
        label="Accent Color (Borders)"
        bind:value={$exportSettings.accentColor}
        placeholder="#9333ea"
        {labelClass}
        {colorInputClass}
        textInputClass={monoInputClass}
    />

    <SliderField
        id={fieldIds.borderRadius}
        label="Border Radius"
        suffix="px"
        min={0}
        max={20}
        bind:value={$exportSettings.borderRadius}
        {labelClass}
    />

    <div class="flex items-center gap-2">
        <input
            id={fieldIds.showBorders}
            type="checkbox"
            bind:checked={$exportSettings.showBorders}
            class="w-4 h-4 rounded border-input"
        />
        <label
            for={fieldIds.showBorders}
            class="text-xs font-medium text-muted-foreground cursor-pointer"
        >
            Show borders around activities
        </label>
    </div>
</section>
