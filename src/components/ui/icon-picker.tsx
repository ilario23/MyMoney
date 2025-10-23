import { getAvailableIcons } from "@/lib/icon-library";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  className?: string;
}

/**
 * Icon picker component for selecting category icons
 * Displays icon picker in a dialog/modal
 */
export function IconPicker({
  value,
  onChange,
  className = "",
}: IconPickerProps) {
  const icons = getAvailableIcons();
  const [open, setOpen] = useState(false);

  const renderIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (!IconComponent) {
      return <LucideIcons.HelpCircle className="w-5 h-5" />;
    }
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-foreground">Icon</label>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-12 h-10 p-0 flex items-center justify-center"
          >
            {renderIcon(value)}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Icon</DialogTitle>
            <DialogDescription>
              Choose an icon for this category
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-8 gap-2 max-h-96 overflow-y-auto p-2">
            {icons.map((icon) => (
              <button
                key={icon}
                onClick={() => {
                  onChange(icon);
                  setOpen(false);
                }}
                className={`p-3 rounded-lg transition-all flex items-center justify-center ${
                  value === icon
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-secondary hover:bg-secondary/80 text-foreground hover:shadow-md"
                }`}
                title={icon}
              >
                {renderIcon(icon)}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
