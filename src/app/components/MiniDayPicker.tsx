import { useTranslation } from "react-i18next";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  format,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "./ui/utils";
import { Label } from "./ui/label";

interface DayProps {
  className?: string;
  highlighted?: boolean;
}

interface HighlightColor {
  hex: string;
  dark: string;
}

interface MiniDayPickerProps {
  month: Date;
  onMonthChange: (month: Date) => void;
  monthLabel: string;
  weekStartsOnMonday: boolean;
  highlightColor: HighlightColor;
  isDarkMode: boolean;
  label?: string;
  getDayProps: (dateKey: string, isCurrentMonth: boolean) => DayProps;
  onDayClick: (dateKey: string) => void;
}

const TEXT_ON_LIGHT = "#111827"; // gray-900
const TEXT_ON_DARK = "#f3f4f6";  // gray-100

function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

export function MiniDayPicker({
  month,
  onMonthChange,
  monthLabel,
  weekStartsOnMonday,
  highlightColor,
  isDarkMode,
  label,
  getDayProps,
  onDayClick,
}: MiniDayPickerProps) {
  const highlightBg = isDarkMode ? highlightColor.dark : highlightColor.hex;
  const highlightText = isLightColor(highlightBg) ? TEXT_ON_LIGHT : TEXT_ON_DARK;
  const { t } = useTranslation();
  const dayHeaders = weekStartsOnMonday
    ? [
        t("days.mon"),
        t("days.tue"),
        t("days.wed"),
        t("days.thu"),
        t("days.fri"),
        t("days.sat"),
        t("days.sun"),
      ]
    : [
        t("days.sun"),
        t("days.mon"),
        t("days.tue"),
        t("days.wed"),
        t("days.thu"),
        t("days.fri"),
        t("days.sat"),
      ];
  const pickerMonth = startOfMonth(month);
  const pickerStart = startOfWeek(pickerMonth, { weekStartsOn: weekStartsOnMonday ? 1 : 0 });
  const pickerEnd = endOfWeek(endOfMonth(pickerMonth), { weekStartsOn: weekStartsOnMonday ? 1 : 0 });
  const pickerDays = eachDayOfInterval({ start: pickerStart, end: pickerEnd });

  return (
    <div className="space-y-1.5">
      
      <div className="flex items-center justify-between">
        <Label className="text-foreground text-xs">
          {t("nav.addDays")}</Label>
        <div className="flex items-center gap-1 ml-auto">
          <button
            type="button"
            onClick={() => onMonthChange(subMonths(month, 1))}
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          <span className="text-xs font-medium px-1">{monthLabel}</span>
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(month, 1))}
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted transition-colors"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {dayHeaders.map((h, i) => (
          <div key={i} className="text-sm text-muted-foreground py-0.5">
            {h}
          </div>
        ))}
        {pickerDays.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const isCurrentMonth = isSameMonth(day, pickerMonth);
          const { className, highlighted } = getDayProps(dateKey, isCurrentMonth);
          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onDayClick(dateKey)}
              className={cn(
                "rounded-md text-sm py-1 !font-normal transition-colors leading-5",
                !isCurrentMonth && "opacity-30",
                className,
              )}
              style={highlighted ? { backgroundColor: highlightBg, color: highlightText } : undefined}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
