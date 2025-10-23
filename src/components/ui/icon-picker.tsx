import { getAvailableIcons } from "@/lib/icon-library";
import * as LucideIcons from "lucide-react";

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  className?: string;
}

/**
 * Icon picker component for selecting category icons
 * Displays a grid of all available icons
 */
export function IconPicker({
  value,
  onChange,
  className = "",
}: IconPickerProps) {
  const icons = getAvailableIcons();

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
      <div className="grid grid-cols-6 gap-2 p-3 border border-input rounded-lg bg-background max-h-96 overflow-y-auto">
        {icons.map((icon) => (
          <button
            key={icon}
            type="button"
            onClick={() => onChange(icon)}
            className={`p-2 rounded-lg transition-all ${
              value === icon
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-secondary hover:bg-secondary/80 text-foreground"
            }`}
            title={icon}
          >
            {renderIcon(icon)}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Selected: {value || "None"}
      </p>
    </div>
  );
}
