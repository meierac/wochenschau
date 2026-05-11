export type PanelVariant = "mobile" | "desktop";

export type FieldIdMap = {
    title: string;
    titleFontSize: string;
    titleOpacity: string;
    titleColor: string;
    showWeekNumber: string;
    weekNumberLayout: string;
    syncWeekNumberWithTitle: string;
    weekNumberFont: string;
    weekNumberFontSize: string;
    weekNumberColor: string;
    weekNumberOpacity: string;
    headerFont: string;
    bodyFont: string;
    textColor: string;
    backgroundColor: string;
    backgroundOpacity: string;
    accentColor: string;
    borderRadius: string;
    showBorders: string;
    weekContainerBackgroundColor: string;
    weekContainerBackgroundOpacity: string;
};

export type TypographyFieldIds = Pick<
    FieldIdMap,
    | "title"
    | "titleFontSize"
    | "titleOpacity"
    | "titleColor"
    | "showWeekNumber"
    | "weekNumberLayout"
    | "syncWeekNumberWithTitle"
    | "weekNumberFont"
    | "weekNumberFontSize"
    | "weekNumberColor"
    | "weekNumberOpacity"
    | "headerFont"
    | "bodyFont"
    | "textColor"
>;

export type BackgroundFieldIds = Pick<
    FieldIdMap,
    "backgroundColor" | "backgroundOpacity"
>;

export type StylingFieldIds = Pick<
    FieldIdMap,
    "accentColor" | "borderRadius" | "showBorders"
>;

export type WeekContainerFieldIds = Pick<
    FieldIdMap,
    "weekContainerBackgroundColor" | "weekContainerBackgroundOpacity"
>;
