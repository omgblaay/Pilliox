export const DAYS = [
  { value: 0, labelKey: "days.sun", fallback: "Sun" },
  { value: 1, labelKey: "days.mon", fallback: "Mon" },
  { value: 2, labelKey: "days.tue", fallback: "Tue" },
  { value: 3, labelKey: "days.wed", fallback: "Wed" },
  { value: 4, labelKey: "days.thu", fallback: "Thu" },
  { value: 5, labelKey: "days.fri", fallback: "Fri" },
  { value: 6, labelKey: "days.sat", fallback: "Sat" },
] as const;

export const UNIT_OPTIONS = [
  "none",
  "tablets",
  "capsules",
  "drops",
  "pieces",
  "units",
  "kg",
  "mg",
  "g",
  "ml",
  "mcg",
  "IU",
  "mmoll",
  "mgdl",
] as const;

const UNIT_ALIASES: Record<string, (typeof UNIT_OPTIONS)[number]> = {
  "-": "none",
  none: "none",
  tablet: "tablets",
  tablets: "tablets",
  pill: "tablets",
  pills: "tablets",
  capsule: "capsules",
  capsules: "capsules",
  drop: "drops",
  drops: "drops",
  piece: "pieces",
  pieces: "pieces",
  unit: "units",
  units: "units",
  kg: "kg",
  mg: "mg",
  g: "g",
  ml: "ml",
  mcg: "mcg",
  iu: "IU",
  IU: "IU",
  "mmol/l": "mmoll",
  "mmol/L": "mmoll",
  mmoll: "mmoll",
  "mg/dl": "mgdl",
  "mg/dL": "mgdl",
  mgdl: "mgdl",
};

export const normalizeUnit = (unit?: string) => {
  const trimmedUnit = (unit ?? "").trim();
  const normalized = UNIT_ALIASES[trimmedUnit] ?? UNIT_ALIASES[trimmedUnit.toLowerCase()];
  return normalized && normalized !== "none" ? normalized : undefined;
};

export const getUnitLabel = (unit: string | undefined, t: (key: string) => string) => {
  const normalizedUnit = normalizeUnit(unit);
  if (!normalizedUnit) return "";

  const calendarKey = `calendar.units.${normalizedUnit}`;
  const calendarLabel = t(calendarKey);
  if (calendarLabel && calendarLabel !== calendarKey) return calendarLabel;

  const rootKey = `units.${normalizedUnit}`;
  const rootLabel = t(rootKey);
  if (rootLabel && rootLabel !== rootKey) return rootLabel;

  return normalizedUnit;
};

export const formatDateInputValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const diffCalendarDays = (date: Date, startDate: Date) => {
  const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  return Math.floor((current.getTime() - start.getTime()) / 86_400_000);
};
