import { useState, useEffect, useCallback } from "react";
import {
  format,
  addMonths,
  addWeeks,
  addYears,
  subMonths,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  startOfYear,
  type Locale,
} from "date-fns";
import { de } from "date-fns/locale/de";
import { enUS } from "date-fns/locale/en-US";
import { pl } from "date-fns/locale/pl";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Pencil, CalendarDays } from "lucide-react";
import { motion, AnimatePresence, type PanInfo } from "motion/react";
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
import type { PillSetting } from "./PillsSettings";
import { fetchWithTokenRefresh } from "../../utils/api-client";
import { DAYS, getUnitLabel } from "../constants/medicationOptions";

type TimeRange = "week" | "month" | "6m" | "year";

interface GraphPoint {
  label: string;
  dosage: number;
  dateLabel: string;
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
  { value: "week",  label: "graph.week" },
  { value: "month", label: "graph.month" },
  { value: "6m",    label: "graph.sixMonthsShort" },
  { value: "year",  label: "graph.year" },
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
  const { t, i18n } = useTranslation();
  const [range, setRange] = useState<TimeRange>("month");
  const [periodAnchor, setPeriodAnchor] = useState(new Date());
  const [periodSwipeDirection, setPeriodSwipeDirection] = useState(0);
  const [graphData, setGraphData] = useState<GraphPoint[]>([]);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const languageCode = (i18n.language || "en").split("-")[0].toLowerCase();
  const dateLocale = languageCode === "de" ? de : languageCode === "pl" ? pl : enUS;

  const periodLabel = getPeriodLabel(range, periodAnchor, dateLocale);

  const movePeriod = useCallback((direction: -1 | 1) => {
    setPeriodSwipeDirection(direction);
    setPeriodAnchor((current) => movePeriodAnchor(current, range, direction));
  }, [range]);

  const handleGraphSwipe = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    if (Math.abs(info.offset.x) <= swipeThreshold) return;
    movePeriod(info.offset.x > 0 ? -1 : 1);
  };

  const fetchGraphData = useCallback(async () => {
    if (!pill) return;
    setLoadingGraph(true);
    try {
      let points: GraphPoint[] = [];

      if (range === "week") {
        const periodStart = startOfWeek(periodAnchor, { weekStartsOn: 1 });
        const days = eachDayOfInterval({
          start: periodStart,
          end: endOfWeek(periodAnchor, { weekStartsOn: 1 }),
        });
        const entries = await fetchEntriesForMonths(
          Array.from(new Set(days.map((day) => format(day, "yyyy-MM")))),
          projectId,
        );
        points = days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dosage = extractDosage(entries[key], pill.id);
          return { label: format(day, "EEE", { locale: dateLocale }), dateLabel: format(day, "MMM d", { locale: dateLocale }), dosage };
        });

      } else if (range === "month") {
        const days = eachDayOfInterval({ start: startOfMonth(periodAnchor), end: endOfMonth(periodAnchor) });
        const entries = await fetchEntriesForMonths([format(periodAnchor, "yyyy-MM")], projectId);
        points = days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dosage = extractDosage(entries[key], pill.id);
          return { label: format(day, "d", { locale: dateLocale }), dateLabel: format(day, "MMM d", { locale: dateLocale }), dosage };
        });

      } else {
        const months = getPeriodMonths(range, periodAnchor);
        const allEntries = await fetchEntriesByMonth(
          months.map((month) => format(month, "yyyy-MM")),
          projectId,
        );
        points = months.map((m) => {
          const mk = format(m, "yyyy-MM");
          const monthEntries = allEntries[mk] ?? {};
          const total = Object.values(monthEntries).reduce(
            (sum, e) => sum + extractDosage(e, pill.id),
            0,
          );
          return { label: format(m, "MMM", { locale: dateLocale }), dateLabel: format(m, "MMMM yyyy", { locale: dateLocale }), dosage: total };
        });
      }

      setGraphData(points);
    } finally {
      setLoadingGraph(false);
    }
  }, [pill, range, periodAnchor, projectId, dateLocale]);

  useEffect(() => {
    if (open && pill) fetchGraphData();
  }, [open, pill, range, fetchGraphData]);

  if (!pill) return null;

  const color = pill.color || "#a855f7";
  const hasTimes = (pill.scheduleTimes?.length ?? 0) > 0;
  const graphTotal = graphData.reduce((sum, point) => sum + point.dosage, 0);
  const graphAverage = graphData.length > 0 ? graphTotal / graphData.length : 0;
  const averageLabel = range === "week" || range === "month"
    ? t("graph.averagePerDay")
    : t("graph.averagePerMonth");
  const unitLabel = getUnitLabel(pill.unit, t);
  const unitSuffix = unitLabel ? ` ${unitLabel}` : "";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="large">
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
          <div className="flex gap-1 p-1 rounded-[18px] sm:mt-0 mt-16 bg-gray-100 dark:bg-[#2a2a2a]">
            {TIME_RANGES.map((r) => (
              <Button
                key={r.value}
                type="button"
                variant="tabGroup"
                data-state={range === r.value ? "active" : "inactive"}
                className="flex-1"
                onClick={() => setRange(r.value)}
              >
                {t(r.label)}
              </Button>
            ))}
          </div>

          {/* Graph */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => movePeriod(-1)}
                aria-label={t("graph.previousPeriod")}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <AnimatePresence mode="wait" initial={false} custom={periodSwipeDirection}>
                <motion.div
                  key={`${range}-${periodLabel}`}
                  custom={periodSwipeDirection}
                  initial={{ opacity: 0, x: periodSwipeDirection * 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: periodSwipeDirection * -16 }}
                  transition={{ duration: 0.18 }}
                  className="min-w-0 flex-1 text-center"
                >
                  <p className="text-sm font-medium text-foreground">{periodLabel}</p>
                </motion.div>
              </AnimatePresence>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => movePeriod(1)}
                aria-label={t("graph.nextPeriod")}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-muted/40 px-3 py-2">
                <p className="text-[11px] font-medium uppercase text-muted-foreground">{t("graph.total")}</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatGraphNumber(graphTotal)}
                  {unitSuffix}
                </p>
              </div>
              <div className="rounded-lg bg-muted/40 px-3 py-2">
                <p className="text-[11px] font-medium uppercase text-muted-foreground">{averageLabel}</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatGraphNumber(graphAverage)}
                  {unitSuffix}
                </p>
              </div>
            </div>

            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={handleGraphSwipe}
              className="h-48 w-full cursor-grab touch-pan-y active:cursor-grabbing"
            >
              {loadingGraph ? (
                <div className="h-full flex items-center justify-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <AnimatePresence mode="wait" initial={false} custom={periodSwipeDirection}>
                  <motion.div
                    key={`${range}-${periodLabel}-chart`}
                    custom={periodSwipeDirection}
                    initial={{ opacity: 0, x: periodSwipeDirection * 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: periodSwipeDirection * -24 }}
                    transition={{ duration: 0.2 }}
                    className="h-full w-full"
                  >
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
                          wrapperStyle={{ zIndex: 50 }}
                          content={({ active, payload }) => (
                            <GraphTooltip
                              active={active}
                              payload={payload}
                              pillName={pill.name}
                              unitLabel={unitLabel}
                              emptyLabel={t("graph.noLoggedDose")}
                            />
                          )}
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
                  </motion.div>
                </AnimatePresence>
              )}
            </motion.div>
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
                          {entry.dose}{getUnitLabel(entry.unit ?? pill.unit, t) ? ` ${getUnitLabel(entry.unit ?? pill.unit, t)}` : ""}
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

