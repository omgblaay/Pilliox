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
  "kg",
  "mg",
  "g",
  "ml",
  "mcg",
  "IU",
  "units",
  "mmol/L",
  "mg/dL",
] as const;

export const normalizeUnit = (unit?: string) =>
  unit && unit !== "none" ? unit : undefined;
