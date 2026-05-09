import { useState, useEffect } from "react";
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
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  ArrowLeft,
  Pill,
  Bell,
  Trash2,
  Save,
  Droplet,
  CalendarDays,
  Loader2,
} from "lucide-react";
import { cn } from "./ui/utils";
import { type PillSetting } from "./PillsSettings";
import { ColorPicker, COLORS } from "./ColorPicker";
import { notificationService } from "../services/notificationService";
import { fetchWithTokenRefresh } from "../../utils/api-client";
import { toast } from "sonner";

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

  // Delete state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteKeyword, setDeleteKeyword] = useState("");
  const [entryCount, setEntryCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fill days state
  const [fillTargetPill, setFillTargetPill] = useState<PillSetting | null>(null);
  const [fillWeekdays, setFillWeekdays] = useState<Set<number>>(new Set());
  const [fillRange, setFillRange] = useState<"month" | "year" | "custom">("month");
  const [fillFrom, setFillFrom] = useState("");
  const [fillTo, setFillTo] = useState("");
  const [filling, setFilling] = useState(false);

  useEffect(() => {
    if (open && pill) {
      setEditingPill({ ...pill });
    }
  }, [open, pill]);

  const updatePill = (updates: Partial<PillSetting>) => {
    setEditingPill((prev) => prev ? { ...prev, ...updates } : prev);
  };

  const openFillDialog = (p: PillSetting) => {
    setFillTargetPill(p);
    setFillWeekdays(new Set());
    setFillRange("month");
    setFillFrom(format(startOfMonth(new Date()), "yyyy-MM-dd"));
    setFillTo(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  };

  const handleFillDays = async () => {
    if (!fillTargetPill) return;
    setFilling(true);
    try {
      let fromDate: Date, toDate: Date;
      const now = new Date();
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
          setFilling(false);
          return;
        }
      }

      const dates: string[] = [];
      let cur = startOfDay(fromDate);
      while (!isAfter(cur, startOfDay(toDate))) {
        const dow = getDay(cur);
        if (fillWeekdays.size === 0 || fillWeekdays.has(dow)) dates.push(format(cur, "yyyy-MM-dd"));
        cur = addDays(cur, 1);
      }

      const byMonth: Record<string, string[]> = {};
      dates.forEach((d) => {
        const mk = d.slice(0, 7);
        (byMonth[mk] ??= []).push(d);
      });

      let filled = 0;
      for (const [mk, mDates] of Object.entries(byMonth)) {
        let entries: Record<string, any> = {};
        try {
          const r = await fetchWithTokenRefresh(
            `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/calendar/${mk}`,
          );
          if (r.ok) entries = (await r.json()).entries ?? {};
        } catch {}

        const next = { ...entries };
        for (const d of mDates) {
          const ex = next[d] ?? { amount: "", note: "" };
          let arr: { pillId: string; dosage: number }[] = [];
          try { arr = ex.pills ? JSON.parse(ex.pills) : []; } catch {}
          if (!arr.some((p) => p.pillId === fillTargetPill.id)) {
            arr.push({ pillId: fillTargetPill.id, dosage: fillTargetPill.defaultDosage });
            next[d] = { ...ex, pills: JSON.stringify(arr) };
            filled++;
          }
        }

        await fetchWithTokenRefresh(
          `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/calendar/${mk}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ entries: next }),
          },
        );
      }

      toast.success(
        filled > 0
          ? `Filled ${filled} empty day${filled !== 1 ? "s" : ""} with ${fillTargetPill.name}`
          : `All selected days already have ${fillTargetPill.name} logged`,
      );
      setFillTargetPill(null);
    } catch {
      toast.error("Failed to fill days");
    } finally {
      setFilling(false);
    }
  };

  const checkCalendarEntries = async (pillId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/calendar-entries/count/${userId}/${pillId}`,
        {
          headers: {
            Authorization: `Bearer ${anonKey}`,
            "X-User-Token": accessToken,
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        return data.count || 0;
      }
      return 0;
    } catch {
      return 0;
    }
  };

  const handleDeleteClick = async () => {
    if (!editingPill) return;
    const count = await checkCalendarEntries(editingPill.id);
    setEntryCount(count);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!editingPill) return;

    const expectedKeyword = t("pillsSettings.deleteKeywordPlaceholder")
      .replace("Type ", "")
      .replace("Wpisz ", "")
      .replace("eingeben", "LÖSCHEN")
      .replace("USUŃ", "USUŃ");

    if (
      deleteKeyword.trim().toUpperCase() !== expectedKeyword.toUpperCase() &&
      entryCount > 0
    ) {
      toast.error(t("pillsSettings.deleteKeywordMismatch"));
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/pills-settings/${userId}/${editingPill.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${anonKey}`,
            "X-User-Token": accessToken,
          },
        },
      );

      if (response.ok) {
        toast.success(t("pillsSettings.deleteSuccess"));
        setDeleteConfirmOpen(false);
        setDeleteKeyword("");
        onOpenChange(false);
        onDeleted(editingPill.id);
      } else {
        toast.error(t("pillsSettings.deleteError"));
      }
    } catch {
      toast.error(t("pillsSettings.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!editingPill || !userId) return;

    if (!editingPill.name || editingPill.name.trim() === "") {
      toast.error(t("pillsSettings.medicationPlaceholder") || "Please enter a medication name");
      return;
    }

    setIsSaving(true);
    try {
      const method = isAddingNew ? "POST" : "PUT";
      const url = isAddingNew
        ? `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/pills-settings/${userId}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/pills-settings/${userId}/${editingPill.id}`;

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${anonKey}`,
          "X-User-Token": accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingPill),
      });

      if (response.ok) {
        try {
          if (editingPill.notificationsEnabled) {
            await notificationService.updatePillNotifications(editingPill);
          } else {
            await notificationService.cancelPillNotifications(editingPill.id);
          }
        } catch {
          toast.error("Medication saved, but notification setup failed. Please check notification permissions.");
        }

        toast.success(
          isAddingNew
            ? t("pillsSettings.addMedication") || "Medication added"
            : t("pillsSettings.saveChanges") || "Changes saved",
        );

        onSaved(editingPill, isAddingNew);
        onOpenChange(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || t("pillsSettings.deleteError") || "Failed to save");
      }
    } catch {
      toast.error(t("pillsSettings.deleteError") || "Failed to save medication");
    } finally {
      setIsSaving(false);
    }
  };

  if (!editingPill) return null;

  return (
    <>
      {/* Edit Pill Modal */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader className="flex gap-4 flex-row items-center">

            <DialogTitle className="flex-1">
              {editingPill.name
                ? t("pillsSettings.editMedication") || "Edit Medication"
                : t("pillsSettings.addMedication") || "Add Medication"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {editingPill.name
                ? t("pillsSettings.editMedicationDescription") || "Edit your medication settings"
                : t("pillsSettings.addMedicationDescription") || "Add a new medication to your list"}
            </DialogDescription>

          </DialogHeader>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-5">
              {/* Name */}
              <div className="space-y-2 flex-1 flex-row">
                <Label>{t("pillsSettings.medicationName")}</Label>
                <Input
                  value={editingPill.name}
                  onChange={(e) => updatePill({ name: e.target.value })}
                  placeholder={t("pillsSettings.medicationPlaceholder")}
                />
              </div>

              {/* Color */}
              <div className="space-y-2 flex-1">
                <Label>{t("pillsSettings.color")}</Label>
                <ColorPicker
                  colors={COLORS}
                  selectedColor={COLORS.find((c) => c.hex === editingPill.color) ?? COLORS[0]}
                  onSelect={(color) => updatePill({ color: color.hex })}
                />
              </div>
            </div>

            <div className="flex flex-col h-auto gap-5 md:flex-row">
              {/* Type */}
              <div className="flex-1">
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

              {/* Default Dosage */}
              <div className="flex flex-row gap-4 flex-1">
              <div className="flex-1">
                <Label>
                  {(editingPill.type || "pills") === "pills"
                    ? t("pillsSettings.defaultDosage")
                    : t("pillsSettings.defaultValue")}
                </Label>
                <Input
                  type="number"
                  min="0"
                  step={(editingPill.type || "pills") === "pills" ? "0.5" : "0.01"}
                  value={editingPill.defaultDosage}
                  onChange={(e) => updatePill({ defaultDosage: parseFloat(e.target.value) || 0 })}
                />
              </div>

            {/* Unit */}
            <div className="flex-1">
              <Label>{t("pillsSettings.unit") || "Unit"}</Label>
              <Select
                value={editingPill.unit || "none"}
                onValueChange={(val) => updatePill({ unit: val === "none" ? undefined : val })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="-" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-</SelectItem>
                  <SelectItem value="mg">mg</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="mcg">mcg</SelectItem>
                  <SelectItem value="IU">IU</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="mmol/L">mmol/L</SelectItem>
                  <SelectItem value="mg/dL">mg/dL</SelectItem>
                  <SelectItem value="tablets">{t("calendar.tablets") || "tablets"}</SelectItem>
                  <SelectItem value="capsules">{t("calendar.capsules") || "capsules"}</SelectItem>
                  <SelectItem value="drops">{t("calendar.drops") || "drops"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            </div>
            </div>

            {/* Fill Days */}
            <div className="border-t pt-4 border-border/80">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => openFillDialog(editingPill)}
              >
                <CalendarDays className="size-4" />
                Fill empty days with default dosage
              </Button>
            </div>

            {/* Notification Settings */}
            <div className="border-t pt-4 border-border/80">
              <div className="flex flex-col gap-4">
                <div className="flex flex-1 items-center gap-2">
                  <Bell className="size-4 text-muted-foreground" />
                  <Label className="text-md flex-1 whitespace-nowrap">
                    {t("pillsSettings.notifications")}
                  </Label>
                  <Switch
                    checked={editingPill.notificationsEnabled || false}
                    onCheckedChange={(checked) => {
                      updatePill({
                        notificationsEnabled: checked,
                        notificationTime: checked && !editingPill.notificationTime ? "09:00" : editingPill.notificationTime,
                        notificationFrequency: checked && !editingPill.notificationFrequency ? "daily" : editingPill.notificationFrequency,
                      });
                      if (checked) {
                        notificationService.ensurePermissions()
                          .then((granted) => {
                            if (!granted) {
                              toast.error("Notification permissions were denied. Please enable them in your browser settings.");
                            } else {
                              toast.success("Notifications enabled! They will be scheduled when you save.");
                            }
                          })
                          .catch(() => {
                            toast.error("Failed to request notification permissions");
                          });
                      }
                    }}
                  />
                </div>

                {editingPill.notificationsEnabled && (
                  <div className="flex gap-5">
                    <div className="flex-1">
                      <Input
                        type="time"
                        value={editingPill.notificationTime || "09:00"}
                        onChange={(e) => updatePill({ notificationTime: e.target.value })}
                      />
                    </div>
                    <div className="flex-1">
                      <Select
                        value={editingPill.notificationFrequency || "daily"}
                        onValueChange={(value) =>
                          updatePill({ notificationFrequency: value as "daily" | "every2days" | "every3days" })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">{t("pillsSettings.daily")}</SelectItem>
                          <SelectItem value="every2days">{t("pillsSettings.every2days")}</SelectItem>
                          <SelectItem value="every3days">{t("pillsSettings.every3days")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-borde pt-4 flex mt-4 sm:flex-row gap-4">
            <div className="flex-1 flex gap-4">
                          {!isAddingNew && editingPill.name && (
              <Button
                variant="destructive"
                onClick={handleDeleteClick}
              >
                <Trash2 className="h-4 w-4" strokeWidth={2} />
              </Button>
            )}
              <Button variant="outline" className="flex-1" onClick={onDiscard} disabled={isSaving}>
                {t("pillsSettings.discard") || "Discard"}
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    {t("pillsSettings.saveChanges") || "Save"}
                  </>
                )}
              </Button>
            </div>
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
              <Input
                value={deleteKeyword}
                onChange={(e) => setDeleteKeyword(e.target.value)}
                placeholder={t("pillsSettings.deleteKeywordPlaceholder")}
                autoFocus
              />
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => { setDeleteConfirmOpen(false); setDeleteKeyword(""); }}
              disabled={isDeleting}
            >
              {t("pillsSettings.cancel") || "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting || (entryCount > 0 && !deleteKeyword)}
            >
              {isDeleting ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" strokeWidth={2} />
                  {t("pillsSettings.confirmDelete") || "Confirm Delete"}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fill Days Dialog */}
      <Dialog open={!!fillTargetPill} onOpenChange={(o) => !o && setFillTargetPill(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="size-5 text-muted-foreground" />
              Fill empty days — {fillTargetPill?.name}
            </DialogTitle>
            <DialogDescription className="sr-only">Fill empty calendar days with the default dosage</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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
                          const n = new Set(prev);
                          n.has(dow) ? n.delete(dow) : n.add(dow);
                          return n;
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

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Date range</Label>
              <div className="flex gap-1 p-1 rounded-[18px] bg-gray-100 dark:bg-[#2a2a2a]">
                {(["month", "year", "custom"] as const).map((r) => (
                  <Button
                    key={r}
                    type="button"
                    variant="tabGroup"
                    data-state={fillRange === r ? "active" : "inactive"}
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
                    {r === "month" ? t("dataRange.thisMonth") : r === "year" ? t("dataRange.thisYear") : t("dataRange.range")}
                  </Button>
                ))}
              </div>
              {fillRange === "custom" && (
                <div className="flex gap-2 pt-1">
                  <input
                    type="date"
                    value={fillFrom}
                    onChange={(e) => setFillFrom(e.target.value)}
                    className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
                  />
                  <input
                    type="date"
                    value={fillTo}
                    onChange={(e) => setFillTo(e.target.value)}
                    className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
                  />
                </div>
              )}
            </div>

            <Button type="button" className="w-full" disabled={filling} onClick={handleFillDays}>
              {filling ? <Loader2 className="size-4 animate-spin" /> : <CalendarDays className="size-4" />}
              {filling ? "Filling days…" : t("dataRange.fillEmpty") || "Fill empty days in range"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
