import React from "react";
import { format } from "date-fns";
import { Check, X } from "lucide-react";
import { ColorPicker } from "./ColorPicker";
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

export const COLORS = [
  { name: "Blue", value: "bg-blue-100 border-blue-300 text-blue-700", dark: "#1E3A8A", hex: "#DBEAFE" },
  { name: "Green", value: "bg-green-100 border-green-300 text-green-700", dark: "#065F46", hex: "#D1FAE5" },
  { name: "Purple", value: "bg-purple-100 border-purple-300 text-purple-700", dark: "#6B21A8", hex: "#F3E8FF" },
  { name: "Pink", value: "bg-pink-100 border-pink-300 text-pink-700", dark: "#9F1239", hex: "#FCE7F3" },
  { name: "Yellow", value: "bg-yellow-100 border-yellow-300 text-yellow-700", dark: "#92400E", hex: "#FEF3C7" },
  { name: "Orange", value: "bg-orange-100 border-orange-300 text-orange-700", dark: "#9A3412", hex: "#FFEDD5" },
  { name: "Red", value: "bg-red-100 border-red-300 text-red-700", dark: "#991B1B", hex: "#FEE2E2" },
  { name: "Indigo", value: "bg-indigo-100 border-indigo-300 text-indigo-700", dark: "#3730A3", hex: "#E0E7FF" },
];


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
            colors={COLORS}
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
