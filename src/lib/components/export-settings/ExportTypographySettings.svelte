<script lang="ts">
    import { exportSettings, FONT_FAMILIES } from "../../stores/exportSettings";
    import ColorField from "./ColorField.svelte";
    import FontSelectField from "./FontSelectField.svelte";
    import SliderField from "./SliderField.svelte";
    import type { TypographyFieldIds } from "./types";

    export let fieldIds: TypographyFieldIds;

    export let sectionClass = "space-y-4";
    export let labelClass =
        "block text-xs font-medium text-muted-foreground mb-2";
    export let toggleLabelClass = "text-xs font-medium text-muted-foreground";
    export let colorInputClass =
        "w-12 h-10 rounded border border-input cursor-pointer";
    export let textInputClass =
        "w-full px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm";
    export let monoInputClass =
        "flex-1 px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm font-mono";
    export let selectClass =
        "flex-1 w-full px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm";
    export let fontSelectClass = `${selectClass} font-mono`;
</script>

<section class={sectionClass} aria-labelledby="export-settings-typography">
    <h4
        id="export-settings-typography"
        class="text-sm font-semibold text-foreground"
    >
        Typography
    </h4>

    <div>
        <label for={fieldIds.title} class={labelClass}>Title/Headline</label>
        <input
            id={fieldIds.title}
            type="text"
            bind:value={$exportSettings.title}
            class={textInputClass}
            placeholder="Wochenschau"
        />
    </div>

    <div>
        <SliderField
            id={fieldIds.titleFontSize}
            label="Title Font Size"
            suffix="px"
            min={24}
            max={72}
            step={2}
            bind:value={$exportSettings.titleFontSize}
            {labelClass}
        />

        <SliderField
            id={fieldIds.titleOpacity}
            label="Title Opacity"
            suffix="%"
            min={10}
            max={100}
            step={5}
            bind:value={$exportSettings.titleOpacity}
            {labelClass}
            extraLabelClass="mt-4"
        />

        <div class="mt-4">
            <ColorField
                id={fieldIds.titleColor}
                label="Title Color"
                bind:value={$exportSettings.titleColor}
                placeholder="#000000"
                {labelClass}
                {colorInputClass}
                textInputClass={monoInputClass}
            />
        </div>
    </div>

    <div class="flex items-center justify-between">
        <label for={fieldIds.showWeekNumber} class={toggleLabelClass}>
            Show Week Number (KW)
        </label>
        <input
            id={fieldIds.showWeekNumber}
            type="checkbox"
            bind:checked={$exportSettings.showWeekNumber}
            class="w-4 h-4"
        />
    </div>

    {#if $exportSettings.showWeekNumber}
        <div class="flex items-center justify-between">
            <label
                for={fieldIds.syncWeekNumberWithTitle}
                class={toggleLabelClass}
            >
                Sync Week Number with Title
            </label>
            <input
                id={fieldIds.syncWeekNumberWithTitle}
                type="checkbox"
                bind:checked={$exportSettings.syncWeekNumberWithTitle}
                class="w-4 h-4"
            />
        </div>

        {#if !$exportSettings.syncWeekNumberWithTitle}
            <div>
                <label for={fieldIds.weekNumberLayout} class={labelClass}>
                    Week Number Position
                </label>
                <select
                    id={fieldIds.weekNumberLayout}
                    bind:value={$exportSettings.weekNumberLayout}
                    class={selectClass}
                >
                    <option value="separate-line">Separate line</option>
                    <option value="inline">Inline with title</option>
                </select>
            </div>

            <FontSelectField
                id={fieldIds.weekNumberFont}
                label="Week Number Font"
                bind:value={$exportSettings.weekNumberFontFamily}
                options={FONT_FAMILIES}
                {labelClass}
                selectClass={fontSelectClass}
            />

            <SliderField
                id={fieldIds.weekNumberFontSize}
                label="Week Number Font Size"
                suffix="px"
                min={12}
                max={48}
                step={1}
                bind:value={$exportSettings.weekNumberFontSize}
                {labelClass}
            />

            <ColorField
                id={fieldIds.weekNumberColor}
                label="Week Number Color"
                bind:value={$exportSettings.weekNumberColor}
                placeholder="#ffffff"
                {labelClass}
                {colorInputClass}
                textInputClass={monoInputClass}
            />

            <SliderField
                id={fieldIds.weekNumberOpacity}
                label="Week Number Opacity"
                suffix="%"
                min={0}
                max={100}
                step={1}
                bind:value={$exportSettings.weekNumberOpacity}
                {labelClass}
            />
        {/if}
    {/if}

    <FontSelectField
        id={fieldIds.headerFont}
        label="Header Font (Wochenschau)"
        bind:value={$exportSettings.headerFontFamily}
        options={FONT_FAMILIES}
        {labelClass}
        selectClass={fontSelectClass}
    />

    <FontSelectField
        id={fieldIds.bodyFont}
        label="Body Font (Activities)"
        bind:value={$exportSettings.bodyFontFamily}
        options={FONT_FAMILIES}
        {labelClass}
        selectClass={fontSelectClass}
    />

    <ColorField
        id={fieldIds.textColor}
        label="Text Color"
        bind:value={$exportSettings.textColor}
        placeholder="#000000"
        {labelClass}
        {colorInputClass}
        textInputClass={monoInputClass}
    />
</section>
