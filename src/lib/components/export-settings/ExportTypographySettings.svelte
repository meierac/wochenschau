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

    <div
        class="space-y-4 rounded-2xl border border-border/70 bg-background/40 p-4"
    >
        <div class="space-y-1">
            <p
                class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
            >
                Title
            </p>
            <p class="text-[11px] leading-relaxed text-muted-foreground">
                This title appears at the top of the exported week.
            </p>
        </div>

        <div>
            <label for={fieldIds.title} class={labelClass}>Header title</label>
            <input
                id={fieldIds.title}
                type="text"
                bind:value={$exportSettings.title}
                class={textInputClass}
                placeholder="Wochenschau"
            />
        </div>

        <div>
            <FontSelectField
                id={fieldIds.headerFont}
                label="Header font"
                bind:value={$exportSettings.headerFontFamily}
                options={FONT_FAMILIES}
                {labelClass}
                selectClass={fontSelectClass}
            />

            <div class="mt-4">
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
            </div>

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

        <!-- Drop Shadow Settings -->
        <div class="space-y-4 pt-4 border-t border-border/50">
            <div class="flex items-center justify-between">
                <label for={fieldIds.titleDropShadowEnabled} class={toggleLabelClass}>
                    Enable drop shadow
                </label>
                <input
                    id={fieldIds.titleDropShadowEnabled}
                    type="checkbox"
                    bind:checked={$exportSettings.titleDropShadowEnabled}
                    class="w-4 h-4"
                />
            </div>

            {#if $exportSettings.titleDropShadowEnabled}
                <div>
                    <ColorField
                        id={fieldIds.titleDropShadowColor}
                        label="Drop shadow color"
                        bind:value={$exportSettings.titleDropShadowColor}
                        placeholder="#000000"
                        {labelClass}
                        {colorInputClass}
                        textInputClass={monoInputClass}
                    />
                </div>

                <SliderField
                    id={fieldIds.titleDropShadowOffsetX}
                    label="Shadow X offset"
                    suffix="px"
                    min={-10}
                    max={10}
                    step={1}
                    bind:value={$exportSettings.titleDropShadowOffsetX}
                    {labelClass}
                />

                <SliderField
                    id={fieldIds.titleDropShadowOffsetY}
                    label="Shadow Y offset"
                    suffix="px"
                    min={-10}
                    max={10}
                    step={1}
                    bind:value={$exportSettings.titleDropShadowOffsetY}
                    {labelClass}
                />
            {/if}
        </div>
    </div>

    <div
        class="space-y-4 rounded-2xl border border-border/70 bg-background/40 p-4"
    >
        <div class="space-y-1">
            <p
                class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
            >
                Calendar week
            </p>
            <p class="text-[11px] leading-relaxed text-muted-foreground">
                Show the calendar week separately or merge it into the title
                styling.
            </p>
        </div>

        <div class="flex items-center justify-between">
            <label for={fieldIds.showWeekNumber} class={toggleLabelClass}>
                Show calendar week
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
                    Sync calendar week with title
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

                <!-- Week Number Drop Shadow Settings -->
                <div class="space-y-4 pt-4 border-t border-border/50">
                    <div class="flex items-center justify-between">
                        <label for={fieldIds.weekNumberDropShadowEnabled} class={toggleLabelClass}>
                            Enable drop shadow
                        </label>
                        <input
                            id={fieldIds.weekNumberDropShadowEnabled}
                            type="checkbox"
                            bind:checked={$exportSettings.weekNumberDropShadowEnabled}
                            class="w-4 h-4"
                        />
                    </div>

                    {#if $exportSettings.weekNumberDropShadowEnabled}
                        <div>
                            <ColorField
                                id={fieldIds.weekNumberDropShadowColor}
                                label="Drop shadow color"
                                bind:value={$exportSettings.weekNumberDropShadowColor}
                                placeholder="#000000"
                                {labelClass}
                                {colorInputClass}
                                textInputClass={monoInputClass}
                            />
                        </div>

                        <SliderField
                            id={fieldIds.weekNumberDropShadowOffsetX}
                            label="Shadow X offset"
                            suffix="px"
                            min={-10}
                            max={10}
                            step={1}
                            bind:value={$exportSettings.weekNumberDropShadowOffsetX}
                            {labelClass}
                        />

                        <SliderField
                            id={fieldIds.weekNumberDropShadowOffsetY}
                            label="Shadow Y offset"
                            suffix="px"
                            min={-10}
                            max={10}
                            step={1}
                            bind:value={$exportSettings.weekNumberDropShadowOffsetY}
                            {labelClass}
                        />
                    {/if}
                </div>
            {/if}

            {#if $exportSettings.syncWeekNumberWithTitle}
                <div
                    class="rounded-2xl border border-border bg-muted/30 px-3 py-2"
                >
                    <p
                        class="text-[11px] leading-relaxed text-muted-foreground"
                    >
                        The calendar week inherits the title styling and is
                        rendered inline as part of the title.
                    </p>
                </div>
            {/if}
        {/if}
    </div>

    <div
        class="space-y-4 rounded-2xl border border-border/70 bg-background/40 p-4"
    >
        <div class="space-y-1">
            <p
                class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
            >
                Fonts & text
            </p>
            <p class="text-[11px] leading-relaxed text-muted-foreground">
                These settings affect the header lettering and the main activity
                text.
            </p>
        </div>

        <FontSelectField
            id={fieldIds.bodyFont}
            label="Activity text font"
            bind:value={$exportSettings.bodyFontFamily}
            options={FONT_FAMILIES}
            {labelClass}
            selectClass={fontSelectClass}
        />

        <ColorField
            id={fieldIds.textColor}
            label="Main text color"
            bind:value={$exportSettings.textColor}
            placeholder="#000000"
            {labelClass}
            {colorInputClass}
            textInputClass={monoInputClass}
        />
    </div>
</section>
