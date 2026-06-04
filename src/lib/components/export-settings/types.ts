export type PanelVariant = "mobile" | "desktop";

export type FieldIdMap = {
  title: string;
  titleFontSize: string;
  titleOpacity: string;
  titleColor: string;
  titleDropShadowEnabled: string;
  titleDropShadowColor: string;
  titleDropShadowOffsetX: string;
  titleDropShadowOffsetY: string;
  showWeekNumber: string;
  weekNumberLayout: string;
  syncWeekNumberWithTitle: string;
  weekNumberFont: string;
  weekNumberFontSize: string;
  weekNumberColor: string;
  weekNumberOpacity: string;
  weekNumberDropShadowEnabled: string;
  weekNumberDropShadowColor: string;
  weekNumberDropShadowOffsetX: string;
  weekNumberDropShadowOffsetY: string;
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
  | "titleDropShadowEnabled"
  | "titleDropShadowColor"
  | "titleDropShadowOffsetX"
  | "titleDropShadowOffsetY"
  | "showWeekNumber"
  | "weekNumberLayout"
  | "syncWeekNumberWithTitle"
  | "weekNumberFont"
  | "weekNumberFontSize"
  | "weekNumberColor"
  | "weekNumberOpacity"
  | "weekNumberDropShadowEnabled"
  | "weekNumberDropShadowColor"
  | "weekNumberDropShadowOffsetX"
  | "weekNumberDropShadowOffsetY"
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
