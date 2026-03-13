"use client";
import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { toggleVariants } from "@/components/ui/toggle";

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "default",
  variant: "default",
});

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, onValueChange, value, ...props }, ref) => {

  const handleValueChange = (newValue: string | string[]) => {
    // If trying to deselect (newValue is empty) and we have a current value,
    // keep the current value to prevent deselection
    if (!newValue && value) {
      return; // Don't call onValueChange, maintaining current selection
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onValueChange?.(newValue as any);
  };

  return (
    <ToggleGroupPrimitive.Root
      ref={ref}
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      className={cn("flex items-center justify-center gap-[3px]", className)}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      value={value as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onValueChange={handleValueChange as any}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
});
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext);

  return (
    <ToggleGroupPrimitive.Item
      data-variant={context.variant || variant}
      data-size={context.size || size}
      className={cn(
        // Base functionality without ShadCN toggleVariants to avoid white flash
        "inline-flex items-center justify-center gap-2 font-medium",
        "disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-none whitespace-nowrap",
        // Custom toggle group item styles
        "px-6 py-[11px] rounded-[10px] text-[12px] leading-[14px] font-semibold",
        "relative overflow-hidden transition-all duration-200",
        "bg-transparent", // always transparent base
        // State-specific styling - no white backgrounds
        "data-[state=off]:bg-transparent data-[state=off]:text-black/45 data-[state=off]:dark:bg-transparent data-[state=off]:dark:text-white/75",
        "data-[state=on]:bg-[#9f8bcf]/15 data-[state=on]:text-black dark:data-[state=on]:bg-transparent dark:data-[state=on]:text-white", // active text only
        // Use pseudo-element for gradient background to avoid flash
        "before:absolute before:inset-0 before:rounded-[10px]",
        "before:bg-transparent before:transition-all before:duration-200 before:-z-10",
        "data-[state=on]:dark:before:bg-[linear-gradient(200deg,_#311B47_-20%,_#141118_110%)]",
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
}

export { ToggleGroup, ToggleGroupItem };
