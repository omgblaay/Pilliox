import type { Locale } from "date-fns";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, type PanInfo } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Palette,
  Pill,
  Droplet,
  Check,
  X,
  Plus,
  Minus,
  Pencil,
  Bell,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { cn } from "./ui/utils";
import type { PillSetting } from "./PillsSettings";

interface PillDosage {
  pillId: string;
  dosage: number;
}

interface AdHocMedication {
  id: string;
  name: string;
  dosage: number;
  unit: string;
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

function isLightColor(color: string): boolean {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

function getColorForTheme(storedColor: string, isDarkMode: boolean): string {
  if (!isDarkMode) return storedColor;
  const DARK_COLORS: Record<string, string> = {
    "#DBEAFE": "#1E3A8A",
    "#D1FAE5": "#065F46",
    "#F3E8FF": "#6B21A8",
    "#FCE7F3": "#9F1239",
    "#FEF3C7": "#92400E",
    "#FFEDD5": "#9A3412",
    "#FEE2E2": "#991B1B",
    "#E0E7FF": "#3730A3",
  };
  return DARK_COLORS[storedColor.toUpperCase()] ?? DARK_COLORS[storedColor] ?? storedColor;
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
  // Sub-dialog triggers
  setNoteDialogOpen: (v: boolean) => void;
  setTempNote: (v: string) => void;
  setDeleteConfirmOpen: (v: boolean) => void;
  setAddAdHocDialogOpen: (v: boolean) => void;
  // Handlers
  navigateToPreviousDay: () => void;
  navigateToNextDay: () => void;
  handleDayModalSwipe: (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
  formatDialogDate: (date: Date) => string;
  startEditingTag: () => void;
  handleSave: () => void;
  onCancel: () => void;
  onClearDay: () => void;
  handleRemoveAdHocMed: (id: string) => void;
  handleEditAdHocMed: (med: AdHocMedication) => void;
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
  setNoteDialogOpen,
  setTempNote,
  setDeleteConfirmOpen,
  setAddAdHocDialogOpen,
  navigateToPreviousDay,
  navigateToNextDay,
  handleDayModalSwipe,
  formatDialogDate,
  startEditingTag,
  handleSave,
  onCancel,
  onClearDay,
  handleRemoveAdHocMed,
  handleEditAdHocMed,
  dateLocale,
}: EditDayDialogProps) {
  const { t } = useTranslation();

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
        <DialogHeader>
          <DialogTitle className="flex-1 ">
            {t("calendar.day", { count: selectedDates.size })}
          </DialogTitle>
        </DialogHeader>

        <div className="px-2 py-2 rounded-full bg-accent">
          <div className="flex rounded-full items-center justify-between gap-2">
            <Button variant="ghost" size="icon" onClick={navigateToPreviousDay}>
              <ChevronLeft />
            </Button>
            <motion.div
              className="flex-1 overflow-hidden"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDayModalSwipe}
            >
              <AnimatePresence mode="wait" initial={false} custom={swipeDirectionRef.current}>
                <motion.div
                  key={selectedDate ? format(selectedDate, "yyyy-MM-dd") : "none"}
                  custom={swipeDirectionRef.current}
                  variants={headerSlideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="text-foreground text-center flex-1 font-normal"
                >
                  {selectedDate && formatDialogDate(selectedDate)}
                </motion.div>
              </AnimatePresence>
            </motion.div>
            <Button variant="ghost" size="icon" onClick={navigateToNextDay}>
              <ChevronRight />
            </Button>
          </div>
        </div>

        {/* Content */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDayModalSwipe}
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
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        <Palette className="h-4 w-4 text-orange-700 dark:text-orange-400" />
                      </div>
                      <Label>{t("calendar.colorTag")}</Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmOpen(true)}
                      className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <X className="h-2 w-2" />
                      {t("calendar.removeTag")}
                    </Button>
                  </div>

                  {/* Tag Display */}
                  <div
                    className="min-h-12 rounded-lg border flex items-center px-4 py-2 relative group"
                    style={{
                      backgroundColor: selectedDate
                        ? entries[format(selectedDate, "yyyy-MM-dd")]?.color
                          ? getColorForTheme(entries[format(selectedDate, "yyyy-MM-dd")].color || "", isDarkMode)
                          : undefined
                        : undefined,
                      borderColor: selectedDate
                        ? entries[format(selectedDate, "yyyy-MM-dd")]?.color
                          ? getColorForTheme(entries[format(selectedDate, "yyyy-MM-dd")].color || "", isDarkMode)
                          : undefined
                        : undefined,
                    }}
                  >
                    <span
                      className="text-sm mr-4"
                      style={{
                        color:
                          entries[format(selectedDate, "yyyy-MM-dd")]?.color &&
                            isLightColor(getColorForTheme(entries[format(selectedDate, "yyyy-MM-dd")]?.color || "", isDarkMode))
                            ? "#111827"
                            : "#f3f4f6",
                      }}
                    >
                      {entries[format(selectedDate, "yyyy-MM-dd")]?.tag || t("calendar.noTag")}
                    </span>

                    {/* Grouped Days */}
                    {(() => {
                      const currentEntry = entries[format(selectedDate, "yyyy-MM-dd")];
                      if (!currentEntry?.color || !currentEntry?.tag) return null;
                      const groupedDays = findGroupedDays(currentEntry.color, currentEntry.tag);
                      const dayRanges = formatDayRanges(groupedDays);
                      if (groupedDays.length <= 1) return null;
                      const textColor = isLightColor(getColorForTheme(currentEntry.color, isDarkMode)) ? "#6b7280" : "#d1d5db";
                      return (
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          {dayRanges.map((range, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded text-xs font-medium"
                              style={{
                                backgroundColor: isLightColor(getColorForTheme(currentEntry.color!, isDarkMode))
                                  ? "rgba(0,0,0,0.1)"
                                  : "rgba(255,255,255,0.2)",
                                color: textColor,
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
                      className="absolute right-2 top-2 h-8 w-8 rounded-lg flex items-center justify-center group-hover:opacity-100 transition-opacity hover:bg-white/20"
                      style={{
                        color:
                          entries[format(selectedDate, "yyyy-MM-dd")]?.color &&
                            isLightColor(getColorForTheme(entries[format(selectedDate, "yyyy-MM-dd")]?.color || "", isDarkMode))
                            ? "#111827"
                            : "#f3f4f6",
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                {/* Pills Section */}
                {pillsSettings.filter((ps) => (ps.type || "pills") === "pills").length > 0 && (

                  <div className="space-y-2">
                    {pillsSettings
                      .filter((ps) => (ps.type || "pills") === "pills")
                      .map((pillSetting) => {
                        const pillDosage = pills.find((p) => p.pillId === pillSetting.id);
                        const isSelected = !!pillDosage;
                        const currentDosage = isSelected
                          ? pillDosage!.dosage
                          : (dosageOverrides[pillSetting.id] ?? pillSetting.defaultDosage);
                        return (
                          <div key={pillSetting.id} className="flex items-center gap-3 p-3 border rounded-lg border-slate-750  hover:bg-muted/30 transition-colors">
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
                                isSelected ? "bg-blue-600" : "border-gray-400 dark:border-gray-600",
                              )}
                            >
                              {isSelected && <Check className="h-4 w-4 text-white" />}
                            </button>
                            {pillSetting.color && (
                              <div className="h-3 w-3 rounded-full border border-gray-300 dark:border-gray-600" style={{ backgroundColor: pillSetting.color }} />
                            )}
                            <span className={cn("flex-1", !isSelected && "text-muted-foreground")}>
                              {pillSetting.name}
                            </span>
                            <div className="flex items-center border border-[#4d4c54] rounded-md overflow-hidden h-12">
                              <button
                                type="button"
                                onClick={() => {
                                  const newDosage = Math.max(0, currentDosage - 0.5);
                                  if (isSelected) {
                                    setPills(pills.map((p) => p.pillId === pillSetting.id ? { ...p, dosage: newDosage } : p));
                                  } else {
                                    setDosageOverrides((prev) => ({ ...prev, [pillSetting.id]: newDosage }));
                                  }
                                }}
                                className="px-4 h-full text-muted-foreground hover:bg-muted transition-colors"
                              >
                                <Minus className="size-4" />
                              </button>
                              <input
                                type="number"
                                min="0"
                                step="0.25"
                                value={currentDosage}
                                onChange={(e) => {
                                  const newDosage = parseFloat(e.target.value) || 0;
                                  if (isSelected) {
                                    setPills(pills.map((p) => p.pillId === pillSetting.id ? { ...p, dosage: newDosage } : p));
                                  } else {
                                    setDosageOverrides((prev) => ({ ...prev, [pillSetting.id]: newDosage }));
                                  }
                                }}
                                className="w-10 text-sm font-medium text-center bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newDosage = currentDosage + 0.5;
                                  if (isSelected) {
                                    setPills(pills.map((p) => p.pillId === pillSetting.id ? { ...p, dosage: newDosage } : p));
                                  } else {
                                    setDosageOverrides((prev) => ({ ...prev, [pillSetting.id]: newDosage }));
                                  }
                                }}
                                className="px-4 h-full text-muted-foreground hover:bg-muted transition-colors"
                              >
                                <Plus className="size-4" />
                              </button>
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
                    <div key={valueSetting.id} className="flex items-center gap-3 p-3 border rounded-lg border-slate-750  hover:bg-muted/30 transition-colors">
                      <div className="flex items-center flex-row gap-2 flex-1">

                        <div className="h-3 w-3 rounded-full border border-gray-300 dark:border-gray-600" style={{ backgroundColor: valueSetting.color }} />

                        <Label htmlFor={`value-${valueSetting.id}`}>{valueSetting.name}</Label>
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          id={`value-${valueSetting.id}`}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="flex-1"
                          value={currentValue}
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
                          <button
                            type="button"
                            onClick={() => setPills(pills.filter((p) => p.pillId !== valueSetting.id))}
                            className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </button>
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
                        <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                          <Pill className="size-4 text-amber-700 dark:text-amber-400" />
                        </div>
                        <Label>{t("calendar.otherMedications") || "Other Medications"}</Label>
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => setAddAdHocDialogOpen(true)}>
                        <Plus className="size-4" />
                        {t("calendar.addMed") || "Add"}
                      </Button>
                    </div>
                    {adHocMeds.length > 0 && (
                      <div className="space-y-2">
                        {adHocMeds.map((med) => (
                          <div key={med.id} className="flex items-center gap-3 p-3 border rounded-lg transition-colors">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAdHocMed(med.id)}
                              className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                            >
                              <X className="size-4" />
                            </Button>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {med.name} –
                                <span className="text-gray-500">{med.dosage} {t(`calendar.units.${med.unit}`) || med.unit}</span>
                                {med.notificationEnabled && (
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
                              className="h-10 w-10 p-0 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950"
                            >
                              <Pencil className="size-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Legacy INR Section */}
                {pillsSettings.length === 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Droplet className="h-4 w-4 text-green-700 dark:text-green-400" />
                      </div>
                      <Label htmlFor="amount">INR</Label>
                    </div>
                    <Input
                      id="amount"
                      type="number"
                      step="0.5"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Note */}
              <Button
                onClick={() => {
                  setTempNote(note);
                  setNoteDialogOpen(true);
                }}
                variant="outline"
                className="w-full mt-4 max-w-full min-h-[100px] p-4 text-left items-start justify-start !font-normal"
              >
                {note ? (
                  <span className="text-foreground max-w-full line-clamp-3 text-wrap"><span className="max-w-full text-muted-foreground">{t("calendar.note")}:</span> {note}</span>
                ) : (
                  <span className="text-muted-foreground">{t("day.notePlaceholder")}</span>
                )}
              </Button>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={onCancel} className="flex-1">
                  {t("calendar.cancel") || "Cancel"}
                </Button>
                <Button variant="destructive"  onClick={onClearDay} className="flex-1">
                  {t("day.delete") || "Clear"}
                </Button>
                <Button onClick={handleSave} className="flex-1">
                  {t("day.saveChanges")}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
