import { useState } from "react";
import { useNavigate } from "react-router";
import type { Locale } from "date-fns";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, type PanInfo } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Palette,
  Pill,
  Check,
  X,
  Plus,
  Minus,
  Pencil,
  Bell,
  CalendarCheck,
  Trash,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { cn } from "./ui/utils";
import type { PillSetting } from "./PillsSettings";
import { NoteDialog } from "./NoteDialog";
import { EditTagDialog } from "./EditTagDialog";
import { MedicationIcon } from "./MedicationIcon";

interface PillDosage {
  pillId: string;
  dosage: number;
}

interface AdHocMedication {
  id: string;
  name: string;
  dosage: number;
  unit: string;
  type?: "medication" | "value";
  taken?: boolean;
  notificationEnabled?: boolean;
  notificationTime?: string;
}

interface CalendarEntry {
  amount: string;
  note: string;
  pills?: string;
  adHocMeds?: string;
  pillDosageOverrides?: string;
  color?: string;
  tag?: string;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

const headerSlideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

function hexToRgba(hex: string, opacity: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

interface EditDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  selectedDates: Set<string>;
  entries: Record<string, CalendarEntry>;
  isDarkMode: boolean;
  swipeDirectionRef: React.MutableRefObject<number>;
  pillsSettings: PillSetting[];
  // Day data
  amount: string;
  setAmount: (v: string) => void;
  note: string;
  pills: PillDosage[];
  setPills: React.Dispatch<React.SetStateAction<PillDosage[]>>;
  adHocMeds: AdHocMedication[];
  dosageOverrides: Record<string, number>;
  setDosageOverrides: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setNote: (v: string) => void;
  // Sub-dialog triggers
  setDeleteConfirmOpen: (v: boolean) => void;
  setAddAdHocDialogOpen: (v: boolean) => void;
  // Handlers
  navigateToPreviousDay: () => void;
  navigateToNextDay: () => void;
  handleDayModalSwipe: (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
  formatDialogDate: (date: Date) => string;
  weekStartsOnMonday: boolean;
  onUpdateGroupedTag: (text: string, colorHex: string, addDays: Set<string>, removeDays: Set<string>) => void;
  handleSave: () => void;
  onCancel: () => void;
  onClearDay: () => void;
  handleRemoveAdHocMed: (id: string) => void;
  handleEditAdHocMed: (med: AdHocMedication) => void;
  handleToggleAdHocTaken: (id: string) => void;
  // i18n locale for date formatting
  dateLocale: Locale;
}

export function EditDayDialog({
  open,
  onOpenChange,
  selectedDate,
  selectedDates,
  entries,
  isDarkMode,
  swipeDirectionRef,
  pillsSettings,
  amount,
  setAmount,
  note,
  pills,
  setPills,
  adHocMeds,
  dosageOverrides,
  setDosageOverrides,
  setNote,
  setDeleteConfirmOpen,
  setAddAdHocDialogOpen,
  navigateToPreviousDay,
  navigateToNextDay,
  handleDayModalSwipe,
  formatDialogDate,
  weekStartsOnMonday,
  onUpdateGroupedTag,
  handleSave,
  onCancel,
  onClearDay,
  handleRemoveAdHocMed,
  handleEditAdHocMed,
  handleToggleAdHocTaken,
  dateLocale,
}: EditDayDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [editTagDialogOpen, setEditTagDialogOpen] = useState(false);

  function startEditingTag() {
    if (!selectedDate) return;
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const currentEntry = entries[dateKey];
    if (!currentEntry?.color) return;
    setEditTagDialogOpen(true);
  }

  function findGroupedDays(currentColor: string, currentTag: string): string[] {
    return Object.keys(entries).filter((dateKey) => {
      const entry = entries[dateKey];
      return entry.color === currentColor && entry.tag === currentTag;
    });
  }

  function formatDayRanges(dateStrings: string[]): string[] {
    if (dateStrings.length === 0) return [];
    const sorted = dateStrings.map((ds) => new Date(ds)).sort((a, b) => a.getTime() - b.getTime());
    const ranges: string[] = [];
    let rangeStart = sorted[0];
    let rangeEnd = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const prev = sorted[i - 1];
      const dayDiff = (current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (dayDiff === 1) {
        rangeEnd = current;
      } else {
        ranges.push(
          rangeStart.getTime() === rangeEnd.getTime()
            ? format(rangeStart, "MMM d", { locale: dateLocale })
            : `${format(rangeStart, "MMM d", { locale: dateLocale })} - ${format(rangeEnd, "d", { locale: dateLocale })}`,
        );
        rangeStart = current;
        rangeEnd = current;
      }
    }
    ranges.push(
      rangeStart.getTime() === rangeEnd.getTime()
        ? format(rangeStart, "MMM d", { locale: dateLocale })
        : `${format(rangeStart, "MMM d", { locale: dateLocale })} - ${format(rangeEnd, "d", { locale: dateLocale })}`,
    );
    return ranges;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="small">
        {/* Header */}
        <DialogHeader hideClose>
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="icon" onClick={navigateToPreviousDay}>
              <ChevronLeft />
            </Button>
            <motion.div
              className="overflow-hidden flex-auto"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDayModalSwipe}
            >
              <AnimatePresence mode="wait" initial={false} custom={swipeDirectionRef.current}>
                <DialogTitle asChild>
                  <motion.div
                    key={selectedDate ? format(selectedDate, "yyyy-MM-dd") : "none"}
                    custom={swipeDirectionRef.current}
                    variants={headerSlideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="text-foreground !font-normal !w-auto text-center"
                  >
                    {selectedDate && (() => {
                      const [weekday, ...dateParts] = formatDialogDate(selectedDate).split(",");
                      const dateText = dateParts.join(",").trim();

                      return (
                        <>
                          {weekday}
                          {dateText && (
                            <span className="text-muted-foreground">
                              {`, ${dateText}`}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </motion.div>
                </DialogTitle>
              </AnimatePresence>
            </motion.div>
            <Button variant="ghost" size="icon" onClick={navigateToNextDay}>
              <ChevronRight />
            </Button>
          </div>
          <DialogDescription className="sr-only">
            {t("calendar.day", { count: selectedDates.size })}
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDayModalSwipe}
          className="h-full mt-20 sm:mt-0"
        >
          <AnimatePresence mode="wait" initial={false} custom={swipeDirectionRef.current}>
            <motion.div
              key={selectedDate ? format(selectedDate, "yyyy-MM-dd") : "none"}
              custom={swipeDirectionRef.current}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {/* Color/Tag Section */}
              {selectedDate && entries[format(selectedDate, "yyyy-MM-dd")]?.color && (
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">


                  </div>

                  {/* Tag Display */}
                  {(() => {
                    const color = entries[format(selectedDate, "yyyy-MM-dd")]?.color || "";
                    return (
                      <div
                        className="min-h-12 rounded-lg border flex items-center px-4 py-2 relative group"
                        style={{
                          backgroundColor: hexToRgba(color, 0.15),
                          borderColor: hexToRgba(color, 0.3),
                        }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirmOpen(true)}
                          className="text-muted-foreground"
                        >
                          <X className="size-4" />
                        </Button>
                        <span className="text-sm mr-4 text-foreground">
                          {entries[format(selectedDate, "yyyy-MM-dd")]?.tag || t("calendar.noTag")}
                        </span>

                        {/* Grouped Days */}
                        {(() => {
                          const currentEntry = entries[format(selectedDate, "yyyy-MM-dd")];
                          if (!currentEntry?.color || !currentEntry?.tag) return null;
                          const groupedDays = findGroupedDays(currentEntry.color, currentEntry.tag);
                          const dayRanges = formatDayRanges(groupedDays);
                          if (groupedDays.length <= 1) return null;
                          return (
                            <div className="flex flex-wrap items-center gap-1.5 text-xs">
                              {dayRanges.map((range, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 rounded text-xs font-medium"
                                  style={{
                                    backgroundColor: hexToRgba(color, 0.2),
                                    color,
                                  }}
                                >
                                  {range}
                                </span>
                              ))}
                            </div>
                          );
                        })()}

                        <button
                          onClick={startEditingTag}
                          className="absolute right-2 top-2 h-8 w-8 rounded-lg flex items-center justify-center transition-opacity hover:bg-black/10 dark:hover:bg-white/10"
                          style={{ color }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}
              {/* Empty state — no regular medications configured */}
              {pillsSettings.length === 0 && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      navigate("/app/medications", { state: { openAdd: true } });
                    }}
                    className="w-full flex cursor-pointer items-center gap-3 p-4 rounded-xl border border-dashed border-border dark:border-gray-500/40 hover:border-primary hover:bg-muted/40 transition-colors text-left"
                  >
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Plus className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-foreground">
                        {t("medications.empty.title") || "No medications added yet"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {t("medications.empty.description") || "Tap to add your first medication"}
                      </p>
                    </div>
                  </button>
                  {adHocMeds.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setAddAdHocDialogOpen(true)}
                      className="w-full flex cursor-pointer items-center gap-3 p-4 rounded-xl border border-dashed border-gray-500/40 hover:border-primary hover:bg-muted/40 transition-colors text-left"
                    >
                      <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                        <Plus className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-foreground">
                          {t("medications.emptyAdHoc.title") || "Add one-time medication"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {t("medications.emptyAdHoc.description") || "Log a medication just for this day"}
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              )}
              <div className="space-y-3">
                {/* Pills Section */}
                {pillsSettings.filter((ps) => ps.type !== "value").length > 0 && (

                  <div className="space-y-2">
                    {pillsSettings
                      .filter((ps) => ps.type !== "value")
                      .map((pillSetting) => {
                        const pillDosage = pills.find((p) => p.pillId === pillSetting.id);
                        const isSelected = !!pillDosage;
                        const currentDosage = isSelected
                          ? pillDosage!.dosage
                          : (dosageOverrides[pillSetting.id] ?? pillSetting.defaultDosage);
                        const medicationColor = pillSetting.color;
                        return (
                          <div key={pillSetting.id} className="flex items-center gap-3 p-2 px-4 border border-border rounded-lg dark:border-slate-100/20  hover:bg-muted/30 transition-colors">
                            <button
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setDosageOverrides((prev) => ({ ...prev, [pillSetting.id]: pillDosage!.dosage }));
                                  setPills(pills.filter((p) => p.pillId !== pillSetting.id));
                                } else {
                                  setPills([...pills, { pillId: pillSetting.id, dosage: dosageOverrides[pillSetting.id] ?? pillSetting.defaultDosage }]);
                                }
                              }}
                              className={cn(
                                "h-7 w-7 rounded-lg cursor-pointer border-2 flex items-center justify-center transition-colors",
                                isSelected && !medicationColor && "bg-muted-foreground border-muted-foreground",
                                !isSelected && !medicationColor && "border-gray-400 dark:border-gray-500",
                                !isSelected && "hover:bg-muted/40",
                              )}
                              style={{
                                backgroundColor: isSelected && medicationColor ? medicationColor : undefined,
                                borderColor: medicationColor,
                              }}
                            >
                              {isSelected && <Check className="h-4 w-4 text-white" />}
                            </button>
                            <MedicationIcon
                              icon={pillSetting.icon}
                              color={medicationColor || "currentColor"}
                              className={cn("size-5", !isSelected && "text-muted-foreground")}
                            />
                            <span className={cn("flex-1", !isSelected && "text-muted-foreground")}>
                              {pillSetting.name}
                            </span>
                            <div className="flex items-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="dark:hover:bg-slate-100/5 text-muted-foreground"
                                onClick={() => {
                                  const newDosage = Math.max(0, currentDosage - 0.5);
                                  if (isSelected) {
                                    setPills(pills.map((p) => p.pillId === pillSetting.id ? { ...p, dosage: newDosage } : p));
                                  } else {
                                    setDosageOverrides((prev) => ({ ...prev, [pillSetting.id]: newDosage }));
                                  }
                                }}
                              >
                                <Minus className="size-4" />
                              </Button>
                              <Input
                                type="number"
                                min="0"
                                step="0.25"
                                variant="underline"
                                className="w-14 text-center mx-1"
                                value={currentDosage}
                                onChange={(e) => {
                                  const newDosage = parseFloat(e.target.value) || 0;
                                  if (isSelected) {
                                    setPills(pills.map((p) => p.pillId === pillSetting.id ? { ...p, dosage: newDosage } : p));
                                  } else {
                                    setDosageOverrides((prev) => ({ ...prev, [pillSetting.id]: newDosage }));
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="dark:hover:bg-slate-100/5 text-muted-foreground"
                                onClick={() => {
                                  const newDosage = currentDosage + 0.5;
                                  if (isSelected) {
                                    setPills(pills.map((p) => p.pillId === pillSetting.id ? { ...p, dosage: newDosage } : p));
                                  } else {
                                    setDosageOverrides((prev) => ({ ...prev, [pillSetting.id]: newDosage }));
                                  }
                                }}
                              >
                                <Plus className="size-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Value Type Medications */}
                {pillsSettings.filter((ps) => ps.type === "value").map((valueSetting) => {
                  const pillDosage = pills.find((p) => p.pillId === valueSetting.id);
                  const currentValue = pillDosage?.dosage?.toString() || "";
                  return (
                    <div key={valueSetting.id} className="flex items-center gap-3 p-2 px-4 border border-border rounded-lg dark:border-slate-100/20 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center flex-row gap-2 flex-1">
                        <div className="h-5 w-2 rounded-full" style={{ backgroundColor: valueSetting.color }} />
                        <Label className="text-md" htmlFor={`value-${valueSetting.id}`}>{valueSetting.name}</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          id={`value-${valueSetting.id}`}
                          type="number"
                          variant="underline"
                          step="0.01"
                          placeholder="0.00"
                          value={currentValue}
                          className="w-16 text-center"
                          onChange={(e) => {
                            const newValue = parseFloat(e.target.value) || 0;
                            const existingPill = pills.find((p) => p.pillId === valueSetting.id);
                            if (existingPill) {
                              setPills(pills.map((p) => p.pillId === valueSetting.id ? { ...p, dosage: newValue } : p));
                            } else {
                              setPills([...pills, { pillId: valueSetting.id, dosage: newValue }]);
                            }
                          }}
                        />
                        {pillDosage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPills(pills.filter((p) => p.pillId !== valueSetting.id))}
                            className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                          >
                            <X className="size-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Ad-Hoc Medications Section */}
                {(pillsSettings.length > 0 || adHocMeds.length > 0) && (
                  <div className="space-y-3 py-4 border-t-1 border-border">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">

                        <Label>{t("calendar.otherMedications") || "Other Medications"}</Label>
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => setAddAdHocDialogOpen(true)}>
                        <Plus className="size-4" />
                        {t("calendar.addMed") || "Add"}
                      </Button>
                    </div>
                    {adHocMeds.length > 0 && (
                      <div className="space-y-2">
                        {adHocMeds.map((med) => {
                          const isValue = med.type === "value";
                          const isTaken = med.taken !== false;
                          return (
                            <div key={med.id} className="flex items-center gap-3 p-3 border border-border dark:border-slate-100/20 rounded-lg transition-colors">
                              {!isValue && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleAdHocTaken(med.id)}
                                  className={cn(
                                    "h-7 w-7 rounded-lg flex-shrink-0 cursor-pointer border-2 flex items-center justify-center transition-colors",
                                    isTaken ? "bg-blue-600 border-blue-600" : "border-gray-400 dark:border-gray-600",
                                  )}
                                >
                                  {isTaken && <Check className="h-4 w-4 text-white" />}
                                </button>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={cn(!isValue && !isTaken && "text-muted-foreground line-through")}>
                                    {med.name}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {med.dosage} {t(`units.${med.unit}`) || med.unit}
                                  </span>
                                  {!isValue && med.notificationEnabled && (
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                                      <Bell className="h-3 w-3 text-indigo-700 dark:text-indigo-400" />
                                      <span className="text-xs text-indigo-700 dark:text-indigo-400 font-medium">{med.notificationTime}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditAdHocMed(med)}
                                className="h-10 w-10 p-0 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 flex-shrink-0"
                              >
                                <Pencil className="size-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}


              </div>

              {/* Note */}
              <Button
                onClick={() => setNoteDialogOpen(true)}
                variant="outline"
                className="w-full mt-4 max-w-full min-h-[100px] p-4 text-left items-start justify-start !font-normal"
              >
                {note ? (
                  <span className="text-foreground max-w-full line-clamp-3 text-wrap"><span className="max-w-full text-muted-foreground">{t("calendar.note")}:</span> {note}</span>
                ) : (
                  <span className="text-muted-foreground">{t("day.notePlaceholder")}</span>
                )}
              </Button>

            </motion.div>
          </AnimatePresence>
        </motion.div>
          <div className="flex w-full gap-2 mt-4">
            <Button variant="destructive" onClick={onClearDay}>
              <Trash2 className="size-4" />
            </Button>
            <Button variant="outline" onClick={onCancel} className="flex-1">
              {t("basic.cancel") || "Cancel"}
            </Button>
            <Button onClick={handleSave} className="flex-1">
              <Check className="size-5" />
            </Button>
          </div>
      </DialogContent>

      <NoteDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        note={note}
        onSave={setNote}
      />

      <EditTagDialog
        open={editTagDialogOpen}
        onOpenChange={setEditTagDialogOpen}
        selectedDate={selectedDate}
        entries={entries}
        isDarkMode={isDarkMode}
        weekStartsOnMonday={weekStartsOnMonday}
        onApply={onUpdateGroupedTag}
      />
    </Dialog>
  );
}
