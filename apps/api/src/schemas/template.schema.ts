import { z } from "zod";

export const TRANSITION_VALUES = ["NONE", "FADE", "SLIDE_LEFT", "SLIDE_UP"] as const;
export const WIDGET_POSITIONS = ["TOP_LEFT", "TOP_RIGHT", "BOTTOM_LEFT", "BOTTOM_RIGHT"] as const;
export const WIDGET_TYPES = ["WEATHER_CURRENT", "TEXT"] as const;

export type TransitionValue = typeof TRANSITION_VALUES[number];
export type WidgetPosition = typeof WIDGET_POSITIONS[number];
export type WidgetType = typeof WIDGET_TYPES[number];

export const createTemplateFolderSchema = z.object({
  name: z.string().trim().min(1).max(255),
  parentId: z.number().int().positive().nullable().optional(),
  sortOrder: z.number().int().default(0),
});

export const updateTemplateFolderSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  parentId: z.number().int().positive().nullable().optional(),
  sortOrder: z.number().int().optional(),
}).refine((d) => Object.values(d).some((v) => v !== undefined), {
  message: "at least one field required",
});

export const createTemplateSchema = z.object({
  name: z.string().trim().min(1).max(255),
  sortOrder: z.number().int().default(0),
});

export const updateTemplateSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  sortOrder: z.number().int().optional(),
  folderId: z.number().int().positive().optional(),
}).refine((d) => Object.values(d).some((v) => v !== undefined), {
  message: "at least one field required",
});

export const reorderTemplateItemsSchema = z.object({
  orderedIds: z.array(z.number().int().positive()).min(1),
});

export const updateTemplateItemSchema = z.object({
  durationMs: z.number().int().min(0).optional(),
  transitionType: z.enum(TRANSITION_VALUES).optional(),
  transitionDurationMs: z.number().int().min(50).max(5000).optional(),
}).refine((d) => Object.values(d).some((v) => v !== undefined), {
  message: "at least one field required",
});

const geometryFields = {
  x: z.number().min(0).max(1).optional(),
  y: z.number().min(0).max(1).optional(),
  w: z.number().min(0).max(1).optional(),
  h: z.number().min(0).max(1).optional(),
  startMs: z.number().int().nullable().optional(),
  endMs: z.number().int().nullable().optional(),
};

export const createWidgetSchema = z.object({
  type: z.enum(WIDGET_TYPES),
  position: z.enum(WIDGET_POSITIONS).default("TOP_RIGHT"),
  config: z.record(z.string(), z.unknown()).default({}),
  ...geometryFields,
});

export const updateWidgetSchema = z.object({
  position: z.enum(WIDGET_POSITIONS).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  ...geometryFields,
}).refine((d) => Object.values(d).some((v) => v !== undefined), {
  message: "at least one field required",
});

export type CreateTemplateFolderInput = z.infer<typeof createTemplateFolderSchema>;
export type UpdateTemplateFolderInput = z.infer<typeof updateTemplateFolderSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type ReorderTemplateItemsInput = z.infer<typeof reorderTemplateItemsSchema>;
export type UpdateTemplateItemInput = z.infer<typeof updateTemplateItemSchema>;
export type CreateWidgetInput = z.infer<typeof createWidgetSchema>;
export type UpdateWidgetInput = z.infer<typeof updateWidgetSchema>;
