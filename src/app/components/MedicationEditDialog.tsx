import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, Pill, Droplet, Leaf, ArrowLeft, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
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
  DialogFooter,
} from "./ui/dialog";
import { cn } from "./ui/utils";
import { type PillSetting, type ScheduleType, type ScheduleTime } from "./PillsSettings";
import { ColorPicker, COLORLESS, COLORS } from "./ColorPicker";
import { toast } from "sonner";
import { UNIT_OPTIONS, formatDateInputValue, getUnitLabel, normalizeUnit } from "../constants/medicationOptions";
import { MedicationScheduleForm, normalizeScheduleTimes } from "./MedicationScheduleForm";
import { MEDICATION_ICON_IDS, MedicationIcon } from "./MedicationIcon";

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
  const [scheduleStartDate, setScheduleStartDate] = useState(formatDateInputValue());
  const [cycleDays, setCycleDays] = useState(2);
  const [specificDays, setSpecificDays] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]));
  const [times, setTimes] = useState<ScheduleTime[]>([{ time: "09:00", dose: 1 }]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    if (open && pill) {
      setEditingPill({ ...pill });
      setScheduleType(pill.scheduleType ?? "daily");
      setScheduleStartDate(pill.scheduleStartDate ?? formatDateInputValue());
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
        ? normalizeScheduleTimes(times, firstUnit)
        : [];
      const pillToSave: PillSetting = {
        ...editingPill,
        defaultDosage: firstDose,
        unit: firstUnit,
        scheduleType,
        scheduleStartDate: scheduleType === "cyclic" ? scheduleStartDate : undefined,
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

  if (!editingPill) return null;

  const currentUnit = normalizeUnit(editingPill.unit ?? times[0]?.unit);
  const medicationColors = [COLORLESS, ...COLORS];
  const addMedicationSteps = [
    {
      index: 0,
      label: t("pillsSettings.nameAndColor") || "Name & color",
      description: t("pillsSettings.addMedicationDescription") || "Add a new medication to your list",
    },
    {
      index: 1,
      label: t("pillsSettings.typeAndSchedule") || "Type & schedule",
      description: editingPill.name,
    },
  ] as const;
  const currentAddMedicationStep = addMedicationSteps[step];
  const showBasics = !isAddingNew || step === 0;
  const showSchedule = !isAddingNew || step === 1;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="large">
          <DialogHeader>
            {isAddingNew && !frequencyPickerOpen && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {addMedicationSteps.map((item) => (
                  <button
                    key={item.index}
                    type="button"
                    onClick={() => item.index === 0 || editingPill.name?.trim() ? setStep(item.index as 0 | 1) : setStep(0)}
                    className={cn(
                      "h-1 rounded-full transition-colors",
                      step === item.index ? "bg-primary" : "bg-muted",
                    )}
                    aria-label={item.label}
                  />
                ))}
              </div>
            )}
            <div className="flex items-center h-full gap-3">
              {frequencyPickerOpen && (
                <Button type="button" variant="ghost" size="icon" onClick={() => setFrequencyPickerOpen(false)}>
                  <ArrowLeft className="size-4" />
                </Button>
              )}
              <div className="flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <DialogTitle>
                    {frequencyPickerOpen
                      ? t("schedule.frequency") || "Frequency"
                      : isAddingNew ? t("pillsSettings.addMedication") || "Add Medication" : t("pillsSettings.editMedication") || "Edit Medication"}
                  </DialogTitle>
                  {isAddingNew && !frequencyPickerOpen && (
                    <>
                      <span className="text-base font-light text-muted-foreground">-</span>
                      <h3 className="text-base font-light leading-none">
                        {currentAddMedicationStep.label}
                      </h3>
                    </>
                  )}
                </div>

              </div>
            </div>

          </DialogHeader>

          <div className="sm:pt-0 pt-16 px-1 overflow-y-auto h-full">

            {frequencyPickerOpen ? (
              <MedicationScheduleForm
                pill={editingPill}
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
              />
            ) : showBasics && (
              <div className="mx-auto w-full flex-1 space-y-5 mb-5">
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
                <div className="space-y-2">
                  <Label>{t("pillsSettings.color")}</Label>
                  <ColorPicker
                    colors={medicationColors}
                    selectedColor={editingPill.color ? COLORS.find((c) => c.hex === editingPill.color) ?? COLORS[0] : COLORLESS}
                    onSelect={(color) => updatePill({ color: color.hex })}
                  />
                </div>
              </div>
            )}

            {!frequencyPickerOpen && showSchedule && (
              <div className="space-y-5">
                {/* Type */}
                <div className="flex w-full gap-4 sm:gap-6">
                  <div className="space-y-2 flex-1">
                    <Label>{t("pillsSettings.type")}</Label>
                    <div className="bg-gray-200 dark:bg-[#2a2a2a] rounded-2xl p-1 flex h-12 gap-0">
                      <Button
                        type="button"
                        variant="tabGroup"
                        className="!min-h-8 h-full"
                        data-state={(editingPill.type === "medication" || editingPill.type === "pills" || !editingPill.type) ? "active" : "inactive"}
                        onClick={() => updatePill({ type: "medication", icon: editingPill.icon ?? "capsule" })}
                      >
                        <Pill className="size-5 hidden sm:block" strokeWidth={1.33} />
                        <span>{t("pillsSettings.typeMedication")}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="tabGroup"
                        className="!min-h-8 h-full"
                        data-state={editingPill.type === "supplement" ? "active" : "inactive"}
                        onClick={() => updatePill({ type: "supplement", icon: editingPill.icon ?? "capsule" })}
                      >
                        <Leaf className="size-5 hidden sm:block" strokeWidth={1.33} />
                        <span>{t("pillsSettings.typeSupplement")}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="tabGroup"
                        className="!min-h-8 h-full"
                        data-state={editingPill.type === "value" ? "active" : "inactive"}
                        onClick={() => updatePill({ type: "value" })}
                      >
                        <Droplet className="size-5 hidden sm:block" strokeWidth={1.33} />
                        <span>{t("pillsSettings.typeValue")}</span>
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 flex-1">
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
                            {unit === "none" ? "-" : getUnitLabel(unit, t)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div></div>

                {editingPill.type !== "value" && (
                  <div className="space-y-2">
                    <Label>{t("pillsSettings.icon") || "Icon"}</Label>
                    <div className="bg-gray-200 dark:bg-[#2a2a2a] rounded-2xl p-[3px] flex gap-0">
                      {MEDICATION_ICON_IDS.map((icon) => {
                        const isSelected = (editingPill.icon ?? "capsule") === icon;

                        return (
                          <Button
                            key={icon}
                            type="button"
                            onClick={() => updatePill({ icon })}
                            variant="tabGroup"
                            data-state={isSelected ? "active" : "inactive"}
                            aria-label={`${t("pillsSettings.icon") || "Icon"} ${icon}`}
                          >
                            <MedicationIcon
                              icon={icon}
                              color={editingPill.color || "currentColor"}
                              className="size-5"
                            />
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}


                <MedicationScheduleForm
                  pill={editingPill}
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
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="flex-row">
            {!frequencyPickerOpen && !isAddingNew && editingPill.name && (
              <Button variant="destructive" onClick={handleDeleteClick}>
                <Trash2 className="h-4 w-4" strokeWidth={2} />
              </Button>
            )}
            {!frequencyPickerOpen && isAddingNew && step === 1 && (
              <Button variant="outline" className="flex-1" onClick={() => setStep(0)} disabled={isSaving}>
                <ArrowLeft className="size-4" />
              </Button>
            )}
            {!frequencyPickerOpen && isAddingNew && step === 0 && (
              <Button variant="outline" className="flex-1" onClick={onDiscard} disabled={isSaving}>
                {t("basic.cancel") || "Cancel"}
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
                {isSaving ? <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : isAddingNew && step === 0 ? (t("onboarding.next") || "Next") : <Check className="size-5" />}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="h-auto w-full sm:p-8 p-4">
          <DialogHeader className="flex-row mb-4 static p-0">
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
            <div className="space-y-2 ">
              <Label>{t("pillsSettings.deleteKeywordPrompt")}</Label>
              <Input value={deleteKeyword} onChange={(e) => setDeleteKeyword(e.target.value)} placeholder={t("pillsSettings.deleteKeywordPlaceholder")} autoFocus />
            </div>
          )}
          <div className="flex gap-3 justify-end pt-24">
            <Button variant="outline" className="flex-1" onClick={() => { setDeleteConfirmOpen(false); setDeleteKeyword(""); }} disabled={isDeleting}>
              {t("basic.cancel") || "Cancel"}
            </Button>
            <Button variant="destructive" className="flex-1" onClick={confirmDelete} disabled={isDeleting || (entryCount > 0 && !deleteKeyword)}>
              {isDeleting ? <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" /> : <Trash2 className="h-4 w-4" strokeWidth={2} />}
              {t("basic.delete") || "Confirm Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
