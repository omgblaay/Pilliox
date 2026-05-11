import * as React from "react";
import {
  cva,
  type VariantProps,
} from "class-variance-authority";

import { cn } from "./utils";

const inputVariants = cva(
  "w-full text-gray-900 placeholder:text-gray-500 transition-all focus:outline-none dark:text-white dark:placeholder:text-[#888] disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "h-12 rounded-lg border border-gray-300 bg-input px-3 focus:border-transparent focus:ring-2 focus:ring-[#155dfc] disabled:border-gray-200 disabled:bg-gray-100 dark:border-[#4d4c54] dark:disabled:border-[#2a2a2a] dark:disabled:bg-[#0f0f0f]",
        underline:
          "h-10 rounded-none border-0 border-b border-gray-300 bg-transparent px-0 font-[family-name:var(--font-geist-mono)] focus:border-[#155dfc] focus:ring-0 disabled:border-gray-200 dark:border-[#4d4c54] dark:disabled:border-[#2a2a2a] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & VariantProps<typeof inputVariants>
>(({ className, type, variant, ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    data-slot="input"
    className={cn(inputVariants({ variant, className }))}
    {...props}
  />
));

Input.displayName = "Input";

export { Input, inputVariants };
