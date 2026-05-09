import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "./ui/utils";
import { ColorPicker, COLORS, type PickerColor } from "./ColorPicker";
import { MiniDayPicker } from "./MiniDayPicker";

interface CalendarEntry {
  color?: string;
  tag?: string;
}

interface EditTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  entries: Record<string, CalendarEntry>;
  isDarkMode: boolean;
  weekStartsOnMonday: boolean;
  onApply: (text: string, colorHex: string, addDays: Set<string>, removeDays: Set<string>) => void;
}

export function EditTagDialog({
  open,
  onOpenChange,
  selectedDate,
  entries,
  isDarkMode,
  weekStartsOnMonday,
  onApply,
}: EditTagDialogProps) {
  const { t } = useTranslation();
  const [tempTagText, setTempTagText] = useState("");
  const [tempTagColor, setTempTagColor] = useState<PickerColor>(COLORS[0]);
  const [tagAddDays, setTagAddDays] = useState<Set<string>>(new Set());
  const [tagRemoveDays, setTagRemoveDays] = useState<Set<string>>(new Set());
  const [pickerMonth, setPickerMonth] = useState(new Date());

  useEffect(() => {
    if (!open || !selectedDate) return;
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const entry = entries[dateKey];
    if (!entry?.color) return;
    setTempTagText(entry.tag || "");
    setTempTagColor(COLORS.find(c => c.hex?.toLowerCase() === entry.color?.toLowerCase()) || COLORS[0]);
    setTagAddDays(new Set());
    setTagRemoveDays(new Set());
    setPickerMonth(selectedDate);
  }, [open]);

  function getMonthName(date: Date): string {
    const names = ["january","february","march","april","may","june","july","august","september","october","november","december"];
    return t(`months.${names[date.getMonth()]}`);
  }

  function findGroupedDays(color: string, tag: string): string[] {
    return Object.keys(entries).filter((key) => {
      const e = entries[key];
      return e.color === color && (e.tag ?? "") === (tag ?? "");
    });
  }

  function handleClose() {
    setTagAddDays(new Set());
    setTagRemoveDays(new Set());
    onOpenChange(false);
  }

  function handleApply() {
    onApply(tempTagText, tempTagColor.hex ?? "", tagAddDays, tagRemoveDays);
    setTagAddDays(new Set());
    setTagRemoveDays(new Set());
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle className="text-foreground">{t("multiSelect.tagLabel")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            value={tempTagText}
            onChange={(e) => setTempTagText(e.target.value)}
            placeholder="Tag"
            maxLength={50}
          />
          <ColorPicker
            selectedColor={tempTagColor}
            onSelect={(color) => setTempTagColor(color as PickerColor)}
            isDarkMode={isDarkMode}
          />
          {selectedDate && (() => {
            const dateKey = format(selectedDate, "yyyy-MM-dd");
            const currentEntry = entries[dateKey];
            const alreadyGrouped = new Set(
              currentEntry?.color
                ? findGroupedDays(currentEntry.color, currentEntry.tag ?? "")
                : [dateKey],
            );
            return (
              <MiniDayPicker
                month={pickerMonth}
                onMonthChange={setPickerMonth}
                monthLabel={`${getMonthName(pickerMonth)} ${format(pickerMonth, "yyyy")}`}
                weekStartsOnMonday={weekStartsOnMonday}
                highlightColor={tempTagColor}
                isDarkMode={isDarkMode}
                label={t("nav.addDays") || "Days"}
                getDayProps={(key) => {
                  const inGroup = alreadyGrouped.has(key);
                  const selected = tagAddDays.has(key);
                  const markedForRemoval = tagRemoveDays.has(key);
                  return {
                    className: cn(
                      inGroup && !markedForRemoval && "cursor-pointer font-semibold",
                      inGroup && markedForRemoval && "cursor-pointer opacity-90 line-through",
                      !inGroup && !selected && "hover:bg-accent cursor-pointer",
                      !inGroup && selected && "ring-1 ring-offset-1 ring-primary font-semibold cursor-pointer",
                    ),
                    highlighted: (inGroup && !markedForRemoval) || selected,
                  };
                }}
                onDayClick={(key) => {
                  const inGroup = alreadyGrouped.has(key);
                  const markedForRemoval = tagRemoveDays.has(key);
                  if (inGroup) {
                    const canRemove = alreadyGrouped.size - tagRemoveDays.size > 1 || markedForRemoval;
                    if (!canRemove) return;
                    setTagRemoveDays((prev) => {
                      const next = new Set(prev);
                      next.has(key) ? next.delete(key) : next.add(key);
                      return next;
                    });
                  } else {
                    setTagAddDays((prev) => {
                      const next = new Set(prev);
                      next.has(key) ? next.delete(key) : next.add(key);
                      return next;
                    });
                  }
                }}
              />
            );
          })()}
        </div>
        <div className="flex gap-2 mt-2">
          <Button variant="secondary" onClick={handleClose} className="flex-1">
            <X className="h-3 w-3 mr-1" />
            {t("calendar.cancel")}
          </Button>
          <Button onClick={handleApply} className="flex-1">
            <Check className="h-3 w-3 mr-1" />
            {t("calendar.apply")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
