export type ScreenRow = {
  id: number;
  folderId: number;
  name: string;
  publicToken: string;
  revision: number;
  sortOrder: number;
  displayMode: "QUICK" | "TEMPLATE";
  slideshowPath: string;
};

export type TransitionType = "NONE" | "FADE" | "SLIDE_LEFT" | "SLIDE_UP";

export type ScreenItem = {
  id: number;
  type: string;
  durationMs: number;
  sortOrder: number;
  mimeType: string;
  transitionType?: TransitionType;
};

export type WidgetPosition = "TOP_LEFT" | "TOP_RIGHT" | "BOTTOM_LEFT" | "BOTTOM_RIGHT";
export type WidgetType = "WEATHER_CURRENT";

export type TemplateWidget = {
  id: number;
  type: WidgetType;
  position: WidgetPosition;
  config: Record<string, unknown>;
};
