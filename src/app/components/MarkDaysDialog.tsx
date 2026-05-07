import React from "react";
import { format } from "date-fns";
import { Check, X } from "lucide-react";
import { ColorPicker, COLORS } from "./ColorPicker";
import { useTranslation } from "react-i18next";
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
import { MiniDayPicker } from "./MiniDayPicker";



interface MarkDaysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDates: Set<string>;
  setSelectedDates: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectedColor: typeof COLORS[0];
  setSelectedColor: (color: typeof COLORS[0]) => void;
  multiTag: string;
  setMultiTag: (tag: string) => void;
  multiPickerMonth: Date;
  setMultiPickerMonth: (month: Date) => void;
  isDarkMode: boolean;
  weekStartsOnMonday: boolean;
  getMonthName: (date: Date) => string;
  onApply: () => void;
}

export function MarkDaysDialog({
  open,
  onOpenChange,
  selectedDates,
  setSelectedDates,
  selectedColor,
  setSelectedColor,
  multiTag,
  setMultiTag,
  multiPickerMonth,
  setMultiPickerMonth,
  isDarkMode,
  weekStartsOnMonday,
  getMonthName,
  onApply,
}: MarkDaysDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {t("multiSelect.title", { count: selectedDates.size })}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t("multiSelect.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Label htmlFor="multi-tag">
            {t("multiSelect.tagLabel")}
          </Label>
          <Input
            id="multi-tag"
            placeholder={t("multiSelect.tagPlaceholder")}
            value={multiTag}
            onChange={(e) => setMultiTag(e.target.value)}
            maxLength={50}
            className="mb-8"
          />

          {/* Color Picker */}
          <ColorPicker
            selectedColor={selectedColor}
            onSelect={(color) => setSelectedColor(color as typeof COLORS[0])}
            isDarkMode={isDarkMode}
          />

          {/* Mini day picker */}
          <MiniDayPicker
            month={multiPickerMonth}
            onMonthChange={setMultiPickerMonth}
            monthLabel={`${getMonthName(multiPickerMonth)} ${format(multiPickerMonth, "yyyy")}`}
            weekStartsOnMonday={weekStartsOnMonday}
            highlightColor={selectedColor}
            isDarkMode={isDarkMode}
            getDayProps={(dateKey) => {
              const isInSelection = selectedDates.has(dateKey);
              return {
                className: cn("cursor-pointer", !isInSelection && "hover:bg-accent"),
                highlighted: isInSelection,
              };
            }}
            onDayClick={(dateKey) => {
              setSelectedDates((prev) => {
                const next = new Set(prev);
                next.has(dateKey) ? next.delete(dateKey) : next.add(dateKey);
                return next;
              });
            }}
          />
        </div>

        <div className="flex gap-2 mt-2">
          <Button
            variant="secondary"
            onClick={() => {
              onOpenChange(false);
              setMultiTag("");
            }}
            className="flex-1"
          >
            <X className="h-3 w-3 mr-1" />
            {t("calendar.cancel")}
          </Button>
          <Button
            onClick={onApply}
            className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
          >
            <Check className="h-3 w-3 mr-1" />
            {t("calendar.apply")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
