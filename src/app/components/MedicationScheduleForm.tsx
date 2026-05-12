import { useTranslation } from "react-i18next";
import { Plus, Trash2, ChevronRight, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
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
  cycleDays: number;
  onCycleDaysChange: (cycleDays: number) => void;
  specificDays: Set<number>;
  onSpecificDaysChange: (specificDays: Set<number>) => void;
  times: ScheduleTime[];
  onTimesChange: (times: ScheduleTime[]) => void;
  notificationsEnabled: boolean;
  onNotificationsEnabledChange: (enabled: boolean) => void;
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
  cycleDays,
  onCycleDaysChange,
  specificDays,
  onSpecificDaysChange,
  times,
  onTimesChange,
  notificationsEnabled,
  onNotificationsEnabledChange,
  frequencyPickerOpen,
  onFrequencyPickerOpenChange,
  introTitle,
  introDescription,
  showSectionTitle = true,
}: MedicationScheduleFormProps) {
  const { t } = useTranslation();

  const scheduleTypes: { value: ScheduleType; label: string; description: string }[] = [
    { value: "daily", label: t("schedule.daily") || "Daily", description: t("schedule.dailyDescription") || "Take this medication every day." },
    { value: "cyclic", label: t("schedule.cyclic") || "Every X days", description: t("schedule.cyclicDescription") || "Repeat after a custom number of days." },
    { value: "specific_days", label: t("schedule.specificDays") || "Specific days", description: t("schedule.specificDaysDescription") || "Choose the weekdays when this medication is scheduled." },
    { value: "as_needed", label: t("schedule.asNeeded") || "As needed", description: t("schedule.asNeededDescription") || "No fixed schedule. Log it only when you take it." },
  ];

  const currentScheduleType = scheduleTypes.find((type) => type.value === scheduleType) ?? scheduleTypes[0];
  const getDoseUnitLabel = (unit?: string) => {
    return getUnitLabel(unit ?? pill.unit, t);
  };

  const toggleDay = (day: number) => {
    const next = new Set(specificDays);
    next.has(day) ? next.delete(day) : next.add(day);
    onSpecificDaysChange(next);
  };

  const addTime = () => {
    onTimesChange([
      ...times,
      { time: "12:00", dose: times[0]?.dose ?? pill.defaultDosage, unit: times[0]?.unit ?? pill.unit },
    ]);
  };

  const removeTime = (index: number) => {
    onTimesChange(times.filter((_, itemIndex) => itemIndex !== index));
  };

  const updateTime = (index: number, field: "time" | "dose", value: string) => {
    onTimesChange(
      times.map((time, itemIndex) =>
        itemIndex === index
          ? { ...time, [field]: field === "dose" ? parseFloat(value) || 0 : value }
          : time,
      ),
    );
  };

  const handleNotificationToggle = (checked: boolean) => {
    onNotificationsEnabledChange(checked);
    if (!checked) return;

    if (typeof Notification === 'undefined') {
      toast.error("This browser doesn't support notifications.");
      return;
    }

    if (Notification.permission === 'granted') return;

    // Always request directly in the user-gesture handler.
    // On Chrome Android, permission may appear as 'denied' even when never
    // explicitly blocked — calling requestPermission() is the only way to
    // trigger the actual prompt or confirm a true block.
    Notification.requestPermission().then((result) => {
      if (result === 'denied') {
        toast.error(
          "Notifications are blocked for this site. In Chrome: tap the lock icon → Site settings → Notifications → Allow.",
          { duration: 7000 }
        );
      } else if (result === 'default') {
        toast.info("Tap 'Allow' on the notification prompt to receive reminders.");
      }
    }).catch(() => {
      toast.error("Unable to request notification permission.");
    });
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
            onClick={() => {
              onScheduleTypeChange(type.value);
              onFrequencyPickerOpenChange(false);
            }}
            className={cn(
              "w-full rounded-xl border p-4 text-left transition-colors",
              scheduleType === type.value
                ? "border-blue-500 bg-blue-500/10"
                : "border-gray-1000/20 hover:border-border/50 hover:bg-muted/40",
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

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">{t("schedule.frequency") || "Frequency"}</Label>
          <button
            type="button"
            onClick={() => onFrequencyPickerOpenChange(true)}
            className="w-full rounded-xl border border-border cursor-pointer p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/40"
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

        {scheduleType === "cyclic" && (
          <div className="flex sm:items-center gap-6">
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
            <div className="space-y-2 flex-1">
              <Label className="text-sm text-muted-foreground">{t("schedule.from") || "From"}</Label>
              <Input
                type="date"
                className="w-auto"
                value={scheduleStartDate}
                onChange={(event) => onScheduleStartDateChange(event.target.value)}
              />
            </div>
          </div>
        )}

        {scheduleType === "specific_days" && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">{t("schedule.selectDays") || "Select days"}</Label>
            <div className="bg-gray-200 dark:bg-[#2a2a2a] rounded-2xl p-[3px] flex gap-1">
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

        {scheduleType !== "as_needed" && (
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">

              <div className="flex w-full items-center gap-3 my-4">
                <Label className="flex-1 text-foreground">
                  {t("pillsSettings.notifications") || "Notifications"}
                </Label>
                <Switch checked={notificationsEnabled} onCheckedChange={handleNotificationToggle} />
              </div>

            </div>
            <div className="space-y-2">
              {times.map((entry, index) => (
                <div key={index} className="flex items-center gap-4">
                  <Input type="time" value={entry.time} onChange={(event) => updateTime(index, "time", event.target.value)} className="flex-1" />
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      className="pr-16"
                      min="0"
                      step="0.5"
                      value={entry.dose}
                      onChange={(event) => updateTime(index, "dose", event.target.value)}
                    />
                    {getDoseUnitLabel(entry.unit) && (
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-right text-sm text-muted-foreground">
                        {getDoseUnitLabel(entry.unit)}
                      </span>
                    )}
                  </div>
                  {times.length > 1 && (
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeTime(index)}>
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
                          <Button type="button" variant="secondary" size="sm" onClick={addTime}>
                <Plus className="size-4" />
                {t("basic.add") || "Add"}
              </Button>
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
