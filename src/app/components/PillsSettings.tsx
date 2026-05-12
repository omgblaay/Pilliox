import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { fetchWithTokenRefresh } from "../../utils/api-client";
import { applyDeviceNotifications, setDeviceNotificationEnabled } from "../../utils/deviceNotifications";
import {
  format,
  addDays,
  startOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  getDay,
  isAfter,
} from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Pill,
  Droplet,
  Leaf,
  Trash2,
  Plus,
  Save,
  Bell,
  Clock,
  ArrowLeft,
  CalendarDays,
  Loader2,
} from "lucide-react";
import { cn } from "./ui/utils";
import { ColorPicker } from "./ColorPicker";
import type { MedicationIconId } from "./MedicationIcon";
import { toast } from "sonner";
import {
  projectId,
  publicAnonKey,
} from "../../../utils/supabase/info";
import { useNotifications } from "../hooks/useNotifications";

interface PillDosage {
  pillId: string;
  dosage: number;
}

export interface ScheduleTime {
  time: string;
  dose: number;
  unit?: string;
}

export type ScheduleType = "daily" | "cyclic" | "specific_days" | "as_needed";

export interface PillSetting {
  id: string;
  name: string;
  defaultDosage: number;
  color?: string;
  icon?: MedicationIconId;
  type?: "medication" | "supplement" | "value" | "pills";
  unit?: string;
  notificationsEnabled?: boolean;
  notificationTime?: string;
  notificationFrequency?: "daily" | "every2days" | "every3days";
  scheduleType?: ScheduleType;
  scheduleStartDate?: string;
  scheduleCycleDays?: number;
  scheduleSpecificDays?: number[];
  scheduleTimes?: ScheduleTime[];
}

interface PillsSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  accessToken: string;
}

const PILL_COLORS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Red", value: "#ef4444" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
  { name: "Orange", value: "#f97316" },
];

