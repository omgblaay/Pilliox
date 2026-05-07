import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Check, Clock, Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export interface AdHocMedicationData {
  name: string;
  dosage: number;
  unit: string;
  notificationEnabled: boolean;
  notificationTime: string;
}

interface EditingMed {
  id: string;
  name: string;
  dosage: number;
  unit: string;
  notificationEnabled?: boolean;
  notificationTime?: string;
}

interface AdHocMedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingMed?: EditingMed | null;
  onSave: (data: AdHocMedicationData, editingId: string | null) => void;
}

const DEFAULT_FORM = {
  name: "",
  dosage: "",
  unit: "mg",
  notificationEnabled: false,
  notificationTime: "09:00",
};

export function AdHocMedicationDialog({
  open,
  onOpenChange,
  editingMed,
  onSave,
}: AdHocMedicationDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(DEFAULT_FORM.name);
  const [dosage, setDosage] = useState(DEFAULT_FORM.dosage);
  const [unit, setUnit] = useState(DEFAULT_FORM.unit);
  const [notificationEnabled, setNotificationEnabled] = useState(DEFAULT_FORM.notificationEnabled);
  const [notificationTime, setNotificationTime] = useState(DEFAULT_FORM.notificationTime);

  useEffect(() => {
    if (open) {
      if (editingMed) {
        setName(editingMed.name);
        setDosage(editingMed.dosage.toString());
        setUnit(editingMed.unit);
        setNotificationEnabled(editingMed.notificationEnabled ?? false);
        setNotificationTime(editingMed.notificationTime ?? "09:00");
      } else {
        setName(DEFAULT_FORM.name);
        setDosage(DEFAULT_FORM.dosage);
        setUnit(DEFAULT_FORM.unit);
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
        notificationEnabled,
        notificationTime,
      },
      editingMed?.id ?? null,
    );
  };

  const handleCancel = () => {
    onOpenChange(false);
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
          <div className="space-y-2">
            <Label htmlFor="adhoc-name" className="text-foreground">
              {t("calendar.medicationName") || "Medication Name"}
            </Label>
            <Input
              id="adhoc-name"
              placeholder={
                t("calendar.medicationNamePlaceholder") || "e.g., Aspirin, Ibuprofen"
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Pills and Values Section */}
          <div className="space-y-3">
            <Label className="text-foreground font-semibold text-base">
              {t("calendar.pillsAndValues") || "Pills and Values"}
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="adhoc-dosage" className="text-foreground">
                  {t("calendar.dosage") || "Dosage"}
                </Label>
                <Input
                  id="adhoc-dosage"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="500"
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
                    <SelectItem value="mg">mg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="mcg">mcg</SelectItem>
                    <SelectItem value="IU">IU</SelectItem>
                    <SelectItem value="tablets">
                      {t("calendar.tablets") || "tablets"}
                    </SelectItem>
                    <SelectItem value="cabsules">
                      {t("calendar.capsules") || "capsules"}
                    </SelectItem>
                    <SelectItem value="drops">
                      {t("calendar.drops") || "drops"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Notification Section */}
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-indigo-700 dark:text-indigo-400" />
                <Label className="text-foreground font-medium">
                  {t("calendar.enableNotification") || "Enable Reminder"}
                </Label>
              </div>
              <button
                type="button"
                onClick={() => setNotificationEnabled(!notificationEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationEnabled
                    ? "bg-blue-600"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {notificationEnabled && (
              <div className="space-y-2">
                <Label htmlFor="adhoc-notification-time" className="text-sm">
                  {t("calendar.notificationTime") || "Reminder Time"}
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="adhoc-notification-time"
                    type="time"
                    value={notificationTime}
                    onChange={(e) => setNotificationTime(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("calendar.notificationDesc") ||
                    "You'll receive a reminder at this time to take your medication."}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCancel} className="flex-1">
            {t("calendar.cancel") || "Cancel"}
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()} className="flex-1">
            {isEditing ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                {t("calendar.update") || "Update"}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                {t("calendar.add") || "Add"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
