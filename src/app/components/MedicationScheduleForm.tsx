import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, ChevronRight, Check, Bell, BellOff, XIcon, CalendarX } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { cn } from "./ui/utils";
import { toast } from "sonner";
import type { PillSetting, ScheduleTime, ScheduleType } from "./PillsSettings";
import { DAYS, getUnitLabel, normalizeUnit } from "../constants/medicationOptions";

interface MedicationScheduleFormProps {
  pill: Pick<PillSetting, "defaultDosage" | "unit">;
  scheduleType: ScheduleType;
  onScheduleTypeChange: (scheduleType: ScheduleType) => void;
  scheduleStartDate: string;
  onScheduleStartDateChange: (date: string) => void;
  scheduleEndDate?: string;
  onScheduleEndDateChange?: (date: string) => void;
  cycleDays: number;
  onCycleDaysChange: (cycleDays: number) => void;
  specificDays: Set<number>;
  onSpecificDaysChange: (specificDays: Set<number>) => void;
  times: ScheduleTime[];
  onTimesChange: (times: ScheduleTime[]) => void;
  frequencyPickerOpen: boolean;
  onFrequencyPickerOpenChange: (open: boolean) => void;
  introTitle?: string;
  introDescription?: string;
  showSectionTitle?: boolean;
}

