import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CalendarDays, MonitorPlay, Eye, Save, Copy, Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SortableMediaCard } from "./SortableMediaCard";
import { MediaPlaceholder } from "./MediaPlaceholder";
import { PreviewDialog } from "./PreviewDialog";
import type { ScreenRow, ScreenItem, TransitionType, TemplateWidget, WidgetPosition } from "@/types/screen.types";
import type { LocalItem, PendingItem } from "@/hooks/useMediaDialog";
import { isPendingItem } from "@/hooks/useMediaDialog";
import type { DragEndEvent } from "@dnd-kit/core";
import { localItemsToPreview } from "@/lib/preview-items";

const TRANSITIONS: TransitionType[] = ["NONE", "FADE", "SLIDE_LEFT", "SLIDE_UP"];
const POSITIONS: WidgetPosition[] = ["TOP_LEFT", "TOP_RIGHT", "BOTTOM_LEFT", "BOTTOM_RIGHT"];

function PendingMediaCard({
  item,
  onUpdateDuration,
  onUpdateTransition,
  onDelete,
}: {
  item: PendingItem;
  onUpdateDuration: (id: string, ms: number) => void;
  onUpdateTransition: (id: string, type: TransitionType) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useTranslation();
  const isVideo = item.file.type.startsWith("video/");
  return (
    <div className="relative flex shrink-0 flex-col gap-0 rounded-xl border border-dashed border-border/60 bg-muted/20 overflow-hidden opacity-70 w-48">
      <div className="flex h-36 items-center justify-center overflow-hidden bg-muted/40">
        {isVideo ? (
          <video src={item.previewUrl} className="h-full w-full object-cover" muted />
        ) : (
          <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="flex flex-col gap-1.5 bg-card/80 p-2">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-[10px] font-medium">ms</span>
          <input
            type="number"
            min={100}
            step={500}
            value={item.durationMs}
            onChange={(e) => onUpdateDuration(item.localId, Number(e.target.value))}
            className="h-6 flex-1 rounded-lg border border-border/60 bg-transparent px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <select
          value={item.transitionType ?? "NONE"}
          onChange={(e) => onUpdateTransition(item.localId, e.target.value as TransitionType)}
          className="h-6 w-full rounded-lg border border-border/60 bg-transparent px-1.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {TRANSITIONS.map((tr) => (
            <option key={tr} value={tr}>{t(`transitions.${tr}`)}</option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={() => onDelete(item.localId)}
        className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-destructive/80 text-destructive-foreground text-xs hover:bg-destructive"
      >
        ✕
      </button>
    </div>
  );
}

type GeoResult = { name: string; latitude: number; longitude: number; country: string };

function WidgetsBar({
  widgets,
  onAdd,
  onRemove,
}: {
  widgets: TemplateWidget[];
  onAdd: (w: Omit<TemplateWidget, "id">) => Promise<void>;
  onRemove: (id: number) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const [geoResults, setGeoResults] = useState<GeoResult[]>([]);
  const [selectedCity, setSelectedCity] = useState<GeoResult | null>(null);
  const [position, setPosition] = useState<WidgetPosition>("TOP_RIGHT");
  const [units, setUnits] = useState<"celsius" | "fahrenheit">("celsius");
  const [saving, setSaving] = useState(false);

  async function searchCity(q: string) {
    setCityQuery(q);
    setSelectedCity(null);
    if (q.length < 2) { setGeoResults([]); return; }
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=fr&format=json`);
      const json = (await res.json()) as { results?: GeoResult[] };
      setGeoResults(json.results ?? []);
    } catch {
      setGeoResults([]);
    }
  }

  async function confirmAdd() {
    if (!selectedCity) return;
    setSaving(true);
    try {
      await onAdd({
        type: "WEATHER_CURRENT",
        position,
        config: { lat: selectedCity.latitude, lon: selectedCity.longitude, city: selectedCity.name, units },
      });
      setAdding(false);
      setCityQuery("");
      setGeoResults([]);
      setSelectedCity(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="shrink-0 border-t border-border/40 bg-muted/10 px-8 py-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold text-muted-foreground">{t("templateWidgets.title")}</span>
        {widgets.map((w) => (
          <div key={w.id} className="flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs">
            <span>🌤 {(w.config as { city?: string }).city ?? t(`templateWidgets.${w.type}`)}</span>
            <span className="text-[10px] text-muted-foreground">·</span>
            <span className="text-[10px] text-muted-foreground">{t(`templateWidgets.${w.position}`)}</span>
            <button
              type="button"
              className="ml-1 flex size-4 items-center justify-center rounded-full text-muted-foreground hover:text-destructive"
              onClick={() => void onRemove(w.id)}
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 rounded-full border border-dashed border-border/60 px-2.5 py-1 text-xs text-muted-foreground hover:border-border hover:text-foreground transition-colors"
          >
            <Plus className="size-3" />
            {t("templateWidgets.add")}
          </button>
        )}
      </div>

      {adding && (
        <div className="mt-2.5 flex flex-wrap items-end gap-2 rounded-xl border border-border/60 bg-muted/20 p-3">
          <div className="flex flex-col gap-1 min-w-[180px]">
            <span className="text-[10px] text-muted-foreground">{t("templateWidgets.city")}</span>
            <div className="relative">
              <Input
                value={cityQuery}
                onChange={(e) => void searchCity(e.target.value)}
                placeholder={t("templateWidgets.cityPlaceholder")}
                className="h-7 rounded-lg text-xs"
              />
              {geoResults.length > 0 && (
                <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-lg border border-border/60 bg-popover shadow-lg">
                  {geoResults.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      className="w-full px-3 py-1.5 text-left text-xs hover:bg-muted/60 first:rounded-t-lg last:rounded-b-lg"
                      onClick={() => { setSelectedCity(r); setCityQuery(`${r.name}, ${r.country}`); setGeoResults([]); }}
                    >
                      {r.name}, {r.country}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground">{t("templateWidgets.position")}</span>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as WidgetPosition)}
              className="h-7 rounded-lg border border-border/60 bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {POSITIONS.map((p) => (
                <option key={p} value={p}>{t(`templateWidgets.${p}`)}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground">{t("templateWidgets.units")}</span>
            <select
              value={units}
              onChange={(e) => setUnits(e.target.value as "celsius" | "fahrenheit")}
              className="h-7 rounded-lg border border-border/60 bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="celsius">{t("templateWidgets.celsius")}</option>
              <option value="fahrenheit">{t("templateWidgets.fahrenheit")}</option>
            </select>
          </div>

          <div className="flex gap-1.5">
            <Button
              type="button"
              size="sm"
              className="h-7 rounded-full px-3 text-xs"
              disabled={!selectedCity || saving}
              onClick={() => void confirmAdd()}
            >
              {saving ? <Loader2 className="size-3 animate-spin" /> : t("dashboard.add")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 rounded-full px-3 text-xs"
              onClick={() => { setAdding(false); setGeoResults([]); setCityQuery(""); setSelectedCity(null); }}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function MediaDialog({
  screen,
  items,
  itemIds,
  fileInputRef,
  editedName,
  hasChanges,
  saving,
  onClose,
  onDragEnd,
  onDeleteItem,
  onUpdateDuration,
  onUpdateTransition,
  onUploadFiles,
  onEditName,
  onSave,
  onCopyUrl,
  onChangeMode,
  widgets,
  onAddWidget,
  onRemoveWidget,
  isTemplate = false,
}: {
  screen: ScreenRow | null;
  items: LocalItem[];
  itemIds: string[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  editedName: string;
  hasChanges: boolean;
  saving: boolean;
  onClose: () => void;
  onDragEnd: (e: DragEndEvent) => void;
  onDeleteItem: (id: number | string) => void;
  onUpdateDuration: (id: number | string, ms: number) => void;
  onUpdateTransition?: (id: number | string, type: TransitionType) => void;
  onUploadFiles: (files: FileList | File[]) => void;
  onEditName: (name: string) => void;
  onSave: () => void;
  onCopyUrl: (token: string) => void;
  onChangeMode?: (mode: "QUICK" | "TEMPLATE") => void;
  widgets?: TemplateWidget[];
  onAddWidget?: (w: Omit<TemplateWidget, "id">) => Promise<void>;
  onRemoveWidget?: (id: number) => Promise<void>;
  isTemplate?: boolean;
}) {
  const { t } = useTranslation();
  const [previewOpen, setPreviewOpen] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const mediaUrlBase = isTemplate && screen
    ? `/api/public/templates/${screen.id}/media`
    : undefined;

  const previewItems = screen
    ? localItemsToPreview(items, isTemplate ? { templateId: screen.id } : { screenToken: screen.publicToken })
    : [];

  return (
    <>
      <Dialog open={!!screen} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="flex h-[85vh] w-[95vw] max-w-[95vw] flex-col gap-0 overflow-hidden rounded-2xl border-border/60 p-0 shadow-xl md:w-[80vw] md:max-w-[80vw]">
          <DialogHeader className="shrink-0 border-b border-border/40 px-6 py-3">
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="text-base font-semibold">
                {t("screens.dialogTitle")}
              </DialogTitle>
              {onChangeMode && (
                <div className="flex overflow-hidden rounded-lg border border-border/60 text-xs">
                  <button
                    type="button"
                    onClick={() => onChangeMode("QUICK")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground font-medium"
                  >
                    <MonitorPlay className="size-3.5" />
                    {t("screens.modeQuick")}
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeMode("TEMPLATE")}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-muted-foreground hover:bg-muted/60 transition-colors"
                  >
                    <CalendarDays className="size-3.5" />
                    {t("screens.modeTemplate")}
                  </button>
                </div>
              )}
            </div>
          </DialogHeader>

          {screen && (
            <div className="flex min-h-0 flex-1 flex-col">
              {/* Name + copy URL bar */}
              <div className="flex flex-wrap items-center gap-3 border-b border-border/40 px-8 py-4">
                <div className="flex flex-1 items-center gap-0 overflow-hidden rounded-xl border border-border/60 bg-muted/30 transition-shadow focus-within:ring-2 focus-within:ring-ring/30">
                  <Input
                    value={editedName}
                    className="h-10 flex-1 border-0 bg-transparent px-4 shadow-none focus-visible:ring-0"
                    onChange={(e) => onEditName(e.target.value)}
                  />
                  {!isTemplate && (
                    <button
                      type="button"
                      className="flex h-10 shrink-0 items-center gap-1.5 border-l border-border/40 bg-muted/40 px-4 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      onClick={() => onCopyUrl(screen.publicToken)}
                    >
                      <Copy className="size-3.5" />
                      <span className="hidden sm:inline">{t("screens.copyUrl")}</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,video/*,.gif"
                  multiple
                  onChange={(e) => {
                    if (e.target.files?.length) onUploadFiles(e.target.files);
                  }}
                />
              </div>

              {/* Media grid */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(ev) => void onDragEnd(ev)}
              >
                <SortableContext items={itemIds} strategy={horizontalListSortingStrategy}>
                  <div className="no-scrollbar flex min-h-0 flex-1 items-start gap-3 overflow-x-auto overflow-y-hidden bg-muted/5 px-8 py-4">
                    {items.map((it) =>
                      isPendingItem(it) ? (
                        <PendingMediaCard
                          key={it.localId}
                          item={it}
                          onUpdateDuration={(id, ms) => onUpdateDuration(id, ms)}
                          onUpdateTransition={(id, type) => onUpdateTransition?.(id, type)}
                          onDelete={(id) => onDeleteItem(id)}
                        />
                      ) : (
                        <SortableMediaCard
                          key={it.id}
                          item={it as ScreenItem}
                          token={screen.publicToken}
                          mediaUrlBase={mediaUrlBase}
                          onUpdateDuration={(id, ms) => void onUpdateDuration(id, ms)}
                          onUpdateTransition={(id, type) => onUpdateTransition?.(id, type)}
                          onDelete={(id) => void onDeleteItem(id)}
                        />
                      )
                    )}
                    <MediaPlaceholder
                      onFileSelect={() => fileInputRef.current?.click()}
                      onFileDrop={(files) => void onUploadFiles(files)}
                    />
                  </div>
                </SortableContext>
              </DndContext>

              {/* Widgets bar (template only) */}
              {isTemplate && widgets && onAddWidget && onRemoveWidget && (
                <WidgetsBar
                  widgets={widgets}
                  onAdd={onAddWidget}
                  onRemove={onRemoveWidget}
                />
              )}

              {/* Footer */}
              <div className="flex shrink-0 items-center justify-between border-t border-border/40 bg-muted/20 px-8 py-3.5">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 gap-2 rounded-full px-5 text-sm font-medium"
                  onClick={() => setPreviewOpen(true)}
                >
                  <Eye className="size-4" />
                  {t("screens.preview")}
                </Button>
                <Button
                  type="button"
                  className="h-10 gap-2 rounded-full px-6 text-sm font-medium"
                  disabled={!hasChanges || saving}
                  onClick={() => void onSave()}
                >
                  <Save className="size-4" />
                  {saving ? t("common.loading") : t("accounts.save")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        items={previewItems}
        widgets={widgets}
        title={editedName}
      />
    </>
  );
}
