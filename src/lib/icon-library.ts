/**
 * Icon Library for Categories
 * Curated list of lucide-react icon names for category selection
 * Icons are stored as string names in the database and rendered dynamically
 * Single pool of icons available for all transaction types
 */

/**
 * All available icons for category selection
 * Users can choose any icon regardless of transaction type
 */
export const ALL_ICONS = [
  "ShoppingCart",
  "Utensils",
  "Home",
  "Zap",
  "Pill",
  "Car",
  "Wallet",
  "CreditCard",
  "DollarSign",
  "Smartphone",
  "Gamepad2",
  "Coffee",
  "Shirt",
  "Bus",
  "Plane",
  "Droplet",
  "Wind",
  "Flame",
  "TrendingUp",
  "Briefcase",
  "Award",
  "Gift",
  "PiggyBank",
  "Target",
  "BarChart3",
  "ArrowUp",
  "PieChart",
  "LineChart",
  "Building2",
  "Rocket",
  "Heart",
  "Star",
  "Music",
  "BookOpen",
  "Camera",
  "Headphones",
  "Globe",
  "MapPin",
  "Bell",
  "Settings",
  "Lock",
  "Mail",
  "Phone",
  "Clock",
  "Calendar",
  "FileText",
  "Folder",
  "Database",
  "Server",
] as const;

/**
 * Get all available icons
 */
export function getAvailableIcons(): readonly string[] {
  return ALL_ICONS;
}

/**
 * Validate icon name exists in library
 */
export function isValidIcon(iconString: string): boolean {
  return ALL_ICONS.includes(iconString as any);
}

/**
 * Get the lucide-react component for an icon name
 * Returns the icon name if valid, otherwise returns fallback icon
 */
export function getIconName(iconString: string): string {
  if (!isValidIcon(iconString)) {
    return "HelpCircle"; // Fallback icon
  }
  return iconString;
}
