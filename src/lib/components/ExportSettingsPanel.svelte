<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { exportSettings, FONT_FAMILIES } from "../stores/exportSettings";
    import Button from "./Button.svelte";
    import DefaultBackgroundSelector from "./DefaultBackgroundSelector.svelte";
    import RangeSlider from "./RangeSlider.svelte";

    export let variant: "mobile" | "desktop" = "desktop";

    const dispatch = createEventDispatcher<{ reset: void }>();

    const ids = {
        mobile: {
            title: "title-export",
            titleFontSize: "title-font-size-export",
            titleOpacity: "title-opacity-export",
            titleColor: "title-color-export",
            showWeekNumber: "show-week-number-export",
            weekNumberLayout: "week-number-layout-export",
            syncWeekNumberWithTitle: "sync-week-number-title-export",
            weekNumberFont: "week-number-font-export",
            weekNumberFontSize: "week-number-font-size-export",
            weekNumberColor: "week-number-color-export",
            weekNumberOpacity: "week-number-opacity-export",
            headerFont: "header-font-export",
            bodyFont: "body-font-export",
            textColor: "text-color-export",
            backgroundColor: "bg-color-export-mobile",
            backgroundOpacity: "bg-opacity-export-mobile",
            accentColor: "accent-color-export",
            borderRadius: "border-radius-export",
            showBorders: "show-borders-export-mobile",
            weekContainerBackgroundColor: "week-bg-color-export",
            weekContainerBackgroundOpacity: "week-bg-opacity-export",
        },
        desktop: {
            title: "title-export-desktop",
            titleFontSize: "title-font-size-export-desktop",
            titleOpacity: "title-opacity-export-desktop",
            titleColor: "title-color-export-desktop",
            showWeekNumber: "show-week-number-export-desktop",
            weekNumberLayout: "week-number-layout-export-desktop",
            syncWeekNumberWithTitle: "sync-week-number-title-export-desktop",
            weekNumberFont: "week-number-font-export-desktop",
            weekNumberFontSize: "week-number-font-size-export-desktop",
            weekNumberColor: "week-number-color-export-desktop",
            weekNumberOpacity: "week-number-opacity-export-desktop",
            headerFont: "header-font-list",
            bodyFont: "body-font-list",
            textColor: "text-color-list",
            backgroundColor: "bg-color-export",
            backgroundOpacity: "bg-opacity-list",
            accentColor: "accent-color-list",
            borderRadius: "border-radius-list",
            showBorders: "show-borders-export-desktop",
            weekContainerBackgroundColor: "week-bg-color-list",
            weekContainerBackgroundOpacity: "week-bg-opacity-desktop",
        },
    } as const;

    $: fieldIds = ids[variant];
</script>

<div class="space-y-6">
    <div class="space-y-4">
        <h4 class="text-sm font-semibold text-foreground">Typography</h4>

        <div>
            <label
                for={fieldIds.title}
                class="block text-xs font-medium text-muted-foreground mb-2"
            >
                Title/Headline
            </label>
            <input
                id={fieldIds.title}
                type="text"
                bind:value={$exportSettings.title}
                class="w-full px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm"
                placeholder="Wochenschau"
            />
        </div>

        <div>
            <label
                for={fieldIds.titleFontSize}
                class="block text-xs font-medium text-muted-foreground mb-2"
            >
                Title Font Size: {$exportSettings.titleFontSize}px
            </label>
            <RangeSlider
                id={fieldIds.titleFontSize}
                min={24}
                max={72}
                step={2}
                bind:value={$exportSettings.titleFontSize}
            />
            <label
                for={fieldIds.titleOpacity}
                class="block text-xs font-medium text-muted-foreground mb-2 mt-4"
            >
                Title Opacity: {$exportSettings.titleOpacity}%
            </label>
            <RangeSlider
                id={fieldIds.titleOpacity}
                min={10}
                max={100}
                step={5}
                bind:value={$exportSettings.titleOpacity}
            />

            <div class="mt-4">
                <label
                    for={fieldIds.titleColor}
                    class="block text-xs font-medium text-muted-foreground mb-2"
                >
                    Title Color
                </label>
                <div class="flex gap-2">
                    <input
                        id={fieldIds.titleColor}
                        type="color"
                        bind:value={$exportSettings.titleColor}
                        class="w-12 h-10 rounded border border-input cursor-pointer"
                    />
                    <input
                        type="text"
                        bind:value={$exportSettings.titleColor}
                        class="flex-1 px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm font-mono"
                        placeholder="#000000"
                    />
                </div>
            </div>
        </div>

        <div class="flex items-center justify-between">
            <label
                for={fieldIds.showWeekNumber}
                class="text-xs font-medium text-muted-foreground"
            >
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
            <div>
                <label
                    for={fieldIds.weekNumberLayout}
                    class="block text-xs font-medium text-muted-foreground mb-2"
                >
                    Week Number Position
                </label>
                <select
                    id={fieldIds.weekNumberLayout}
                    bind:value={$exportSettings.weekNumberLayout}
                    class="flex-1 w-full px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm"
                >
                    <option value="separate-line">Separate line</option>
                    <option value="inline">Inline with title</option>
                </select>
            </div>

            <div class="flex items-center justify-between">
                <label
                    for={fieldIds.syncWeekNumberWithTitle}
                    class="text-xs font-medium text-muted-foreground"
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
                    <label
                        for={fieldIds.weekNumberFont}
                        class="block text-xs font-medium text-muted-foreground mb-2"
                    >
                        Week Number Font
                    </label>
                    <select
                        id={fieldIds.weekNumberFont}
                        bind:value={$exportSettings.weekNumberFontFamily}
                        class="flex-1 w-full px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm font-mono"
                        style="font-family: {$exportSettings.weekNumberFontFamily};"
                    >
                        {#each FONT_FAMILIES as font}
                            <option
                                value={font.value}
                                style="font-family: {font.value};"
                            >
                                {font.name}
                            </option>
                        {/each}
                    </select>
                </div>

                <div>
                    <label
                        for={fieldIds.weekNumberFontSize}
                        class="block text-xs font-medium text-muted-foreground mb-2"
                    >
                        Week Number Font Size: {$exportSettings.weekNumberFontSize}px
                    </label>
                    <RangeSlider
                        id={fieldIds.weekNumberFontSize}
                        min={12}
                        max={48}
                        step={1}
                        bind:value={$exportSettings.weekNumberFontSize}
                    />
                </div>
            {/if}

            <div>
                <label
                    for={fieldIds.weekNumberColor}
                    class="block text-xs font-medium text-muted-foreground mb-2"
                >
                    Week Number Color
                </label>
                <div class="flex gap-2">
                    <input
                        id={fieldIds.weekNumberColor}
                        type="color"
                        bind:value={$exportSettings.weekNumberColor}
                        class="w-12 h-10 rounded border border-input cursor-pointer"
                    />
                    <input
                        type="text"
                        bind:value={$exportSettings.weekNumberColor}
                        class="flex-1 px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm font-mono"
                        placeholder="#ffffff"
                    />
                </div>
            </div>

            <div>
                <label
                    for={fieldIds.weekNumberOpacity}
                    class="block text-xs font-medium text-muted-foreground mb-2"
                >
                    Week Number Opacity: {$exportSettings.weekNumberOpacity}%
                </label>
                <RangeSlider
                    id={fieldIds.weekNumberOpacity}
                    min={0}
                    max={100}
                    step={1}
                    bind:value={$exportSettings.weekNumberOpacity}
                />
            </div>
        {/if}

        <div>
            <label
                for={fieldIds.headerFont}
                class="block text-xs font-medium text-muted-foreground mb-2"
            >
                Header Font (Wochenschau)
            </label>
            <select
                id={fieldIds.headerFont}
                bind:value={$exportSettings.headerFontFamily}
                class="flex-1 w-full px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm font-mono"
                style="font-family: {$exportSettings.headerFontFamily};"
            >
                {#each FONT_FAMILIES as font}
                    <option value={font.value} style="font-family: {font.value};">
                        {font.name}
                    </option>
                {/each}
            </select>
        </div>

        <div>
            <label
                for={fieldIds.bodyFont}
                class="block text-xs font-medium text-muted-foreground mb-2"
            >
                Body Font (Activities)
            </label>
            <select
                id={fieldIds.bodyFont}
                bind:value={$exportSettings.bodyFontFamily}
                class="flex-1 w-full px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm font-mono"
                style="font-family: {$exportSettings.bodyFontFamily};"
            >
                {#each FONT_FAMILIES as font}
                    <option value={font.value} style="font-family: {font.value};">
                        {font.name}
                    </option>
                {/each}
            </select>
        </div>

        <div>
            <label
                for={fieldIds.textColor}
                class="block text-xs font-medium text-muted-foreground mb-2"
            >
                Text Color
            </label>
            <div class="flex gap-2">
                <input
                    id={fieldIds.textColor}
                    type="color"
                    bind:value={$exportSettings.textColor}
                    class="w-12 h-10 rounded border border-input cursor-pointer"
                />
                <input
                    type="text"
                    bind:value={$exportSettings.textColor}
                    class="flex-1 px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm font-mono"
                    placeholder="#000000"
                />
            </div>
        </div>
    </div>

    <div class="space-y-4">
        <h4 class="text-sm font-semibold text-foreground">Background</h4>

        <DefaultBackgroundSelector />

        {#if $exportSettings.backgroundMode === "color"}
            <div>
                <label
                    for={fieldIds.backgroundColor}
                    class="block text-xs font-medium text-muted-foreground mb-2"
                >
                    Background Color
                </label>
                <div class="flex gap-2">
                    <input
                        id={fieldIds.backgroundColor}
                        type="color"
                        bind:value={$exportSettings.backgroundColor}
                        class="w-12 h-10 rounded border border-input cursor-pointer"
                    />
                    <input
                        type="text"
                        bind:value={$exportSettings.backgroundColor}
                        class="flex-1 px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm font-mono"
                        placeholder="#ffffff"
                    />
                </div>
            </div>

            <div>
                <label
                    for={fieldIds.backgroundOpacity}
                    class="block text-xs font-medium text-muted-foreground mb-2"
                >
                    Background Opacity: {$exportSettings.backgroundOpacity}%
                </label>
                <RangeSlider
                    id={fieldIds.backgroundOpacity}
                    min={0}
                    max={100}
                    bind:value={$exportSettings.backgroundOpacity}
                />
            </div>
        {/if}
    </div>

    <div class="space-y-4">
        <h4 class="text-sm font-semibold text-foreground">Styling</h4>

        <div>
            <label
                for={fieldIds.accentColor}
                class="block text-xs font-medium text-muted-foreground mb-2"
            >
                Accent Color (Borders)
            </label>
            <div class="flex gap-2">
                <input
                    id={fieldIds.accentColor}
                    type="color"
                    bind:value={$exportSettings.accentColor}
                    class="w-12 h-10 rounded border border-input cursor-pointer"
                />
                <input
                    type="text"
                    bind:value={$exportSettings.accentColor}
                    class="flex-1 px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm font-mono"
                    placeholder="#9333ea"
                />
            </div>
        </div>

        <div>
            <label
                for={fieldIds.borderRadius}
                class="block text-xs font-medium text-muted-foreground mb-2"
            >
                Border Radius: {$exportSettings.borderRadius}px
            </label>
            <RangeSlider
                id={fieldIds.borderRadius}
                min={0}
                max={20}
                bind:value={$exportSettings.borderRadius}
            />
        </div>

        <div class="flex items-center gap-2">
            <input
                type="checkbox"
                id={fieldIds.showBorders}
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
    </div>

    <div class="space-y-4">
        <h4 class="text-sm font-semibold text-foreground">Week Container</h4>

        <div>
            <label
                for={fieldIds.weekContainerBackgroundColor}
                class="block text-xs font-medium text-muted-foreground mb-2"
            >
                Background Color
            </label>
            <div class="flex gap-2">
                <input
                    id={fieldIds.weekContainerBackgroundColor}
                    type="color"
                    bind:value={$exportSettings.weekContainerBackgroundColor}
                    class="w-12 h-10 rounded border border-input cursor-pointer"
                />
                <input
                    type="text"
                    bind:value={$exportSettings.weekContainerBackgroundColor}
                    class="flex-1 px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm font-mono"
                    placeholder="rgba(255, 255, 255, 0.75)"
                />
            </div>
        </div>

        <div>
            <label
                for={fieldIds.weekContainerBackgroundOpacity}
                class="block text-xs font-medium text-muted-foreground mb-2"
            >
                Background Opacity: {$exportSettings.weekContainerBackgroundOpacity}%
            </label>
            <RangeSlider
                id={fieldIds.weekContainerBackgroundOpacity}
                min={0}
                max={100}
                bind:value={$exportSettings.weekContainerBackgroundOpacity}
            />
        </div>
    </div>

    <div class="pt-4 border-t border-border">
        <Button variant="secondary" on:click={() => dispatch("reset")}>
            Reset to Defaults
        </Button>
    </div>
</div>
