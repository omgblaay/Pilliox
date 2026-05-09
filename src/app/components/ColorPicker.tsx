import { Check } from "lucide-react";
import { cn } from "./ui/utils";

export interface PickerColor {
  name: string;
  hex?: string;   // day-group colors
  dark?: string;  // day-group dark-mode variant
  value?: string; // pill colors
}

{/*export const COLORS: PickerColor[] = [
  { name: "Blue", hex: "#3b82f6" },
  { name: "Green", hex: "#22c55e" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Red", hex: "#ef4444" },
  { name: "Purple", hex: "#a855f7" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Orange", hex: "#f97316" },
]; */}

export const COLORS: PickerColor[] = [
  { name: "Blue",   hex: "#3b82f6", dark: "#1E3A8A", value: "bg-blue-500/10 border-green-800 text-blue-700" },
  { name: "Green",  hex: "#22c55e", dark: "#166534", value: "bg-green-500/10 border-green-300 text-green-700" },
  { name: "Purple", hex: "#a855f7", dark: "#6B21A8", value: "bg-purple-500/10 border-purple-300 text-purple-700" },
  { name: "Pink",   hex: "#ec4899", dark: "#9F1239", value: "bg-pink-500/10 border-pink-300 text-pink-700" },
  { name: "Yellow", hex: "#eab308", dark: "#92400E", value: "bg-yellow-500/10 border-yellow-300 text-yellow-700" },
  { name: "Orange", hex: "#f97316", dark: "#9A3412", value: "bg-orange-500/10 border-orange-300 text-orange-700" },
  { name: "Red",    hex: "#ef4444", dark: "#991B1B", value: "bg-red-500/10 border-red-300 text-red-700" },
  { name: "Indigo", hex: "#6366F1", dark: "#3730A3", value: "bg-indigo-500/10 border-indigo-300 text-indigo-700" },
];

function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

interface ColorPickerProps {
  colors?: PickerColor[];
  selectedColor: PickerColor;
  onSelect: (color: PickerColor) => void;
  isDarkMode?: boolean;
  /** "square" (default) = grid of rounded rectangles with checkmark; "circle" = flex-wrap circles */
  variant?: "square" | "circle";
}

export function ColorPicker({
  colors = COLORS,
  selectedColor,
  onSelect,
  isDarkMode = false,
  variant = "square",
}: ColorPickerProps) {
  return (
    <div className={cn(
      variant === "circle"
        ? "flex flex-wrap gap-1 w-full"
        : "flex flex-wrap w-full gap-1",
    )}>
      {colors.map((color) => {
        const base = color.hex ?? color.value ?? "";
        const bg = isDarkMode && color.dark ? color.dark : base;
        const isSelected = selectedColor.name === color.name;

        if (variant === "circle") {
          return (
            <button
              key={color.name}
              type="button"
              onClick={() => onSelect(color)}
              title={color.name}
              className={cn(
                "min-w-10 h-10 cursor-pointer rounded-full border-2 flex-1 transition-all",
                isSelected ? "border-black dark:border-white scale-110" : "border-transparent",
              )}
              style={{ backgroundColor: bg }}
            />
          );
        }

        return (
          <button
            key={color.name}
            type="button"
            onClick={() => onSelect(color)}
            className={cn(
              "h-10 rounded-lg flex-1 border-2 transition-all",
              isSelected && "ring-2 ring-blue-600 dark:ring-blue-500 ring-offset-2 dark:ring-offset-card",
            )}
            style={{ backgroundColor: bg, borderColor: bg }}
          >
            {isSelected && (
              <Check
                className="size-5 mx-auto"
                style={{ color: isLightColor(bg) ? "#fff" : "#f3f4f6" }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
