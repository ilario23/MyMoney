import React from "react";
import * as LucideIcons from "lucide-react";

/**
 * Renders a Lucide icon component by name
 * @param iconName - The name of the icon (e.g., "ShoppingCart", "Heart")
 * @returns A React element for the icon, or HelpCircle if not found
 */
export const renderIcon = (iconName: string) => {
  const IconComponent = (LucideIcons as any)[iconName];
  if (!IconComponent) {
    return React.createElement(LucideIcons.HelpCircle, {
      className: "w-4 h-4",
    });
  }
  return React.createElement(IconComponent, { className: "w-4 h-4" });
};

/**
 * Renders a Lucide icon component by name with custom className
 * @param iconName - The name of the icon (e.g., "ShoppingCart", "Heart")
 * @param className - Custom Tailwind CSS classes
 * @returns A React element for the icon, or HelpCircle if not found
 */
export const renderIconWithClass = (iconName: string, className: string) => {
  const IconComponent = (LucideIcons as any)[iconName];
  if (!IconComponent) {
    return React.createElement(LucideIcons.HelpCircle, { className });
  }
  return React.createElement(IconComponent, { className });
};
