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
        "h-12 px-3 w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg text-white placeholder:text-[#888] focus:outline-none focus:ring-2 focus:ring-[#155dfc] focus:border-transparent transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#0f0f0f] disabled:border-[#2a2a2a]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };