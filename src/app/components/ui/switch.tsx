"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "./utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // Base styles - Glass iOS style
        "peer inline-flex h-[31px] w-[51px] shrink-0 items-center rounded-full border-2 border-transparent transition-all duration-300 outline-none backdrop-blur-xl",
        // Unchecked state - light mode (frosted glass effect)
        "data-[state=unchecked]:bg-black/[0.06] data-[state=unchecked]:shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)]",
        // Unchecked state - dark mode (frosted glass effect)
        "dark:data-[state=unchecked]:bg-white/[0.15] dark:data-[state=unchecked]:shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]",
        // Checked state - light mode (brand blue with glass effect)
        "data-[state=checked]:bg-[#155dfc] data-[state=checked]:shadow-[inset_0_1px_3px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(21,93,252,0.4)]",
        // Checked state - dark mode
        "dark:data-[state=checked]:bg-[#3b7fff] dark:data-[state=checked]:shadow-[inset_0_1px_3px_rgba(0,0,0,0.2),0_0_0_0.5px_rgba(59,127,255,0.3)]",
        // Focus styles
        "focus-visible:ring-4 focus-visible:ring-blue-500/25 focus-visible:ring-offset-0",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-40",
        // Active/pressed state
        "active:scale-[0.98]",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          // Thumb base styles - Glass iOS style with enhanced shadow
          "pointer-events-none block h-[27px] w-[27px] rounded-full transition-all duration-300 ease-out",
          // Thumb color - white with glass effect
          "bg-white shadow-[0_2px_4px_rgba(0,0,0,0.1),0_3px_8px_rgba(0,0,0,0.12),0_0_0_0.5px_rgba(0,0,0,0.04)]",
          // Dark mode thumb
          "dark:bg-white dark:shadow-[0_2px_4px_rgba(0,0,0,0.3),0_3px_10px_rgba(0,0,0,0.25),0_0_0_0.5px_rgba(255,255,255,0.1)]",
          // Position - unchecked (with slight padding)
          "data-[state=unchecked]:translate-x-[1px]",
          // Position - checked (with slight padding)
          "data-[state=checked]:translate-x-[21px]",
          // Scale effect on state change
          "data-[state=checked]:scale-[0.96] data-[state=unchecked]:scale-100",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };