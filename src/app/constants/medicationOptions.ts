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
  "": "none",
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
