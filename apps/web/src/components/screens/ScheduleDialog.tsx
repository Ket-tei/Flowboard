import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays, MonitorPlay, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ScreenRow } from "@/types/screen.types";

type TemplateOption = { id: number; name: string };

type ScheduleSlot = {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  templateId: number;
};

type NewSlotForm = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  templateId: number;
};

const DAY_KEYS = ["schedule.mon", "schedule.tue", "schedule.wed", "schedule.thu", "schedule.fri", "schedule.sat", "schedule.sun"];
const DOW_MAP = [1, 2, 3, 4, 5, 6, 0];

function dayLabel(t: (k: string) => string, dow: number): string {
  const idx = DOW_MAP.indexOf(dow);
  return t(DAY_KEYS[idx >= 0 ? idx : dow] ?? DAY_KEYS[0]);
}

export function ScheduleDialog({
  screen,
  onClose,
  onChangeMode,
}: {
  screen: ScreenRow | null;
  onClose: () => void;
  onChangeMode?: (mode: "QUICK" | "TEMPLATE") => void;
}) {
  const { t } = useTranslation();
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [addingDay, setAddingDay] = useState<number | null>(null);
  const [newSlot, setNewSlot] = useState<NewSlotForm>({ dayOfWeek: 1, startTime: "09:00", endTime: "17:00", templateId: 0 });

  const loadData = useCallback(async (screenId: number) => {
    const [scheduleRes, tplTreeRes] = await Promise.all([
      apiFetch<{ slots: ScheduleSlot[] }>(`/api/screens/${screenId}/schedule`),
      apiFetch<{ tree: Array<{ id: number; name: string; screens: Array<{ id: number; name: string }> }> }>("/api/template-folders/tree"),
    ]);
    setSlots(scheduleRes.slots);
    const tplList: TemplateOption[] = [];
    for (const folder of tplTreeRes.tree) {
      for (const tpl of folder.screens) {
        tplList.push({ id: tpl.id, name: `${folder.name} / ${tpl.name}` });
      }
    }
    setTemplates(tplList);
  }, []);

  useEffect(() => {
    if (screen) void loadData(screen.id);
  }, [screen, loadData]);

  async function save() {
    if (!screen) return;
    setSaving(true);
    try {
      await apiFetch(`/api/screens/${screen.id}/schedule`, {
        method: "PUT",
        body: JSON.stringify({ slots }),
      });
      toast.success(t("schedule.saved"));
      onClose();
    } finally {
      setSaving(false);
    }
  }

  function removeSlot(idx: number) {
    setSlots((prev) => prev.filter((_, i) => i !== idx));
  }

  function openAddSlot(dow: number) {
    setNewSlot({ dayOfWeek: dow, startTime: "09:00", endTime: "17:00", templateId: templates[0]?.id ?? 0 });
    setAddingDay(dow);
  }

  function confirmAddSlot() {
    if (!newSlot.templateId) return;
    setSlots((prev) => [...prev, { ...newSlot }]);
    setAddingDay(null);
  }

  const daysOfWeek = [1, 2, 3, 4, 5, 6, 0];

  return (
    <Dialog open={!!screen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-5xl flex-col gap-0 overflow-hidden rounded-2xl border-border/60 p-0 shadow-xl">
        <DialogHeader className="shrink-0 border-b border-border/40 px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-base font-semibold">
              {t("schedule.title")} — {screen?.name}
            </DialogTitle>
            {onChangeMode && (
              <div className="flex overflow-hidden rounded-lg border border-border/60 text-xs">
                <button
                  type="button"
                  onClick={() => onChangeMode("QUICK")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-muted-foreground hover:bg-muted/60 transition-colors"
                >
                  <MonitorPlay className="size-3.5" />
                  {t("screens.modeQuick")}
                </button>
                <button
                  type="button"
                  onClick={() => onChangeMode("TEMPLATE")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground font-medium"
                >
                  <CalendarDays className="size-3.5" />
                  {t("screens.modeTemplate")}
                </button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
          <div className="grid grid-cols-7 gap-2 min-w-[700px]">
            {daysOfWeek.map((dow) => {
              const daySlots = slots.filter((s) => s.dayOfWeek === dow);
              return (
                <div key={dow} className="flex flex-col gap-2">
                  <p className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-1 border-b border-border/40">
                    {dayLabel(t, dow)}
                  </p>
                  {daySlots.map((slot, idx) => {
                    const globalIdx = slots.indexOf(slot);
                    const tplName = templates.find((t) => t.id === slot.templateId)?.name ?? `#${slot.templateId}`;
                    return (
                      <div
                        key={idx}
                        className="group relative rounded-lg bg-primary/10 border border-primary/20 px-2 py-1.5 text-xs"
                      >
                        <p className="font-medium text-primary truncate">{tplName}</p>
                        <p className="text-muted-foreground">{slot.startTime}–{slot.endTime}</p>
                        <button
                          type="button"
                          onClick={() => removeSlot(globalIdx)}
                          className="absolute right-1 top-1 hidden group-hover:flex size-4 items-center justify-center rounded-full bg-destructive/80 text-destructive-foreground"
                        >
                          <X className="size-2.5" />
                        </button>
                      </div>
                    );
                  })}
                  {addingDay === dow ? (
                    <div className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-muted/20 p-2">
                      <select
                        value={newSlot.templateId}
                        onChange={(e) => setNewSlot((p) => ({ ...p, templateId: Number(e.target.value) }))}
                        className="h-7 rounded-lg border border-input bg-transparent px-1.5 text-xs"
                      >
                        {templates.map((tpl) => (
                          <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                        ))}
                      </select>
                      <div className="flex gap-1 items-center">
                        <input
                          type="time"
                          value={newSlot.startTime}
                          onChange={(e) => setNewSlot((p) => ({ ...p, startTime: e.target.value }))}
                          className="h-7 flex-1 rounded-lg border border-input bg-transparent px-1 text-xs"
                        />
                        <span className="text-xs text-muted-foreground">–</span>
                        <input
                          type="time"
                          value={newSlot.endTime}
                          onChange={(e) => setNewSlot((p) => ({ ...p, endTime: e.target.value }))}
                          className="h-7 flex-1 rounded-lg border border-input bg-transparent px-1 text-xs"
                        />
                      </div>
                      <div className="flex gap-1">
                        <Button type="button" size="sm" className="h-6 flex-1 rounded-lg text-xs px-2" onClick={confirmAddSlot} disabled={!newSlot.templateId}>
                          {t("common.cancel") === "Cancel" ? "Add" : t("schedule.addSlot")}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" className="h-6 rounded-lg text-xs px-2" onClick={() => setAddingDay(null)}>
                          ✕
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openAddSlot(dow)}
                      className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-border/60 py-1.5 text-xs text-muted-foreground hover:border-border hover:text-foreground transition-colors"
                    >
                      <Plus className="size-3" />
                      {t("schedule.addSlot")}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-end border-t border-border/40 bg-muted/20 px-6 py-3.5">
          <Button
            type="button"
            className="h-10 gap-2 rounded-full px-6 text-sm font-medium"
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? t("common.loading") : t("schedule.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
