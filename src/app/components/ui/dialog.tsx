"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";

import { cn } from "./utils";
import { Button } from "./button";

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return (
    <DialogPrimitive.Trigger
      data-slot="dialog-trigger"
      {...props}
    />
  );
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return (
    <DialogPrimitive.Portal
      data-slot="dialog-portal"      
      {...props}
    />
  );
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return (
    <DialogPrimitive.Close
      data-slot="dialog-close"
      {...props}
    />
  );
}

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/60",
        className,
      )}
      {...props}
    />
  );
});
DialogOverlay.displayName = "DialogOverlay";

function DialogContent({
  className,
  children,
  size = "small",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  size?: "small" | "large";
}) {
  const sizeClasses = {
    small: "max-w-[100%] sm:max-w-lg",
    large: "max-w-[calc(100%] sm:max-w-2xl",
  };

  return (
    <DialogPortal data-slot="dialog-portal">
      <div className="fixed inset-0 z-50 flex sm:items-center items-end justify-end sm:justify-center p-0 sm:p-4 sm:mt-0">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "sm:overflow-x-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 relative z-50 w-full gap-4 sm:border p-4 shadow-lg duration-200 bg-popover flex flex-col sm:p-8 sm:max-h-[90vh] sm:overflow-y-auto sm:rounded-2xl sm:border-border bottom-0 h-[94svh] rounded-t-xl overflow-hidden sm:flex-initial sm:h-auto",
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
      </div>
    </DialogPortal>
  );
}

function DialogHeader({
  className,
  hideClose = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  hideClose?: boolean;
}) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "sm:static absolute p-4 sm:p-0 sm:bg-none bg-gradient-to-b from-popover to-transparent top-0 left-0 right-0 flex min-h-20 sm:min-h-auto w-full items-center space-between gap-2 text-left",
        className,
      )}
      {...props}
    >
      <div className="flex flex-1 flex-col gap-2">
      {children}
       </div>
      {!hideClose && (
        <DialogPrimitive.Close>
          <Button variant="ghost" size="icon">
            <XIcon className="size-4" />
          </Button>
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "text-lg leading-none flex-1 font-semibold",
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
