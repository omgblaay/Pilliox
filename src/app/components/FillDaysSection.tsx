import { useTranslation } from "react-i18next";
import { X as XIcon } from "lucide-react";
import { Button } from "./ui/button";

export type FillRange = "dont" | "week" | "month" | "year" | "custom";

interface FillDaysSectionProps {
  range: FillRange;
  onRangeChange: (r: FillRange) => void;
  from: string;
  onFromChange: (v: string) => void;
  to: string;
  onToChange: (v: string) => void;
}

const RANGES: { value: FillRange; labelKey: string; fallback: string }[] = [
  { value: "dont",   labelKey: "dataRange.dont",      fallback: "" },
  { value: "week",   labelKey: "dataRange.thisWeek",  fallback: "Week" },
  { value: "month",  labelKey: "dataRange.thisMonth", fallback: "Month" },
  { value: "year",   labelKey: "dataRange.thisYear",  fallback: "Year" },
  { value: "custom", labelKey: "dataRange.range",     fallback: "Range" },
];

export function FillDaysSection({
  range,
  onRangeChange,
  from,
  onFromChange,
  to,
  onToChange,
}: FillDaysSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <div className="flex gap-1 p-1 rounded-[18px] bg-gray-100 dark:bg-[#2a2a2a]">
        {RANGES.map((r) => (
          <Button
            key={r.value}
            type="button"
            variant="tabGroup"
            data-state={range === r.value ? "active" : "inactive"}
            className={`${r.value === "dont" ? "flex-1 px-1" : "flex-2"} text-xs`}
            onClick={() => onRangeChange(r.value)}
          >
            {r.value === "dont" ? <XIcon className="size-4" /> : (t(r.labelKey) || r.fallback)}
          </Button>
        ))}
      </div>

      {range === "custom" && (
        <div className="flex gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
          />
        </div>
      )}
    </div>
  );
}
