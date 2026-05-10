import { useState, useEffect, useCallback } from "react";
import {
  format,
  subDays,
  subMonths,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { useTranslation } from "react-i18next";
import { Pencil, CalendarDays } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";
import type { PillSetting, ScheduleType } from "./PillsSettings";
import { fetchWithTokenRefresh } from "../../utils/api-client";
import { DAYS } from "../constants/medicationOptions";

type TimeRange = "week" | "month" | "6m" | "year";

interface GraphPoint {
  label: string;
  dosage: number;
}

interface MedicationDetailPageProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pill: PillSetting | null;
  projectId: string;
  onEdit: () => void;
  onEditSchedule: () => void;
}

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "week",  label: "Week" },
  { value: "month", label: "Month" },
  { value: "6m",    label: "6M" },
  { value: "year",  label: "Year" },
];

function scheduleTypeSummary(pill: PillSetting, t: (k: string) => string): string {
  const type = pill.scheduleType;
  if (!type) return t("schedule.notSet") || "Not set";
  if (type === "daily")         return t("schedule.daily")        || "Daily";
  if (type === "as_needed")     return t("schedule.asNeeded")     || "As needed";
  if (type === "cyclic")        return `${t("schedule.everyXDays") || "Every"} ${pill.scheduleCycleDays ?? 2} ${t("schedule.days") || "days"}`;
  if (type === "specific_days") {
    const selected = (pill.scheduleSpecificDays ?? [])
      .map((dayValue) => {
        const day = DAYS.find((item) => item.value === dayValue);
        return day ? t(day.labelKey) || day.fallback : "";
      })
      .filter(Boolean)
      .join(", ");
    return selected || (t("schedule.specificDays") || "Specific days");
  }
  return "";
}

