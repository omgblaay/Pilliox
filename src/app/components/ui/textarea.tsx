import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "resize-none px-3 py-2 w-full bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#555555] rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#888] focus:outline-none focus:ring-2 focus:ring-[#155dfc] focus:border-transparent transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-[#0f0f0f] disabled:border-gray-200 dark:disabled:border-[#2a2a2a]",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };