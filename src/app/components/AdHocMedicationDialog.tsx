import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Check, Clock, Droplet, Pill, Plus, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
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
import { UNIT_OPTIONS } from "../constants/medicationOptions";

export interface AdHocMedicationData {
  name: string;
  dosage: number;
  unit: string;
  type: "medication" | "value";
  notificationEnabled: boolean;
  notificationTime: string;
}

interface EditingMed {
  id: string;
  name: string;
  dosage: number;
  unit: string;
  type?: "medication" | "value";
  notificationEnabled?: boolean;
  notificationTime?: string;
}

interface AdHocMedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingMed?: EditingMed | null;
  onSave: (data: AdHocMedicationData, editingId: string | null) => void;
  onDelete?: (id: string) => void;
}

const DEFAULT_FORM = {
  name: "",
  dosage: "",
  unit: "mg",
  type: "medication" as const,
  notificationEnabled: false,
  notificationTime: "09:00",
};

export function AdHocMedicationDialog({
  open,
  onOpenChange,
  editingMed,
  onSave,
  onDelete,
}: AdHocMedicationDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(DEFAULT_FORM.name);
  const [dosage, setDosage] = useState(DEFAULT_FORM.dosage);
  const [unit, setUnit] = useState(DEFAULT_FORM.unit);
  const [type, setType] = useState<"medication" | "value">(DEFAULT_FORM.type);
  const [notificationEnabled, setNotificationEnabled] = useState(DEFAULT_FORM.notificationEnabled);
  const [notificationTime, setNotificationTime] = useState(DEFAULT_FORM.notificationTime);

  useEffect(() => {
    if (open) {
      if (editingMed) {
        setName(editingMed.name);
        setDosage(editingMed.dosage.toString());
        setUnit(editingMed.unit);
        setType(editingMed.type ?? "medication");
        setNotificationEnabled(editingMed.notificationEnabled ?? false);
        setNotificationTime(editingMed.notificationTime ?? "09:00");
      } else {
        setName(DEFAULT_FORM.name);
        setDosage(DEFAULT_FORM.dosage);
        setUnit(DEFAULT_FORM.unit);
        setType(DEFAULT_FORM.type);
        setNotificationEnabled(DEFAULT_FORM.notificationEnabled);
        setNotificationTime(DEFAULT_FORM.notificationTime);
      }
    }
  }, [open, editingMed]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(
      {
        name: name.trim(),
        dosage: parseFloat(dosage) || 0,
        unit,
        type,
        notificationEnabled,
        notificationTime,
      },
      editingMed?.id ?? null,
    );
  };

  const isEditing = !!editingMed;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing
              ? t("calendar.editOtherMedication") || "Edit Medication"
              : t("calendar.addOtherMedication") || "Add Other Medication"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing
              ? t("calendar.editOtherMedicationDesc") || "Update the medication details."
              : t("calendar.addOtherMedicationDesc") ||
                "Add a one-time medication that's not in your regular schedule."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="adhoc-name" className="text-foreground">
              {t("calendar.medicationName") || "Medication Name"}
            </Label>
            <Input
              id="adhoc-name"
              placeholder={t("calendar.medicationNamePlaceholder") || "e.g., Aspirin, Ibuprofen"}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Type Switch */}
          <div className="space-y-2">
            <Label>{t("pillsSettings.type") || "Type"}</Label>
            <div className="bg-gray-200 dark:bg-[#2a2a2a] rounded-2xl p-[3px] flex gap-0">
              <Button
                type="button"
                variant="tabGroup"
                data-state={type === "medication" ? "active" : "inactive"}
                onClick={() => setType("medication")}
              >
                <Pill className="size-4 hidden sm:block" strokeWidth={1.33} />
                <span>{t("pillsSettings.typePills") || "Medication"}</span>
              </Button>
              <Button
                type="button"
                variant="tabGroup"
                data-state={type === "value" ? "active" : "inactive"}
                onClick={() => setType("value")}
              >
                <Droplet className="size-4 hidden sm:block" strokeWidth={1.33} />
                <span>{t("pillsSettings.typeValue") || "Value"}</span>
              </Button>
            </div>
          </div>

          {/* Dosage + Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="adhoc-dosage" className="text-foreground">
                {type === "value"
                  ? t("pillsSettings.defaultValue") || "Value"
                  : t("calendar.dosage") || "Dosage"}
              </Label>
              <Input
                id="adhoc-dosage"
                type="number"
                step={type === "value" ? "0.01" : "0.5"}
                min="0"
                placeholder={type === "value" ? "0.00" : "500"}
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adhoc-unit" className="text-foreground">
                {t("calendar.unit") || "Unit"}
              </Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger id="adhoc-unit">
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
          </div>

          {/* Notification — only for medication type */}
          {type === "medication" && (
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                  <Label className="text-foreground text-md">
                    {t("calendar.enableNotification") || "Enable Reminder"}
                  </Label>
                </div>
                <Switch
                  checked={notificationEnabled}
                  onCheckedChange={setNotificationEnabled}
                />
              </div>
              {notificationEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="adhoc-notification-time" className="text-sm">
                    {t("calendar.notificationTime") || "Reminder Time"}
                  </Label>
                  <div className="relative">
                    <Input
                      id="adhoc-notification-time"
                      type="time"
                      value={notificationTime}
                      onChange={(e) => setNotificationTime(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {isEditing && onDelete && (
            <Button
              variant="destructive"
              onClick={() => { onDelete(editingMed!.id); onOpenChange(false); }}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            {t("basic.cancel") || "Cancel"}
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()} className="flex-1">
            {isEditing ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                {t("basic.ok") || "Ok"}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                {t("basic.add") || "Add"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
