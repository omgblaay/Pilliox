import * as React from "react";

import { cn } from "./utils";

function Input({
  className,
  type,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 px-3 w-full border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#155dfc] focus:border-transparent transition-all",
        "dark:border-[#555555] dark:text-white dark:placeholder:text-[#888]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:border-gray-200 dark:disabled:bg-[#0f0f0f] dark:disabled:border-[#2a2a2a]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };