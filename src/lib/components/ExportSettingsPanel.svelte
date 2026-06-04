<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import Button from "./Button.svelte";
    import ExportBackgroundSettings from "./export-settings/ExportBackgroundSettings.svelte";
    import ExportStylingSettings from "./export-settings/ExportStylingSettings.svelte";
    import ExportTypographySettings from "./export-settings/ExportTypographySettings.svelte";
    import ExportWeekContainerSettings from "./export-settings/ExportWeekContainerSettings.svelte";
    import type { FieldIdMap, PanelVariant } from "./export-settings/types";

    export let variant: PanelVariant = "desktop";

    const dispatch = createEventDispatcher<{ reset: void }>();

    const fieldIdsByVariant: Record<PanelVariant, FieldIdMap> = {
        mobile: {
            title: "title-export",
            titleFontSize: "title-font-size-export",
            titleOpacity: "title-opacity-export",
            titleColor: "title-color-export",
            titleDropShadowEnabled: "title-drop-shadow-enabled-export",
            titleDropShadowColor: "title-drop-shadow-color-export",
            titleDropShadowOffsetX: "title-drop-shadow-offset-x-export",
            titleDropShadowOffsetY: "title-drop-shadow-offset-y-export",
            showWeekNumber: "show-week-number-export",
            weekNumberLayout: "week-number-layout-export",
            syncWeekNumberWithTitle: "sync-week-number-title-export",
            weekNumberFont: "week-number-font-export",
            weekNumberFontSize: "week-number-font-size-export",
            weekNumberColor: "week-number-color-export",
            weekNumberOpacity: "week-number-opacity-export",
            weekNumberDropShadowEnabled: "week-number-drop-shadow-enabled-export",
            weekNumberDropShadowColor: "week-number-drop-shadow-color-export",
            weekNumberDropShadowOffsetX: "week-number-drop-shadow-offset-x-export",
            weekNumberDropShadowOffsetY: "week-number-drop-shadow-offset-y-export",
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
            titleDropShadowEnabled: "title-drop-shadow-enabled-export-desktop",
            titleDropShadowColor: "title-drop-shadow-color-export-desktop",
            titleDropShadowOffsetX: "title-drop-shadow-offset-x-export-desktop",
            titleDropShadowOffsetY: "title-drop-shadow-offset-y-export-desktop",
            showWeekNumber: "show-week-number-export-desktop",
            weekNumberLayout: "week-number-layout-export-desktop",
            syncWeekNumberWithTitle: "sync-week-number-title-export-desktop",
            weekNumberFont: "week-number-font-export-desktop",
            weekNumberFontSize: "week-number-font-size-export-desktop",
            weekNumberColor: "week-number-color-export-desktop",
            weekNumberOpacity: "week-number-opacity-export-desktop",
            weekNumberDropShadowEnabled: "week-number-drop-shadow-enabled-export-desktop",
            weekNumberDropShadowColor: "week-number-drop-shadow-color-export-desktop",
            weekNumberDropShadowOffsetX: "week-number-drop-shadow-offset-x-export-desktop",
            weekNumberDropShadowOffsetY: "week-number-drop-shadow-offset-y-export-desktop",
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
    };

    const sectionClass = "space-y-4";
    const labelClass = "block text-xs font-medium text-muted-foreground mb-2";
    const toggleLabelClass = "text-xs font-medium text-muted-foreground";
    const colorInputClass =
        "w-12 h-10 rounded border border-input cursor-pointer";
    const textInputClass =
        "w-full px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm";
    const monoInputClass =
        "flex-1 px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm font-mono";
    const selectClass =
        "flex-1 w-full px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm";
    const fontSelectClass = `${selectClass} font-mono`;

    $: fieldIds = fieldIdsByVariant[variant];

    function handleReset() {
        dispatch("reset");
    }
</script>

<div class="space-y-4">
    <div class="rounded-3xl border border-border bg-muted/20 p-4">
        <div class="space-y-1">
            <h4 class="text-sm font-semibold text-foreground">
                Export appearance
            </h4>
            <p class="text-xs text-muted-foreground leading-relaxed">
                Adjust how your exported week looks. Start with the header, then
                fine-tune text, background, and activity card styling.
            </p>
        </div>
    </div>

    <section class="rounded-3xl border border-border bg-card/60 p-4 sm:p-5">
        <div class="mb-4 space-y-1">
            <h4 class="text-sm font-semibold text-foreground">Header</h4>
            <p class="text-xs text-muted-foreground leading-relaxed">
                Control the export title and calendar week display.
            </p>
        </div>

        <ExportTypographySettings
            {fieldIds}
            {sectionClass}
            {labelClass}
            {toggleLabelClass}
            {colorInputClass}
            {textInputClass}
            {monoInputClass}
            {selectClass}
            {fontSelectClass}
        />
    </section>

    <section class="rounded-3xl border border-border bg-card/60 p-4 sm:p-5">
        <div class="mb-4 space-y-1">
            <h4 class="text-sm font-semibold text-foreground">Background</h4>
            <p class="text-xs text-muted-foreground leading-relaxed">
                Choose a solid color or image background for the full export.
            </p>
        </div>

        <ExportBackgroundSettings
            fieldIds={{
                backgroundColor: fieldIds.backgroundColor,
                backgroundOpacity: fieldIds.backgroundOpacity,
            }}
            {sectionClass}
            {labelClass}
            {colorInputClass}
            {monoInputClass}
        />
    </section>

    <section class="rounded-3xl border border-border bg-card/60 p-4 sm:p-5">
        <div class="mb-4 space-y-1">
            <h4 class="text-sm font-semibold text-foreground">
                Activity cards
            </h4>
            <p class="text-xs text-muted-foreground leading-relaxed">
                Style borders and corner radius for the activity blocks.
            </p>
        </div>

        <ExportStylingSettings
            fieldIds={{
                accentColor: fieldIds.accentColor,
                borderRadius: fieldIds.borderRadius,
                showBorders: fieldIds.showBorders,
            }}
            {sectionClass}
            {labelClass}
            {colorInputClass}
            {monoInputClass}
        />
    </section>

    <section class="rounded-3xl border border-border bg-card/60 p-4 sm:p-5">
        <div class="mb-4 space-y-1">
            <h4 class="text-sm font-semibold text-foreground">
                Day column background
            </h4>
            <p class="text-xs text-muted-foreground leading-relaxed">
                Adjust the background behind each day column or list section.
            </p>
        </div>

        <ExportWeekContainerSettings
            fieldIds={{
                weekContainerBackgroundColor:
                    fieldIds.weekContainerBackgroundColor,
                weekContainerBackgroundOpacity:
                    fieldIds.weekContainerBackgroundOpacity,
            }}
            {sectionClass}
            {labelClass}
            {colorInputClass}
            {monoInputClass}
        />
    </section>

    <div class="pt-2 border-t border-border flex justify-start">
        <Button variant="secondary" size="sm" on:click={handleReset}>
            Reset to Defaults
        </Button>
    </div>
</div>
