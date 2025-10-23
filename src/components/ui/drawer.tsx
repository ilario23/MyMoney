import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface DrawerContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DrawerContext = React.createContext<DrawerContextType | undefined>(
  undefined
);

interface DrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const Drawer = ({
  open = false,
  onOpenChange,
  children,
}: DrawerProps) => {
  const [internalOpen, setInternalOpen] = useState(open);
  const isControlled = onOpenChange !== undefined;
  const actualOpen = isControlled ? open : internalOpen;

  const setOpen = useCallback(
    (newOpen: boolean) => {
      if (isControlled) {
        onOpenChange?.(newOpen);
      } else {
        setInternalOpen(newOpen);
      }
    },
    [isControlled, onOpenChange]
  );

  return (
    <DrawerContext.Provider value={{ open: actualOpen, setOpen }}>
      {children}
    </DrawerContext.Provider>
  );
};

const useDrawer = () => {
  const context = React.useContext(DrawerContext);
  if (!context) {
    throw new Error("useDrawer must be used within a Drawer");
  }
  return context;
};

export const DrawerTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onClick, ...props }, ref) => {
  const { setOpen } = useDrawer();
  return (
    <button
      ref={ref}
      onClick={(e) => {
        setOpen(true);
        onClick?.(e);
      }}
      {...props}
    />
  );
});
DrawerTrigger.displayName = "DrawerTrigger";

export const DrawerClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ onClick, asChild, ...props }, ref) => {
  const { setOpen } = useDrawer();
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setOpen(false);
    onClick?.(e);
  };

  if (asChild && React.isValidElement(props.children)) {
    return React.cloneElement(props.children as any, {
      onClick: handleClick,
    });
  }

  return <button ref={ref} onClick={handleClick} {...props} />;
});
DrawerClose.displayName = "DrawerClose";

export const DrawerPortal = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

export const DrawerOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { open, setOpen } = useDrawer();

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 bg-black/80 transition-opacity duration-300 opacity-100",
        className
      )}
      onClick={() => setOpen(false)}
      {...props}
    />
  );
});
DrawerOverlay.displayName = "DrawerOverlay";

export const DrawerContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { open } = useDrawer();

  if (!open) return null;

  return (
    <>
      <DrawerOverlay />
      <div
        ref={ref}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[10px] border border-border bg-background animate-in slide-in-from-bottom-4 duration-500",
          className
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
        {props.children}
      </div>
    </>
  );
});
DrawerContent.displayName = "DrawerContent";

export const DrawerHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left p-4",
      className
    )}
    {...props}
  />
));
DrawerHeader.displayName = "DrawerHeader";

export const DrawerFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
));
DrawerFooter.displayName = "DrawerFooter";

export const DrawerTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
DrawerTitle.displayName = "DrawerTitle";

export const DrawerDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DrawerDescription.displayName = "DrawerDescription";
