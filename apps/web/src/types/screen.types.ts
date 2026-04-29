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
  transitionDurationMs?: number;
};

export type WidgetType = "WEATHER_CURRENT";

export type TemplateWidget = {
  id: number;
  type: WidgetType;
  x: number;
  y: number;
  w: number;
  h: number;
  startMs: number | null;
  endMs: number | null;
  config: Record<string, unknown>;
};
