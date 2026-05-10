import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Clock, Bell, Pill, Droplet, ArrowLeft, ChevronRight, Check } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { cn } from "./ui/utils";
import { type PillSetting, type ScheduleType, type ScheduleTime } from "./PillsSettings";
import { ColorPicker, COLORS } from "./ColorPicker";
import { notificationService } from "../services/notificationService";
import { toast } from "sonner";
import { DAYS, UNIT_OPTIONS, normalizeUnit } from "../constants/medicationOptions";

interface MedicationEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pill: PillSetting | null;
  isAddingNew: boolean;
  userId: string;
  projectId: string;
  anonKey: string;
  accessToken: string;
  onSaved: (pill: PillSetting, isNew: boolean) => void;
  onDeleted: (pillId: string) => void;
  onDiscard: () => void;
}

export function MedicationEditDialog({
  open,
  onOpenChange,
  pill,
  isAddingNew,
  userId,
  projectId,
  anonKey,
  accessToken,
  onSaved,
  onDeleted,
  onDiscard,
}: MedicationEditDialogProps) {
  const { t } = useTranslation();  

  const [editingPill, setEditingPill] = useState<PillSetting | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState<0 | 1>(0);

  // Delete state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteKeyword, setDeleteKeyword] = useState("");
  const [entryCount, setEntryCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Schedule state
  const [scheduleType, setScheduleType] = useState<ScheduleType>("daily");
  const [frequencyPickerOpen, setFrequencyPickerOpen] = useState(false);
  const [cycleDays, setCycleDays] = useState(2);
  const [specificDays, setSpecificDays] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]));
  const [times, setTimes] = useState<ScheduleTime[]>([{ time: "09:00", dose: 1 }]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    if (open && pill) {
      setEditingPill({ ...pill });
      setScheduleType(pill.scheduleType ?? "daily");
      setCycleDays(pill.scheduleCycleDays ?? 2);
      setSpecificDays(new Set(pill.scheduleSpecificDays ?? [1, 2, 3, 4, 5]));
      setTimes(
        pill.scheduleTimes?.length
          ? pill.scheduleTimes.map((time) => ({ ...time, unit: time.unit ?? pill.unit }))
          : [{ time: "09:00", dose: pill.defaultDosage || 1, unit: pill.unit }],
      );
      setNotificationsEnabled(pill.notificationsEnabled ?? false);
      setStep(0);
      setFrequencyPickerOpen(false);
    }
  }, [open, pill]);

  const updatePill = (updates: Partial<PillSetting>) =>
    setEditingPill((prev) => prev ? { ...prev, ...updates } : prev);

  const toggleDay = (d: number) =>
    setSpecificDays((prev) => {
      const next = new Set(prev);
      next.has(d) ? next.delete(d) : next.add(d);
      return next;
    });

  const addTime = () => setTimes([...times, { time: "12:00", dose: times[0]?.dose ?? 1, unit: times[0]?.unit ?? editingPill?.unit }]);
  const removeTime = (i: number) => setTimes(times.filter((_, idx) => idx !== i));
  const updateTime = (i: number, field: "time" | "dose" | "unit", val: string) =>
    setTimes(times.map((t, idx) =>
      idx === i ? { ...t, [field]: field === "dose" ? parseFloat(val) || 0 : normalizeUnit(val) } : t,
    ));

  const checkCalendarEntries = async (pillId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/calendar-entries/count/${userId}/${pillId}`,
        { headers: { Authorization: `Bearer ${anonKey}`, "X-User-Token": accessToken } },
      );
      if (response.ok) return (await response.json()).count || 0;
      return 0;
    } catch { return 0; }
  };

  const handleDeleteClick = async () => {
    if (!editingPill) return;
    setEntryCount(await checkCalendarEntries(editingPill.id));
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!editingPill) return;
    const expectedKeyword = t("pillsSettings.deleteKeywordPlaceholder")
      .replace("Type ", "").replace("Wpisz ", "").replace("eingeben", "LÖSCHEN").replace("USUŃ", "USUŃ");
    if (deleteKeyword.trim().toUpperCase() !== expectedKeyword.toUpperCase() && entryCount > 0) {
      toast.error(t("pillsSettings.deleteKeywordMismatch"));
      return;
    }
    setIsDeleting(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/pills-settings/${userId}/${editingPill.id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${anonKey}`, "X-User-Token": accessToken } },
      );
      if (response.ok) {
        toast.success(t("pillsSettings.deleteSuccess"));
        setDeleteConfirmOpen(false);
        setDeleteKeyword("");
        onOpenChange(false);
        onDeleted(editingPill.id);
      } else { toast.error(t("pillsSettings.deleteError")); }
    } catch { toast.error(t("pillsSettings.deleteError")); }
    finally { setIsDeleting(false); }
  };

  const handleSave = async () => {
    if (!editingPill || !userId) return;
    if (!editingPill.name?.trim()) {
      toast.error(t("pillsSettings.medicationPlaceholder") || "Please enter a medication name");
      setStep(0);
      return;
    }
    setIsSaving(true);
    try {
      const firstDose = times[0]?.dose ?? 1;
      const firstUnit = normalizeUnit(times[0]?.unit ?? editingPill.unit);
      const scheduleTimes = scheduleType !== "as_needed"
        ? times.map((time) => ({ ...time, unit: normalizeUnit(time.unit ?? firstUnit) }))
        : [];
      const pillToSave: PillSetting = {
        ...editingPill,
        defaultDosage: firstDose,
        unit: firstUnit,
        scheduleType,
        scheduleCycleDays: scheduleType === "cyclic" ? cycleDays : undefined,
        scheduleSpecificDays: scheduleType === "specific_days" ? Array.from(specificDays) : undefined,
        scheduleTimes,
        notificationsEnabled,
        notificationTime: notificationsEnabled && times.length > 0 ? times[0].time : undefined,
      };

      const method = isAddingNew ? "POST" : "PUT";
      const url = isAddingNew
        ? `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/pills-settings/${userId}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/pills-settings/${userId}/${editingPill.id}`;

      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${anonKey}`, "X-User-Token": accessToken, "Content-Type": "application/json" },
        body: JSON.stringify(pillToSave),
      });

      if (response.ok) {
        toast.success(isAddingNew ? t("pillsSettings.addMedication") || "Medication added" : t("pillsSettings.saveChanges") || "Changes saved");
        onSaved(pillToSave, isAddingNew);
        onOpenChange(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || t("pillsSettings.deleteError") || "Failed to save");
      }
    } catch { toast.error(t("pillsSettings.deleteError") || "Failed to save medication"); }
    finally { setIsSaving(false); }
  };

  const SCHEDULE_TYPES: { value: ScheduleType; label: string; description: string }[] = [
    { value: "daily", label: t("schedule.daily") || "Daily", description: t("schedule.dailyDescription") || "Take this medication every day." },
    { value: "cyclic", label: t("schedule.cyclic") || "Every X days", description: t("schedule.cyclicDescription") || "Repeat after a custom number of days." },
    { value: "specific_days", label: t("schedule.specificDays") || "Specific days", description: t("schedule.specificDaysDescription") || "Choose the weekdays when this medication is scheduled." },
    { value: "as_needed", label: t("schedule.asNeeded") || "As needed", description: t("schedule.asNeededDescription") || "No fixed schedule. Log it only when you take it." },
  ];

  if (!editingPill) return null;

  const currentUnit = normalizeUnit(times[0]?.unit ?? editingPill.unit);
  const showBasics = !isAddingNew || step === 0;
  const showSchedule = !isAddingNew || step === 1;
  const currentScheduleType = SCHEDULE_TYPES.find((s) => s.value === scheduleType) ?? SCHEDULE_TYPES[0];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            "overflow-hidden flex flex-col",
            isAddingNew
              ? "w-screen max-w-none h-[100dvh] max-h-[100dvh] sm:w-[min(760px,calc(100vw-2rem))] sm:h-[90vh] sm:max-h-[90vh]"
              : "sm:max-w-[640px] max-h-[90vh]",
          )}
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              {frequencyPickerOpen && (
                <Button type="button" variant="ghost" size="icon" onClick={() => setFrequencyPickerOpen(false)}>
                  <ArrowLeft className="size-4" />
                </Button>
              )}
              <div className="flex-1">
                <DialogTitle>
                  {frequencyPickerOpen
                    ? t("schedule.frequency") || "Frequency"
                    : editingPill.name ? t("pillsSettings.editMedication") || "Edit Medication" : t("pillsSettings.addMedication") || "Add Medication"}
                </DialogTitle>
                {isAddingNew && !frequencyPickerOpen && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[
                      { index: 0, label: t("pillsSettings.nameAndColor") || "Name & color" },
                      { index: 1, label: t("pillsSettings.typeAndSchedule") || "Type & schedule" },
                    ].map((item) => (
                      <button
                        key={item.index}
                        type="button"
                        onClick={() => item.index === 0 || editingPill.name?.trim() ? setStep(item.index as 0 | 1) : setStep(0)}
                        className={cn(
                          "h-2 rounded-full transition-colors",
                          step === item.index ? "bg-primary" : "bg-muted",
                        )}
                        aria-label={item.label}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogDescription className="sr-only">Medication settings</DialogDescription>
          </DialogHeader>

          <div className={cn("flex-1 overflow-y-auto", !isAddingNew && "space-y-6")}>
            {frequencyPickerOpen ? (
              <div className="mx-auto w-full space-y-3">
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
            ) : showBasics && (
              <div className="mx-auto w-full space-y-6">
                {isAddingNew && (
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold">{t("pillsSettings.nameAndColor") || "Name & color"}</h2>
                    <p className="text-sm text-muted-foreground">{t("pillsSettings.addMedicationDescription") || "Add a new medication to your list"}</p>
                  </div>
                )}
                {/* Name */}
                <div className="space-y-2">
                  <Label>{t("pillsSettings.medicationName")}</Label>
                  <Input
                    value={editingPill.name}
                    onChange={(e) => updatePill({ name: e.target.value })}
                    placeholder={t("pillsSettings.medicationPlaceholder")}
                  />
                </div>

                {/* Color */}
                <div className="space-y-2 mx-1">
                  <Label>{t("pillsSettings.color")}</Label>
                  <ColorPicker
                    colors={COLORS}
                    selectedColor={COLORS.find((c) => c.hex === editingPill.color) ?? COLORS[0]}
                    onSelect={(color) => updatePill({ color: color.hex })}
                  />
                </div>
              </div>
            )}

            {!frequencyPickerOpen && showSchedule && (
              <div className="mx-auto w-full space-y-5">
                {isAddingNew && (
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold">{t("pillsSettings.typeAndSchedule") || "Type & schedule"}</h2>
                    <p className="text-sm text-muted-foreground">{editingPill.name}</p>
                  </div>
                )}
                {/* Type */}
                <div className="space-y-2">
                  <Label>{t("pillsSettings.type")}</Label>
                  <div className="bg-gray-200 dark:bg-[#2a2a2a] rounded-2xl p-[3px] flex gap-0">
                    <Button
                      type="button"
                      variant="tabGroup"
                      data-state={(editingPill.type || "pills") === "pills" ? "active" : "inactive"}
                      onClick={() => updatePill({ type: "pills" })}
                    >
                      <Pill className="size-5 hidden sm:block" strokeWidth={1.33} />
                      <span>{t("pillsSettings.typePills")}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="tabGroup"
                      data-state={(editingPill.type || "pills") === "value" ? "active" : "inactive"}
                      onClick={() => updatePill({ type: "value" })}
                    >
                      <Droplet className="size-5 hidden sm:block" strokeWidth={1.33} />
                      <span>{t("pillsSettings.typeValue")}</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("pillsSettings.unit") || "Unit"}</Label>
                  <Select
                    value={currentUnit ?? "none"}
                    onValueChange={(unit) => {
                      const nextUnit = normalizeUnit(unit);
                      updatePill({ unit: nextUnit });
                      setTimes(times.map((time) => ({ ...time, unit: nextUnit })));
                    }}
                  >
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
                </div>

                {/* Schedule */}
                <div className="space-y-4 border-t pt-4">
                  <Label className="text-base font-semibold">{t("schedule.title") || "Schedule"}</Label>

                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">{t("schedule.frequency") || "Frequency"}</Label>
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

                  {/* Cyclic */}
                  {scheduleType === "cyclic" && (
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">{t("schedule.everyXDays") || "Every how many days"}</Label>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setCycleDays(Math.max(2, cycleDays - 1))} className="h-9 w-9 rounded-lg border flex items-center justify-center text-lg font-bold hover:bg-muted">−</button>
                        <span className="w-12 text-center text-lg font-semibold">{cycleDays}</span>
                        <button type="button" onClick={() => setCycleDays(Math.min(60, cycleDays + 1))} className="h-9 w-9 rounded-lg border flex items-center justify-center text-lg font-bold hover:bg-muted">+</button>
                        <span className="text-sm text-muted-foreground">{t("schedule.days") || "days"}</span>
                      </div>
                    </div>
                  )}

                  {/* Specific days */}
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
                            className="flex-1 h-9 text-xs"
                          >
                            {t(day.labelKey) || day.fallback}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Times & Doses */}
                  {scheduleType !== "as_needed" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-muted-foreground">{t("calendar.notification") || "Times & Doses"}</Label>
                        <Button type="button" variant="secondary" size="sm" onClick={addTime}>
                          <Plus className="size-4" />
                          {t("basic.add") || "Add"}
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {times.map((entry, i) => (
                          <div key={i} className="grid grid-cols-2 sm:grid-cols-[minmax(0,1fr)_88px_minmax(104px,132px)_auto] items-center gap-2">
                            <Input type="time" value={entry.time} onChange={(e) => updateTime(i, "time", e.target.value)} />
                            <Input type="number" min="0" step="0.5" value={entry.dose} onChange={(e) => updateTime(i, "dose", e.target.value)} className="text-center" />
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
                              <Button type="button" variant="destructive" size="icon" onClick={() => removeTime(i)}>
                                <Trash2 className="size-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notifications */}
                  <div className="flex items-center gap-3 pt-1">
                    <Bell className="size-4 text-muted-foreground flex-shrink-0" />
                    <Label className="flex-1">{t("pillsSettings.notifications") || "Notifications"}</Label>
                    <Switch
                      checked={notificationsEnabled}
                      onCheckedChange={(checked) => {
                        setNotificationsEnabled(checked);
                        if (checked) {
                          notificationService.ensurePermissions()
                            .then((granted) => { if (!granted) toast.error("Notification permissions denied."); })
                            .catch(() => toast.error("Failed to request notification permissions"));
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t pt-4 flex gap-4">
            {!frequencyPickerOpen && !isAddingNew && editingPill.name && (
              <Button variant="destructive" onClick={handleDeleteClick}>
                <Trash2 className="h-4 w-4" strokeWidth={2} />
              </Button>
            )}
            <Button variant="outline" className="flex-1" onClick={onDiscard} disabled={isSaving}>
              {t("basic.cancel") || "Cancel"}
            </Button>
            {!frequencyPickerOpen && isAddingNew && step === 1 && (
              <Button variant="outline" className="flex-1" onClick={() => setStep(0)} disabled={isSaving}>
                <ArrowLeft className="size-4" />
                Back
              </Button>
            )}
            {!frequencyPickerOpen && (
              <Button
                className="flex-1"
                onClick={() => {
                  if (isAddingNew && step === 0) {
                    if (!editingPill.name?.trim()) {
                      toast.error(t("pillsSettings.medicationPlaceholder") || "Please enter a medication name");
                      return;
                    }
                    setStep(1);
                    return;
                  }
                  void handleSave();
                }}
                disabled={isSaving}
              >
                {isSaving ? <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : isAddingNew && step === 0 ? (t("onboarding.next") || "Next") : (t("basic.save") || "Save")}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[500px] p-6">
          <DialogHeader className="flex-row mb-4">
            <div className="flex flex-col gap-2 flex-1">
              <DialogTitle className="text-red-600 dark:text-red-400">
                {t("pillsSettings.deleteConfirmTitle") || "Delete Medication?"}
              </DialogTitle>
              <DialogDescription>
                {entryCount > 0
                  ? t("pillsSettings.deleteConfirmDescription").replace("{count}", entryCount.toString())
                  : t("pillsSettings.deleteConfirmNoEntries") || "Are you sure you want to delete this medication?"}
              </DialogDescription>
            </div>
          </DialogHeader>
          {entryCount > 0 && (
            <div className="space-y-2">
              <Label>{t("pillsSettings.deleteKeywordPrompt")}</Label>
              <Input value={deleteKeyword} onChange={(e) => setDeleteKeyword(e.target.value)} placeholder={t("pillsSettings.deleteKeywordPlaceholder")} autoFocus />
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => { setDeleteConfirmOpen(false); setDeleteKeyword(""); }} disabled={isDeleting}>
              {t("basic.cancel") || "Cancel"}
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting || (entryCount > 0 && !deleteKeyword)}>
              {isDeleting ? <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" /> : <Trash2 className="h-4 w-4" strokeWidth={2} />}
              {t("basic.apply") || "Confirm Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
