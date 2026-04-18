export type DemoWidget = {
  id: string;
  label: string;
  value: string;
  color: string;
};

export const DEFAULT_WIDGET_IDS = ["w-screens", "w-folders", "w-media"];

export const ALL_WIDGETS: DemoWidget[] = [
  { id: "w-screens", label: "Écrans", value: "12", color: "bg-indigo-100 text-indigo-700" },
  { id: "w-folders", label: "Dossiers", value: "4", color: "bg-emerald-100 text-emerald-700" },
  { id: "w-media", label: "Médias", value: "47", color: "bg-amber-100 text-amber-700" },
  { id: "w-users", label: "Utilisateurs", value: "8", color: "bg-sky-100 text-sky-700" },
  { id: "w-duration", label: "Durée totale", value: "3m 25s", color: "bg-rose-100 text-rose-700" },
];

export type DemoMediaItem = {
  id: string;
  name: string;
  type: "IMAGE" | "VIDEO" | "GIF";
  durationMs: number;
  thumb: string;
};

export const MEDIA_POOL: DemoMediaItem[] = [
  {
    id: "m-1",
    name: "banner.jpg",
    type: "IMAGE",
    durationMs: 5000,
    thumb: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=240&h=160&fit=crop",
  },
  {
    id: "m-2",
    name: "promo.jpg",
    type: "IMAGE",
    durationMs: 3000,
    thumb: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=240&h=160&fit=crop",
  },
  {
    id: "m-3",
    name: "sunset.jpg",
    type: "IMAGE",
    durationMs: 4000,
    thumb: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=240&h=160&fit=crop",
  },
  {
    id: "m-4",
    name: "mountains.jpg",
    type: "IMAGE",
    durationMs: 5000,
    thumb: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=240&h=160&fit=crop",
  },
];

export const INITIAL_MEDIA_IDS = ["m-1", "m-2"];
export const MAX_MEDIA = 3;

export type DemoAccount = {
  id: string;
  username: string;
  role: "ADMIN" | "USER";
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { id: "a-1", username: "admin", role: "ADMIN" },
  { id: "a-2", username: "Alice Durand", role: "USER" },
  { id: "a-3", username: "Bob Martin", role: "USER" },
];
