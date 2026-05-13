import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import {
  cva,
  type VariantProps,
} from "class-variance-authority";
import { ChevronRight } from "lucide-react";

import { cn } from "./utils";

// h-12 bg-[#155dfc] hover:bg-[#1250e0] text-white font-medium text-base rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed

const buttonVariants = cva(
  "inline-flex text-foreground px-4 cursor-pointer font-medium items-center !text-base justify-center gap-2 whitespace-nowrap rounded-xl transition-all disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-6 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] !text-white disabled:opacity-50",
        destructive:
          "border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 hover:border-red-300 dark:hover:border-red-800",
        outline:
          "border hover:bg-gray-400/10 hover:text-accent-foreground border-slate-300 dark:border-[#4d4c54] dark:hover:bg-input/50",
        secondary:
          "bg-gray-100 hover:bg-gray-100 dark:bg-[#404040] dark:hover:bg-[#505050] !text-gray-900 dark:!text-white",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "underline-offset-4 hover:underline",
        tabGroup:
          "h-[40px] flex-1 rounded-[14px] data-[state=active]:bg-white data-[state=active]:dark:bg-[#404040] data-[state=active]:text-gray-900 data-[state=active]:dark:text-white data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-500 data-[state=inactive]:dark:text-[#888]",
        menuItem:
          "w-full hover:bg-accent/50 !rounded-none px-4 !justify-start py-4 h-auto min-h-0 flex gap-3 text-left",
      },
      size: {
        default: "min-h-12 has-[>svg]:px-3",
        sm: "min-h-10 !text-sm !rounded-2xl has-[>svg]:px-4",
        icon: "size-9 !rounded-full",
        link: "h-auto",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
      hideChevron?: boolean;
    }
>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      hideChevron = false,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const showChevron = variant === "menuItem" && !hideChevron;

    return (
      <Comp
        data-slot="button"
        className={cn(
          buttonVariants({ variant, size, className }),
        )}
        ref={ref}
        {...props}
      >
        {children}
        {showChevron && (
          <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto" />
        )}
      </Comp>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };