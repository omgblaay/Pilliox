import { Check } from "lucide-react";
import { cn } from "./ui/utils";

export interface PickerColor {
  name: string;
  hex?: string;   // day-group colors
  dark?: string;  // day-group dark-mode variant
  value?: string; // pill colors
}

function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

interface ColorPickerProps {
  colors: PickerColor[];
  selectedColor: PickerColor;
  onSelect: (color: PickerColor) => void;
  isDarkMode?: boolean;
  /** "square" (default) = grid of rounded rectangles with checkmark; "circle" = flex-wrap circles */
  variant?: "square" | "circle";
}

export function ColorPicker({
  colors,
  selectedColor,
  onSelect,
  isDarkMode = false,
  variant = "square",
}: ColorPickerProps) {
  return (
    <div className={cn(
      variant === "circle"
        ? "flex flex-wrap gap-1 w-full"
        : "grid grid-cols-4 gap-2",
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
                "flex-1 min-w-0 h-10 cursor-pointer rounded-full border-2 transition-all",
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
              "h-10 rounded-lg border-2 transition-all",
              isSelected && "ring-2 ring-blue-600 dark:ring-blue-500 ring-offset-2 dark:ring-offset-card",
            )}
            style={{ backgroundColor: bg, borderColor: bg }}
          >
            {isSelected && (
              <Check
                className="h-4 w-4 mx-auto"
                style={{ color: isLightColor(bg) ? "#111827" : "#f3f4f6" }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