export function MedicationScheduleForm({
  pill,
  scheduleType,
  onScheduleTypeChange,
  scheduleStartDate,
  onScheduleStartDateChange,
  scheduleEndDate,
  onScheduleEndDateChange,
  cycleDays,
  onCycleDaysChange,
  specificDays,
  onSpecificDaysChange,
  times,
  onTimesChange,
  frequencyPickerOpen,
  onFrequencyPickerOpenChange,
  introTitle,
  introDescription,
  showSectionTitle = true,
}: MedicationScheduleFormProps) {
  const { t } = useTranslation();
  const [showEndDate, setShowEndDate] = useState(!!scheduleEndDate);

  // Sync expanded state when end date is set/cleared externally
  useEffect(() => {
    setShowEndDate(!!scheduleEndDate);
  }, [scheduleEndDate]);

  const scheduleTypes: { value: ScheduleType; label: string; description: string }[] = [
    { value: "daily", label: t("schedule.daily") || "Daily", description: t("schedule.dailyDescription") || "Take this medication every day." },
    { value: "cyclic", label: t("schedule.cyclic") || "Every X days", description: t("schedule.cyclicDescription") || "Repeat after a custom number of days." },
    { value: "specific_days", label: t("schedule.specificDays") || "Specific days", description: t("schedule.specificDaysDescription") || "Choose the weekdays when this medication is scheduled." },
    { value: "as_needed", label: t("schedule.asNeeded") || "As needed", description: t("schedule.asNeededDescription") || "No fixed schedule. Log it only when you take it." },
  ];

  const currentScheduleType = scheduleTypes.find((type) => type.value === scheduleType) ?? scheduleTypes[0];

  const getDoseUnitLabel = (unit?: string) => getUnitLabel(unit ?? pill.unit, t);

  const getScheduleInfoLabel = () => {
    switch (scheduleType) {
      case "daily": return t("schedule.daily") || "Daily";
      case "cyclic": return `Every ${cycleDays} days`;
      case "specific_days": {
        const dayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
        const selected = Array.from(specificDays).sort().map((d) => dayLabels[d]).join(", ");
        return selected || (t("schedule.specificDays") || "Specific days");
      }
      default: return "";
    }
  };

  const toggleDay = (day: number) => {
    const next = new Set(specificDays);
    next.has(day) ? next.delete(day) : next.add(day);
    onSpecificDaysChange(next);
  };

  const addTime = () => {
    onTimesChange([
      ...times,
      { time: "12:00", dose: times[0]?.dose ?? pill.defaultDosage, unit: times[0]?.unit ?? pill.unit, notificationEnabled: false },
    ]);
  };

  const removeTime = (index: number) => {
    onTimesChange(times.filter((_, i) => i !== index));
  };

  const updateTime = (index: number, updates: Partial<ScheduleTime>) => {
    onTimesChange(
      times.map((time, i) => (i === index ? { ...time, ...updates } : time)),
    );
  };

  const handleBellToggle = (index: number) => {
    const current = times[index].notificationEnabled ?? false;
    const next = !current;

    if (next && typeof Notification !== "undefined" && Notification.permission !== "granted") {
      Notification.requestPermission().then((result) => {
        if (result === "denied") {
          toast.error(
            "Notifications are blocked. In Chrome: tap the lock icon → Site settings → Notifications → Allow.",
            { duration: 7000 },
          );
          return;
        }
        updateTime(index, { notificationEnabled: true });
      }).catch(() => {
        toast.error("Unable to request notification permission.");
      });
      return;
    }

    updateTime(index, { notificationEnabled: next });
  };

  if (frequencyPickerOpen) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t("schedule.frequencyDescription") || "Choose how this medication should appear in your schedule."}
        </p>
        {scheduleTypes.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => onScheduleTypeChange(type.value)}
            className={cn(
              "w-full rounded-xl cursor-pointer border p-4 text-left transition-colors",
              scheduleType === type.value
                ? "border-blue-500 bg-blue-500/10"
                : "border-inputborder hover:bg-muted/40",
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="font-medium">{type.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{type.description}</p>
              </div>
              {scheduleType === type.value && <Check className="size-5 text-blue-500" />}
            </div>
          </button>
        ))}

        {scheduleType !== "as_needed" && (
          <div className="space-y-2 border-t pt-4">
            <Label className="text-sm text-muted-foreground">{t("schedule.activePeriod") || "Active period"}</Label>
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">{t("schedule.from") || "From"}</Label>
                <Input
                  type="date"
                  value={scheduleStartDate}
                  onChange={(e) => onScheduleStartDateChange(e.target.value)}
                />
              </div>
              {showEndDate ? (
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("schedule.to") || "To"}</Label>
                  <div className="flex gap-1">
                    <Input
                      type="date"
                      value={scheduleEndDate ?? ""}
                      onChange={(e) => onScheduleEndDateChange?.(e.target.value)}
                      min={scheduleStartDate}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => { onScheduleEndDateChange?.(""); setShowEndDate(false); }}
                    >
                      <CalendarX className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 text-muted-foreground h-9 self-end"
                  onClick={() => setShowEndDate(true)}
                >
                  <Plus className="size-3.5" />
                  {t("schedule.to") || "End date"}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full space-y-5 mt-5">
      {(introTitle || introDescription) && (
        <div className="space-y-1">
          {introTitle && <h2 className="text-xl font-semibold">{introTitle}</h2>}
          {introDescription && <p className="text-sm text-muted-foreground">{introDescription}</p>}
        </div>
      )}

      <div className="space-y-4">
        {showSectionTitle && (
          <Label className="text-base font-semibold">{t("schedule.title") || "Schedule"}</Label>
        )}

        {/* Frequency picker */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">{t("schedule.frequency") || "Frequency"}</Label>
          <button
            type="button"
            onClick={() => onFrequencyPickerOpenChange(true)}
            className="w-full rounded-xl border border-inputborder cursor-pointer p-4 text-left transition-colors hover:border-gray/20 hover:bg-muted/30"
          >
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="font-medium">{currentScheduleType.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{currentScheduleType.description}</p>
                {scheduleType !== "as_needed" && (scheduleStartDate || scheduleEndDate) && (
                  <p className="mt-1.5 text-xs font-mono text-muted-foreground">
                    {scheduleStartDate || "…"}
                    {scheduleEndDate ? ` → ${scheduleEndDate}` : ""}
                  </p>
                )}
              </div>
              <ChevronRight className="size-5 text-muted-foreground" />
            </div>
          </button>
        </div>

        {scheduleType === "cyclic" && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">{t("schedule.everyXDays") || "Every how many days"}</Label>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => onCycleDaysChange(Math.max(2, cycleDays - 1))} className="h-9 w-9 rounded-lg border flex items-center justify-center text-lg font-bold hover:bg-muted">
                <Plus className="size-4" />
              </Button>
              <span className="w-12 text-center text-lg font-semibold">{cycleDays}</span>
              <Button variant="outline" onClick={() => onCycleDaysChange(Math.min(60, cycleDays + 1))} className="h-9 w-9 rounded-lg border flex items-center justify-center text-lg font-bold hover:bg-muted">
                <Plus className="size-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{t("schedule.days") || "days"}</span>
            </div>
          </div>
        )}

        {scheduleType === "specific_days" && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">{t("schedule.selectDays") || "Select days"}</Label>
            <div className="bg-gray-100 dark:bg-[#2a2a2a] rounded-2xl p-[3px] flex gap-1">
              {DAYS.map((day) => (
                <Button
                  key={day.value}
                  type="button"
                  variant="tabGroup"
                  data-state={specificDays.has(day.value) ? "active" : "inactive"}
                  onClick={() => toggleDay(day.value)}
                  className="flex-1 h-9 !text-xs !px-0"
                >
                  {t(day.labelKey) || day.fallback}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Times with per-slot notification toggle */}
        {scheduleType !== "as_needed" && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">
                {t("schedule.reminderTimes") || "Reminder times"}
                {getScheduleInfoLabel() && (
                  <span className="ml-2 text-xs font-normal bg-muted px-2 py-0.5 rounded-full">
                    {getScheduleInfoLabel()}
                  </span>
                )}
              </Label>            <Button type="button" variant="secondary" size="sm" onClick={addTime}>
              <Plus className="size-4" />
              {t("basic.add") || "Add"}
            </Button>
            </div>
            <div className="space-y-2">
              {times.map((entry, index) => (
                <div key={index} className="flex items-center gap-4">
                  <Input
                    type="time"
                    value={entry.time}
                    onChange={(e) => updateTime(index, { time: e.target.value })}
                    className="flex-1"
                  />
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      className="pr-16"
                      min="0"
                      step="0.5"
                      value={entry.dose}
                      onChange={(e) => updateTime(index, { dose: parseFloat(e.target.value) || 0 })}
                    />
                    {getDoseUnitLabel(entry.unit) && (
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-right text-sm text-muted-foreground">
                        {getDoseUnitLabel(entry.unit)}
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleBellToggle(index)}
                    className={cn(
                      "flex-shrink-0",
                      entry.notificationEnabled
                        ? "bg-cyan-500/10 border-cyan-500"
                        : "text-muted-foreground",
                    )}
                    title={entry.notificationEnabled ? (t("schedule.disableReminder") || "Disable reminder") : (t("schedule.enableReminder") || "Enable reminder")}
                  >
                    {entry.notificationEnabled ? (
                      <><Bell className="size-4 text-teal-500" /> <Check className="size-4 text-teakl-500" /></>
                    ) : (
                      <><BellOff className="size-4 text-red-500" /> <XIcon className="size-4 text-red-500" /></>
                    )}
                  </Button>
                  {times.length > 1 && (
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeTime(index)}>
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export function normalizeScheduleTimes(times: ScheduleTime[], unit?: string): ScheduleTime[] {
  const normalizedUnit = normalizeUnit(unit);
  return times.map((time) => ({ ...time, unit: normalizedUnit }));
}