function formatGraphNumber(value: number): string {
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(1);
}

function movePeriodAnchor(anchor: Date, range: TimeRange, direction: -1 | 1): Date {
  if (range === "week") return addWeeks(anchor, direction);
  if (range === "month") return addMonths(anchor, direction);
  if (range === "6m") return addMonths(anchor, direction * 6);
  return addYears(anchor, direction);
}

function getPeriodMonths(range: TimeRange, anchor: Date): Date[] {
  if (range === "year") {
    const start = startOfYear(anchor);
    return Array.from({ length: 12 }, (_, index) => addMonths(start, index));
  }

  const end = startOfMonth(anchor);
  return Array.from({ length: 6 }, (_, index) => subMonths(end, 5 - index));
}

function getPeriodLabel(range: TimeRange, anchor: Date, locale: Locale): string {
  if (range === "week") {
    const start = startOfWeek(anchor, { weekStartsOn: 1 });
    const end = endOfWeek(anchor, { weekStartsOn: 1 });
    return `${format(start, "MMM d", { locale })} - ${format(end, "MMM d, yyyy", { locale })}`;
  }

  if (range === "month") {
    return format(anchor, "MMMM yyyy", { locale });
  }

  if (range === "year") {
    return format(anchor, "yyyy", { locale });
  }

  const months = getPeriodMonths(range, anchor);
  return `${format(months[0], "MMM yyyy", { locale })} - ${format(months[months.length - 1], "MMM yyyy", { locale })}`;
}

async function fetchEntriesForMonths(monthKeys: string[], projectId: string): Promise<Record<string, any>> {
  const byMonth = await fetchEntriesByMonth(monthKeys, projectId);
  return Object.values(byMonth).reduce<Record<string, any>>(
    (allEntries, monthEntries) => ({ ...allEntries, ...monthEntries }),
    {},
  );
}

async function fetchEntriesByMonth(monthKeys: string[], projectId: string): Promise<Record<string, Record<string, any>>> {
  const uniqueMonthKeys = Array.from(new Set(monthKeys));
  const monthEntries: Record<string, Record<string, any>> = {};

  await Promise.all(
    uniqueMonthKeys.map(async (monthKey) => {
      try {
        const response = await fetchWithTokenRefresh(
          `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/calendar/${monthKey}`,
        );
        if (response.ok) monthEntries[monthKey] = (await response.json()).entries ?? {};
      } catch {}
    }),
  );

  return monthEntries;
}

function GraphTooltip({
  active,
  payload,
  pillName,
  unitLabel,
  emptyLabel,
}: {
  active?: boolean;
  payload?: Array<{ payload?: GraphPoint }>;
  pillName: string;
  unitLabel: string;
  emptyLabel: string;
}) {
  if (!active || !payload?.length || !payload[0]?.payload) return null;

  const point = payload[0].payload;
  const value = point.dosage > 0
    ? `${point.dosage}${unitLabel ? ` ${unitLabel}` : ""}`
    : emptyLabel;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground">{point.dateLabel}</p>
      <p className="mt-1 text-muted-foreground">
        {pillName}: <span className="text-foreground">{value}</span>
      </p>
    </div>
  );
}
