import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import type { PillSetting, ScheduleType, ScheduleTime } from "./PillsSettings";
import { formatDateInputValue, normalizeUnit } from "../constants/medicationOptions";
import { MedicationScheduleForm, normalizeScheduleTimes } from "./MedicationScheduleForm";

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
  const [scheduleStartDate, setScheduleStartDate] = useState(formatDateInputValue());
  const [cycleDays, setCycleDays] = useState(2);
  const [specificDays, setSpecificDays] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]));
  const [times, setTimes] = useState<ScheduleTime[]>([{ time: "09:00", dose: pill.defaultDosage }]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [frequencyPickerOpen, setFrequencyPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setScheduleType(pill.scheduleType ?? "daily");
      setScheduleStartDate(pill.scheduleStartDate ?? formatDateInputValue());
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

  const handleSave = async () => {
    const firstUnit = normalizeUnit(times[0]?.unit ?? pill.unit);
    setIsSaving(true);
    try {
      await onSave({
        unit: firstUnit,
        scheduleType,
        scheduleStartDate: scheduleType === "cyclic" ? scheduleStartDate : undefined,
        scheduleCycleDays: scheduleType === "cyclic" ? cycleDays : undefined,
        scheduleSpecificDays: scheduleType === "specific_days" ? Array.from(specificDays) : undefined,
        scheduleTimes: scheduleType !== "as_needed"
          ? normalizeScheduleTimes(times, firstUnit)
          : [],
        notificationsEnabled,
        notificationTime: notificationsEnabled && times.length > 0 ? times[0].time : undefined,
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

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

        <div className="flex-1 overflow-y-auto space-y-5 pt-12">
          <MedicationScheduleForm
            pill={pill}
            scheduleType={scheduleType}
            onScheduleTypeChange={setScheduleType}
            scheduleStartDate={scheduleStartDate}
            onScheduleStartDateChange={setScheduleStartDate}
            cycleDays={cycleDays}
            onCycleDaysChange={setCycleDays}
            specificDays={specificDays}
            onSpecificDaysChange={setSpecificDays}
            times={times}
            onTimesChange={setTimes}
            notificationsEnabled={notificationsEnabled}
            onNotificationsEnabledChange={setNotificationsEnabled}
            frequencyPickerOpen={frequencyPickerOpen}
            onFrequencyPickerOpenChange={setFrequencyPickerOpen}
            showSectionTitle={false}
          />
        </div>

        <div className="flex gap-2 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            {t("calendar.cancel") || "Cancel"}
          </Button>
          {!frequencyPickerOpen && (
            <Button onClick={handleSave} className="flex-1" disabled={isSaving}>
              {isSaving ? <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Check className="size-5" />}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