// Helper function to convert hex color to rgba with opacity
const hexToRgba = (hex: string, opacity: number): string => {
  const result =
    /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(0, 0, 0, ${opacity})`;

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export function PillsSettings({
  open,
  onOpenChange,
  userId,
  accessToken,
}: PillsSettingsProps) {
  const { t } = useTranslation();
  const [pills, setPills] = useState<PillSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { syncNotifications, permissions } = useNotifications();
  const [editingPill, setEditingPill] =
    useState<PillSetting | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Fill-days state
  const [fillTargetPill, setFillTargetPill] = useState<PillSetting | null>(null);
  const [fillWeekdays, setFillWeekdays] = useState<Set<number>>(new Set());
  const [fillRange, setFillRange] = useState<"month" | "year" | "custom">("month");
  const [fillFrom, setFillFrom] = useState(format(new Date(), "yyyy-MM-dd"));
  const [fillTo, setFillTo] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [filling, setFilling] = useState(false);

  const openFillDialog = (pill: PillSetting) => {
    setFillTargetPill(pill);
    setFillWeekdays(new Set());
    setFillRange("month");
    setFillFrom(format(new Date(), "yyyy-MM-dd"));
    setFillTo(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  };

  useEffect(() => {
    if (open && userId) {
      loadPillsSettings();
    }
  }, [open, userId]);

  const loadPillsSettings = async () => {
    if (!userId) {
      toast.error(t("pillsSettings.loadError"));
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithTokenRefresh(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/pills-settings/${userId}`,
      );

      if (response.ok) {
        const data = await response.json();
        setPills(applyDeviceNotifications(data.pills || []));
      } else {
        const errorText = await response.text();
        toast.error(t("pillsSettings.loadError"));
      }
    } catch (error) {
      toast.error(t("pillsSettings.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const savePillsSettings = async () => {
    setSaving(true);
    try {
      for (const pill of pills) {
        if (
          !pill.id ||
          !pill.name ||
          typeof pill.defaultDosage !== "number" ||
          isNaN(pill.defaultDosage)
        ) {
          toast.error(t("pillsSettings.invalidData"));
          setSaving(false);
          return;
        }
      }

      const response = await fetchWithTokenRefresh(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/pills-settings/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pills }),
        },
      );

      if (response.ok) {
        pills.forEach((p) => setDeviceNotificationEnabled(p.id, p.notificationsEnabled ?? false));
        await syncNotifications(pills);
        toast.success(t("pillsSettings.saveSuccess"));
        onOpenChange(false);
      } else {
        const error = await response.text();
        toast.error(t("pillsSettings.saveError"));
      }
    } catch (error) {
      toast.error(t("pillsSettings.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const addPill = () => {
    const newPill: PillSetting = {
      id: `pill_${Date.now()}`,
      name: "",
      defaultDosage: 1,
      color: PILL_COLORS[0].value,
      type: "medication",
      icon: "capsule",
    };
    setPills([...pills, newPill]);
    setEditingPill(newPill);
    setEditModalOpen(true);
  };

  const updatePill = (
    id: string,
    updates: Partial<PillSetting>,
  ) => {
    setPills(
      pills.map((pill) =>
        pill.id === id ? { ...pill, ...updates } : pill,
      ),
    );
    // Also update editingPill if it matches
    if (editingPill && editingPill.id === id) {
      setEditingPill({ ...editingPill, ...updates });
    }
  };

  const removePill = (id: string) => {
    setPills(pills.filter((pill) => pill.id !== id));
  };

  const handleFillDays = async () => {
    if (!fillTargetPill) return;
    const editingPill = fillTargetPill;
    setFilling(true);
    try {
      const now = new Date();
      let fromDate: Date;
      let toDate: Date;
      if (fillRange === "month") {
        fromDate = startOfMonth(now);
        toDate = endOfMonth(now);
      } else if (fillRange === "year") {
        fromDate = startOfYear(now);
        toDate = endOfYear(now);
      } else {
        fromDate = new Date(fillFrom);
        toDate = new Date(fillTo);
        if (isAfter(fromDate, toDate)) {
          toast.error("Start date must be before end date");
          return;
        }
      }

      // Build list of target dates respecting weekday filter
      const targetDates: string[] = [];
      let cur = startOfDay(fromDate);
      const end = startOfDay(toDate);
      while (!isAfter(cur, end)) {
        const dow = getDay(cur); // 0=Sun…6=Sat
        if (fillWeekdays.size === 0 || fillWeekdays.has(dow)) {
          targetDates.push(format(cur, "yyyy-MM-dd"));
        }
        cur = addDays(cur, 1);
      }

      // Group by month
      const byMonth: Record<string, string[]> = {};
      targetDates.forEach((d) => {
        const mk = d.slice(0, 7);
        (byMonth[mk] ??= []).push(d);
      });

      let totalFilled = 0;
      for (const [monthKey, dates] of Object.entries(byMonth)) {
        // Fetch existing entries
        let monthEntries: Record<string, any> = {};
        try {
          const res = await fetchWithTokenRefresh(
            `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/calendar/${monthKey}`,
          );
          if (res.ok) monthEntries = (await res.json()).entries ?? {};
        } catch {}

        const newEntries = { ...monthEntries };
        for (const dateStr of dates) {
          const existing = newEntries[dateStr] ?? { amount: "", note: "" };
          let pillsArr: PillDosage[] = [];
          try { pillsArr = existing.pills ? JSON.parse(existing.pills) : []; } catch {}
          if (!pillsArr.some((p) => p.pillId === editingPill.id)) {
            pillsArr.push({ pillId: editingPill.id, dosage: editingPill.defaultDosage });
            newEntries[dateStr] = { ...existing, pills: JSON.stringify(pillsArr) };
            totalFilled++;
          }
        }

        await fetchWithTokenRefresh(
          `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/calendar/${monthKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ entries: newEntries }),
          },
        );
      }

      toast.success(
        totalFilled > 0
          ? `Filled ${totalFilled} empty day${totalFilled !== 1 ? "s" : ""} with ${editingPill.name}`
          : `All selected days already have ${editingPill.name} logged`,
      );
    } catch {
      toast.error("Failed to fill days");
    } finally {
      setFilling(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="large">
          <DialogHeader>
            <DialogTitle className="flex gap-2">
              <Pill
                className="h-5 w-5 text-[#9810FA]"
                strokeWidth={1.67}
              />
              {t("pillsSettings.title")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t("pillsSettings.description")}
            </DialogDescription>
          </DialogHeader> 

          <div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-700 border-t-purple-400"></div>
              </div>
            ) : (
              <>
                {pills.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Pill className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {t("pillsSettings.noPills")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pills.map((pill) => (
                      <div
                        key={pill.id}
                        className="flex items-center gap-3 px-3 h-16 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setEditingPill(pill);
                          setEditModalOpen(true);
                        }}
                      >
                        {/* Colored Dot */}
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor:
                              pill.color || "#a855f7",
                          }}
                        />

                        {/* Name */}
                        <span className="flex-1 font-medium text-sm">
                          {pill.name ||
                            t(
                              "pillsSettings.medicationPlaceholder",
                            )}
                        </span>

                        {/* Pills/Value Counter */}
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          {pill.type === "value" ? (
                            <Droplet className="h-4 w-4" />
                          ) : pill.type === "supplement" ? (
                            <Leaf className="h-4 w-4" />
                          ) : (
                            <Pill className="h-4 w-4" />
                          )}
                          <span>{pill.defaultDosage}</span>
                        </div>

                        {/* Notification Icon */}
                        {pill.notificationsEnabled && (
                          <Bell className="h-4 w-4 text-purple-600" />
                        )}

                        {/* Fill days button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openFillDialog(pill);
                          }}
                        >
                          <CalendarDays className="size-4" />
                          Fill
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Medication Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={addPill}
                >
                  <Plus
                    className="h-5 w-5 md:h-6 md:w-6"
                    color="blue"
                    strokeWidth={2}
                  />
                  <span className="text-[14px] md:text-base font-medium tracking-[0.4px] leading-6">
                    {t("pillsSettings.addMedication")}
                  </span>
                </Button>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-borde pt-4 flex sm:flex-row flex-col-reverse gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              {t("pillsSettings.cancel")}
            </Button>
            <Button
              onClick={savePillsSettings}
              disabled={saving || loading}
              className="flex-1"
            >
              {saving ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  {t("pillsSettings.saving")}
                </>
              ) : (
                <>
                  <Save className="h-6 w-6" strokeWidth={2} />
                  <span className="hidden md:inline">
                    {t("pillsSettings.save")}
                  </span>
                  <span className="md:hidden">
                    {t("pillsSettings.save")}
                  </span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Edit Medication Modal */}
      <Dialog
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
      >
        <DialogContent size="large">
          <DialogHeader className="flex-row gap-6 items-center">
            {" "}
            <Button
              size="icon"
              className="flex-0"
              onClick={() => setEditModalOpen(false)}
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2} />
            </Button>
            <DialogTitle className="flex flex-1 gap-2">
              {t("pillsSettings.editMedication") ||
                "Edit Medication"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t("pillsSettings.editMedicationDescription") ||
                "Edit your medication settings"}
            </DialogDescription>
            {/* Delete Button in Header */}
            <Button
              size="icon"
              variant="destructive"
              className="mr-10"
              onClick={() => {
                if (editingPill) {
                  removePill(editingPill.id);
                  setEditModalOpen(false);
                  toast.success(
                    t("pillsSettings.medicationDeleted") ||
                      "Medication deleted",
                  );
                }
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
              <span className="sr-only">
                {t("pillsSettings.delete") || "Delete"}
              </span>
            </Button>
          </DialogHeader>

          {editingPill && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-5 md:flex-row">
                {/* Name */}
                <div className="space-y-2 flex-1 flex-row">
                  <Label>
                    {t("pillsSettings.medicationName")}
                  </Label>
                  <Input
                    value={editingPill.name}
                    onChange={(e) =>
                      updatePill(editingPill.id, {
                        name: e.target.value,
                      })
                    }
                    placeholder={t(
                      "pillsSettings.medicationPlaceholder",
                    )}
                  />
                </div>

                {/* Color */}
                <div className="space-y-2 flex-1">
                  <Label>{t("pillsSettings.color")}</Label>
                  <ColorPicker
                    colors={PILL_COLORS.map((c) => ({ name: c.name, value: c.value }))}
                    selectedColor={
                      PILL_COLORS.find((c) => c.value === editingPill.color)
                        ? { name: PILL_COLORS.find((c) => c.value === editingPill.color)!.name, value: editingPill.color }
                        : { name: "", value: editingPill.color }
                    }
                    onSelect={(color) => {
                      updatePill(editingPill.id, { color: color.value });
                      setEditingPill({ ...editingPill, color: color.value! });
                    }}
                  />
                </div>

              </div>
              <div className="flex flex-col h-auto gap-5 md:flex-row">
                {/* Type */}
                <div className="flex-1">
                  <Label>{t("pillsSettings.type")}</Label>

                  <div className="bg-background/60 rounded-2xl p-1 flex gap-0">
                    <Button
                      size="sm"
                      type="button"
                      variant="tabGroup"
                      className="px-[8px] py-[0px]"
                      data-state={
                        (editingPill.type === "medication" || editingPill.type === "pills" || !editingPill.type)
                          ? "active"
                          : "inactive"
                      }
                      onClick={() => {
                        updatePill(editingPill.id, { type: "medication" });
                        setEditingPill({ ...editingPill, type: "medication" });
                      }}
                    >
                      <Pill className="h-3 w-3" strokeWidth={1.33} />
                      <span>{t("pillsSettings.typeMedication")}</span>
                    </Button>
                    <Button
                      size="sm"
                      type="button"
                      variant="tabGroup"
                      className="px-[8px] py-[0px]"
                      data-state={editingPill.type === "supplement" ? "active" : "inactive"}
                      onClick={() => {
                        updatePill(editingPill.id, { type: "supplement" });
                        setEditingPill({ ...editingPill, type: "supplement" });
                      }}
                    >
                      <Leaf className="h-3 w-3" strokeWidth={1.33} />
                      <span>{t("pillsSettings.typeSupplement")}</span>
                    </Button>
                    <Button
                      size="sm"
                      type="button"
                      variant="tabGroup"
                      className="px-[8px] py-[0px]"
                      data-state={editingPill.type === "value" ? "active" : "inactive"}
                      onClick={() => {
                        updatePill(editingPill.id, { type: "value" });
                        setEditingPill({ ...editingPill, type: "value" });
                      }}
                    >
                      <Droplet className="h-3 w-3" strokeWidth={1.33} />
                      <span>{t("pillsSettings.typeValue")}</span>
                    </Button>
                  </div>
                </div>

                {/* Default Dosage */}
                <div className="flex-1">
                  <Label>
                    {editingPill.type !== "value"
                      ? t("pillsSettings.defaultDosage")
                      : t("pillsSettings.defaultValue")}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step={
                      editingPill.type !== "value"
                        ? "0.5"
                        : "0.01"
                    }
                    value={editingPill.defaultDosage}
                    onChange={(e) => {
                      const newDosage =
                        parseFloat(e.target.value) || 0;
                      updatePill(editingPill.id, {
                        defaultDosage: newDosage,
                      });
                      setEditingPill({
                        ...editingPill,
                        defaultDosage: newDosage,
                      });
                    }}
                  />
                </div>
              </div>

              {/* Notification Settings */}
              <div className="border-t pt-4 justyfi-center border-border/80">
                <div className="flex items-center gap-5">
                  <div className="flex flex-1 items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-base whitespace-nowrap">
                      {t("pillsSettings.notifications")}
                    </Label>{" "}
                    <Switch
                      checked={
                        editingPill.notificationsEnabled ||
                        false
                      }
                      onCheckedChange={(checked) => {
                        updatePill(editingPill.id, {
                          notificationsEnabled: checked,
                          notificationTime:
                            checked &&
                            !editingPill.notificationTime
                              ? "09:00"
                              : editingPill.notificationTime,
                          notificationFrequency:
                            checked &&
                            !editingPill.notificationFrequency
                              ? "daily"
                              : editingPill.notificationFrequency,
                        });
                        setEditingPill({
                          ...editingPill,
                          notificationsEnabled: checked,
                          notificationTime:
                            checked &&
                            !editingPill.notificationTime
                              ? "09:00"
                              : editingPill.notificationTime,
                          notificationFrequency:
                            checked &&
                            !editingPill.notificationFrequency
                              ? "daily"
                              : editingPill.notificationFrequency,
                        });
                      }}
                    />
                  </div>

                  {editingPill.notificationsEnabled && (
                    <>
                      {/* Time Picker */}
                      <div className="flex-1">
                        <Input
                          type="time"
                          value={
                            editingPill.notificationTime ||
                            "09:00"
                          }
                          onChange={(e) => {
                            updatePill(editingPill.id, {
                              notificationTime: e.target.value,
                            });
                            setEditingPill({
                              ...editingPill,
                              notificationTime: e.target.value,
                            });
                          }}
                        />
                      </div>

                      {/* Frequency Selector */}
                      <div className="flex-1">
                        <Select
                          value={
                            editingPill.notificationFrequency ||
                            "daily"
                          }
                          onValueChange={(value) => {
                            const freq = value as
                              | "daily"
                              | "every2days"
                              | "every3days";
                            updatePill(editingPill.id, {
                              notificationFrequency: freq,
                            });
                            setEditingPill({
                              ...editingPill,
                              notificationFrequency: freq,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">
                              {t("pillsSettings.daily")}
                            </SelectItem>
                            <SelectItem value="every2days">
                              {t("pillsSettings.every2days")}
                            </SelectItem>
                            <SelectItem value="every3days">
                              {t("pillsSettings.every3days")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="border-t border-borde pt-4 flex sm:flex-row flex-col-reverse gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setEditModalOpen(false);
                loadPillsSettings(); // Reload to discard changes
              }}
            >
              {t("pillsSettings.discard") || "Discard"}
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setEditModalOpen(false);
              }}
            >
              <Save className="h-5 w-5" strokeWidth={2} />
              {t("pillsSettings.saveChanges") || "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fill Days Dialog */}
      <Dialog open={!!fillTargetPill} onOpenChange={(o) => !o && setFillTargetPill(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="size-2 text-muted-foreground" />
              dsadsadsadasFill empty daydsdss — {fillTargetPill?.name}
            </DialogTitle>
            <DialogDescription>
              Fill empty calendar days with the default dosage for this medication
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Weekday picker */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                {fillWeekdays.size === 0 ? "Every day of the week" : "Only on selected days"}
              </Label>
              <div className="flex gap-1.5">
                {([t("days.mon"), t("days.tue"), t("days.wed"), t("days.thu"), t("days.fri"), t("days.sat"), t("days.sun")] as const).map((label, i) => {
                  const dow = i === 6 ? 0 : i + 1;
                  const active = fillWeekdays.has(dow);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setFillWeekdays((prev) => {
                          const next = new Set(prev);
                          next.has(dow) ? next.delete(dow) : next.add(dow);
                          return next;
                        })
                      }
                      className={cn(
                        "flex-1 h-9 rounded-lg text-sm font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-accent hover:bg-accent/70 text-muted-foreground",
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Range selector */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Date range</Label>
              <div className="flex gap-1.5">
                {(["month", "year", "custom"] as const).map((r) => (
                  <Button
                    key={r}
                    type="button"
                    size="sm"
                    variant="tabGroup"
                    className="flex-1"
                    onClick={() => {
                      setFillRange(r);
                      if (r === "month") {
                        setFillFrom(format(startOfMonth(new Date()), "yyyy-MM-dd"));
                        setFillTo(format(endOfMonth(new Date()), "yyyy-MM-dd"));
                      } else if (r === "year") {
                        setFillFrom(format(startOfYear(new Date()), "yyyy-MM-dd"));
                        setFillTo(format(endOfYear(new Date()), "yyyy-MM-dd"));
                      }
                    }}
                  >
                    {r === "month" ? "This month" : r === "year" ? "This year" : "Custom range"}
                  </Button>
                ))}
              </div>
              {fillRange === "custom" && (
                <div className="flex gap-2 pt-1">
                  <Input type="date" value={fillFrom} onChange={(e) => setFillFrom(e.target.value)} className="flex-1" />
                  <Input type="date" value={fillTo} onChange={(e) => setFillTo(e.target.value)} className="flex-1" />
                </div>
              )}
            </div>

            <Button
              type="button"
              className="w-full"
              disabled={filling}
              onClick={handleFillDays}
            >
              {filling ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CalendarDays className="size-4" />
              )}
              {filling ? "Filling days…" : `Fill empty days with ${fillTargetPill?.defaultDosage} ${fillTargetPill?.type !== "value" ? "pill(s)" : "dose"} per day`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