export function MedicationDetailPage({
  open,
  onOpenChange,
  pill,
  projectId,
  onEdit,
  onEditSchedule,
}: MedicationDetailPageProps) {
  const { t } = useTranslation();
  const [range, setRange] = useState<TimeRange>("month");
  const [graphData, setGraphData] = useState<GraphPoint[]>([]);
  const [loadingGraph, setLoadingGraph] = useState(false);

  const fetchGraphData = useCallback(async () => {
    if (!pill) return;
    setLoadingGraph(true);
    try {
      const now = new Date();
      let points: GraphPoint[] = [];

      if (range === "week") {
        const days = eachDayOfInterval({
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        });
        const mk = format(now, "yyyy-MM");
        let entries: Record<string, any> = {};
        try {
          const r = await fetchWithTokenRefresh(
            `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/calendar/${mk}`,
          );
          if (r.ok) entries = (await r.json()).entries ?? {};
        } catch {}
        // also fetch adjacent month if week crosses boundary
        const prevMk = format(subDays(days[0], 0), "yyyy-MM");
        if (prevMk !== mk) {
          try {
            const r = await fetchWithTokenRefresh(
              `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/calendar/${prevMk}`,
            );
            if (r.ok) entries = { ...((await r.json()).entries ?? {}), ...entries };
          } catch {}
        }
        points = days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dosage = extractDosage(entries[key], pill.id);
          return { label: format(day, "EEE"), dosage };
        });

      } else if (range === "month") {
        const days = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) });
        const mk = format(now, "yyyy-MM");
        let entries: Record<string, any> = {};
        try {
          const r = await fetchWithTokenRefresh(
            `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/calendar/${mk}`,
          );
          if (r.ok) entries = (await r.json()).entries ?? {};
        } catch {}
        points = days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dosage = extractDosage(entries[key], pill.id);
          return { label: format(day, "d"), dosage };
        });

      } else {
        const monthCount = range === "6m" ? 6 : 12;
        const months = Array.from({ length: monthCount }, (_, i) =>
          subMonths(now, monthCount - 1 - i),
        );
        const allEntries: Record<string, Record<string, any>> = {};
        await Promise.all(
          months.map(async (m) => {
            const mk = format(m, "yyyy-MM");
            try {
              const r = await fetchWithTokenRefresh(
                `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/calendar/${mk}`,
              );
              if (r.ok) allEntries[mk] = (await r.json()).entries ?? {};
            } catch {}
          }),
        );
        points = months.map((m) => {
          const mk = format(m, "yyyy-MM");
          const monthEntries = allEntries[mk] ?? {};
          const total = Object.values(monthEntries).reduce(
            (sum, e) => sum + extractDosage(e, pill.id),
            0,
          );
          return { label: format(m, "MMM"), dosage: total };
        });
      }

      setGraphData(points);
    } finally {
      setLoadingGraph(false);
    }
  }, [pill, range, projectId]);

  useEffect(() => {
    if (open && pill) fetchGraphData();
  }, [open, pill, range, fetchGraphData]);

  if (!pill) return null;

  const color = pill.color || "#a855f7";
  const hasTimes = (pill.scheduleTimes?.length ?? 0) > 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="large" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <DialogTitle className="flex-1">{pill.name}</DialogTitle>
              <Button variant="outline" size="icon" onClick={onEdit}>
                <Pencil className="size-4 text-secondary-foreground" />
              </Button>
            </div>
            <DialogDescription className="sr-only">Medication details</DialogDescription>
          </DialogHeader>

          {/* Time range selector */}
          <div className="flex gap-1 p-1 rounded-[18px] bg-gray-100 dark:bg-[#2a2a2a]">
            {TIME_RANGES.map((r) => (
              <Button
                key={r.value}
                type="button"
                variant="tabGroup"
                data-state={range === r.value ? "active" : "inactive"}
                className="flex-1"
                onClick={() => setRange(r.value)}
              >
                {r.label}
              </Button>
            ))}
          </div>

          {/* Graph */}
          <div className="h-48 w-full">
            {loadingGraph ? (
              <div className="h-full flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graphData} barCategoryGap="30%">
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    interval={range === "month" ? 4 : 0}
                  />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                    formatter={(val: number) => [val || "–", pill.name]}
                  />
                  <Bar dataKey="dosage" radius={[4, 4, 0, 0]}>
                    {graphData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={graphData[i].dosage > 0 ? color : "var(--muted)"}
                        fillOpacity={graphData[i].dosage > 0 ? 0.85 : 0.4}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Schedule section */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-muted-foreground" />
                <span className="font-medium text-sm">{t("schedule.title") || "Schedule"}</span>
              </div>
              <Button variant="outline" size="sm" onClick={onEditSchedule}>
                <Pencil className="size-3.5 mr-1" />
                {pill.scheduleType ? (t("schedule.editSchedule") || "Edit Schedule") : (t("schedule.addSchedule") || "Add Schedule")}
              </Button>
            </div>

            {pill.scheduleType ? (
              <div className="rounded-xl bg-muted/40 p-4 space-y-3">
                <p className="text-sm font-medium">{scheduleTypeSummary(pill, t)}</p>
                {hasTimes && (
                  <div className="space-y-1.5">
                    {pill.scheduleTimes!.map((entry, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <span className="font-mono text-muted-foreground w-14">{entry.time}</span>
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: color }}
                        >
                          {entry.dose} {entry.unit ?? pill.unit ?? ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onEditSchedule}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-dashed border-border hover:border-primary hover:bg-muted/40 transition-colors text-left"
              >
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CalendarDays className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-foreground">{t("schedule.noSchedule") || "No schedule set"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("schedule.tapToSet") || "Tap to configure"}</p>
                </div>
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function extractDosage(entry: any, pillId: string): number {
  if (!entry?.pills) return 0;
  try {
    const arr: { pillId: string; dosage: number }[] = JSON.parse(entry.pills);
    const found = arr.find((p) => p.pillId === pillId);
    return found?.dosage ?? 0;
  } catch {
    return 0;
  }
}
