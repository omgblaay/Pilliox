import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Clock, Bell, ArrowLeft, ChevronRight, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { cn } from "./ui/utils";
import { notificationService } from "../services/notificationService";
import { toast } from "sonner";
import type { PillSetting, ScheduleType, ScheduleTime } from "./PillsSettings";
import { DAYS, UNIT_OPTIONS, normalizeUnit } from "../constants/medicationOptions";

interface MedicationScheduleEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pill: PillSetting;
  onSave: (updates: Partial<PillSetting>) => void | Promise<void>;
}

export function MedicationScheduleEditor({
  open,
  onOpenChange,
  pill,
  onSave,
}: MedicationScheduleEditorProps) {
  const { t } = useTranslation();
  const [scheduleType, setScheduleType] = useState<ScheduleType>("daily");
  const [cycleDays, setCycleDays] = useState(2);
  const [specificDays, setSpecificDays] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]));
  const [times, setTimes] = useState<ScheduleTime[]>([{ time: "09:00", dose: pill.defaultDosage }]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [frequencyPickerOpen, setFrequencyPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setScheduleType(pill.scheduleType ?? "daily");
      setCycleDays(pill.scheduleCycleDays ?? 2);
      setSpecificDays(new Set(pill.scheduleSpecificDays ?? [1, 2, 3, 4, 5]));
      setTimes(
        pill.scheduleTimes?.length
          ? pill.scheduleTimes.map((time) => ({ ...time, unit: time.unit ?? pill.unit }))
          : [{ time: "09:00", dose: pill.defaultDosage, unit: pill.unit }],
      );
      setNotificationsEnabled(pill.notificationsEnabled ?? false);
      setFrequencyPickerOpen(false);
    }
  }, [open, pill]);

  const toggleDay = (d: number) =>
    setSpecificDays((prev) => {
      const next = new Set(prev);
      next.has(d) ? next.delete(d) : next.add(d);
      return next;
    });

  const addTime = () => setTimes([...times, { time: "12:00", dose: pill.defaultDosage, unit: times[0]?.unit ?? pill.unit }]);
  const removeTime = (i: number) => setTimes(times.filter((_, idx) => idx !== i));
  const updateTime = (i: number, field: "time" | "dose" | "unit", val: string) =>
    setTimes(times.map((t, idx) =>
      idx === i ? { ...t, [field]: field === "dose" ? parseFloat(val) || 0 : normalizeUnit(val) } : t,
    ));

  const handleSave = async () => {
    const firstUnit = normalizeUnit(times[0]?.unit ?? pill.unit);
    setIsSaving(true);
    try {
      await onSave({
        unit: firstUnit,
        scheduleType,
        scheduleCycleDays: scheduleType === "cyclic" ? cycleDays : undefined,
        scheduleSpecificDays: scheduleType === "specific_days" ? Array.from(specificDays) : undefined,
        scheduleTimes: scheduleType !== "as_needed"
          ? times.map((time) => ({ ...time, unit: normalizeUnit(time.unit ?? firstUnit) }))
          : [],
        notificationsEnabled,
        notificationTime: notificationsEnabled && times.length > 0 ? times[0].time : undefined,
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const SCHEDULE_TYPES: { value: ScheduleType; label: string; description: string }[] = [
    { value: "daily", label: t("schedule.daily") || "Daily", description: t("schedule.dailyDescription") || "Take this medication every day." },
    { value: "cyclic", label: t("schedule.cyclic") || "Every X days", description: t("schedule.cyclicDescription") || "Repeat after a custom number of days." },
    { value: "specific_days", label: t("schedule.specificDays") || "Specific days", description: t("schedule.specificDaysDescription") || "Choose the weekdays when this medication is scheduled." },
    { value: "as_needed", label: t("schedule.asNeeded") || "As needed", description: t("schedule.asNeededDescription") || "No fixed schedule. Log it only when you take it." },
  ];
  const currentUnit = normalizeUnit(times[0]?.unit ?? pill.unit);
  const currentScheduleType = SCHEDULE_TYPES.find((s) => s.value === scheduleType) ?? SCHEDULE_TYPES[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen max-w-none h-[100dvh] max-h-[100dvh] sm:w-[min(760px,calc(100vw-2rem))] sm:h-[90vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {frequencyPickerOpen && (
              <Button type="button" variant="ghost" size="icon" onClick={() => setFrequencyPickerOpen(false)}>
                <ArrowLeft className="size-4" />
              </Button>
            )}
            <DialogTitle>{frequencyPickerOpen ? t("schedule.frequency") || "Frequency" : t("schedule.editSchedule") || "Edit Schedule"}</DialogTitle>
          </div>
          <DialogDescription className="sr-only">Edit medication schedule</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 py-2">
          {frequencyPickerOpen ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t("schedule.frequencyDescription") || "Choose how this medication should appear in your schedule."}
              </p>
              {SCHEDULE_TYPES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => {
                    setScheduleType(s.value);
                    setFrequencyPickerOpen(false);
                  }}
                  className={cn(
                    "w-full rounded-xl border p-4 text-left transition-colors",
                    scheduleType === s.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/40",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="font-medium">{s.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                    </div>
                    {scheduleType === s.value && <Check className="size-5 text-primary" />}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <>
          <div className="space-y-2">
            <Label>{t("schedule.frequency") || "Frequency"}</Label>
            <button
              type="button"
              onClick={() => setFrequencyPickerOpen(true)}
              className="w-full rounded-xl border border-border p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-medium">{currentScheduleType.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{currentScheduleType.description}</p>
                </div>
                <ChevronRight className="size-5 text-muted-foreground" />
              </div>
            </button>
          </div>

          {/* Cyclic: every X days */}
          {scheduleType === "cyclic" && (
            <div className="space-y-2">
              <Label>{t("schedule.everyXDays") || "Every how many days"}</Label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCycleDays(Math.max(2, cycleDays - 1))}
                  className="h-9 w-9 rounded-lg border flex items-center justify-center text-lg font-bold hover:bg-muted"
                >−</button>
                <span className="w-12 text-center text-lg font-semibold">{cycleDays}</span>
                <button
                  type="button"
                  onClick={() => setCycleDays(Math.min(60, cycleDays + 1))}
                  className="h-9 w-9 rounded-lg border flex items-center justify-center text-lg font-bold hover:bg-muted"
                >+</button>
                <span className="text-sm text-muted-foreground">{t("schedule.days") || "days"}</span>
              </div>
            </div>
          )}

          {/* Specific days: day toggles */}
          {scheduleType === "specific_days" && (
            <div className="space-y-2">
              <Label>{t("schedule.selectDays") || "Select days"}</Label>
                          <div className="bg-gray-200 dark:bg-[#2a2a2a] rounded-2xl p-[3px] flex gap-0">
                {DAYS.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    variant="tabGroup"
                    data-state={specificDays.has(day.value) ? "active" : "inactive"}
                    onClick={() => toggleDay(day.value)}
                    className={cn(
                      "flex-1 h-9 rounded-lg text-xs font-semibold transition-colors",
                    )}
                  >
                    {t(day.labelKey) || day.fallback}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Times */}
          {scheduleType !== "as_needed" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("schedule.title") || "Times & Doses"}</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addTime}>
                  <Plus className="size-4" />
                  {t("basic.add") || "Add time"}
                </Button>
              </div>
              <div className="space-y-2">
                {times.map((entry, i) => (
                  <div key={i} className="grid grid-cols-2 sm:grid-cols-[minmax(0,1fr)_80px_minmax(102px,126px)_auto] items-center gap-2">
                    <div className="relative min-w-0">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        type="time"
                        value={entry.time}
                        onChange={(e) => updateTime(i, "time", e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={entry.dose}
                      onChange={(e) => updateTime(i, "dose", e.target.value)}
                      className="w-20 text-center"
                    />
                    <Select value={entry.unit ?? currentUnit ?? "none"} onValueChange={(unit) => updateTime(i, "unit", unit)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_OPTIONS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit === "none" ? "-" : t(`units.${unit}`, { defaultValue: unit })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {times.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTime(i)}
                        className="text-muted-foreground hover:text-destructive flex-shrink-0"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Notifications */}
          <div className="border-t pt-4 flex items-center gap-3">
            <Bell className="size-4 text-muted-foreground flex-shrink-0" />
            <Label className="flex-1">{t("pillsSettings.notifications") || "Notifications"}</Label>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={(checked) => {
                setNotificationsEnabled(checked);
                if (checked) {
                  notificationService.ensurePermissions()
                    .then((granted) => {
                      if (!granted) toast.error("Notification permissions denied. Please enable them in your browser settings.");
                    })
                    .catch(() => toast.error("Failed to request notification permissions"));
                }
              }}
            />
          </div>
            </>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            {t("calendar.cancel") || "Cancel"}
          </Button>
          {!frequencyPickerOpen && (
            <Button onClick={handleSave} className="flex-1" disabled={isSaving}>
              {isSaving ? <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : t("pillsSettings.saveChanges") || "Save"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
