import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/lib/language";
import {
  BarChart3,
  ShoppingCart,
  Layers,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import packageJson from "../../../package.json";

const navItems = [
  {
    id: "dashboard",
    path: "/dashboard",
    icon: BarChart3,
    labelKey: "nav.dashboard" as const,
  },
  {
    id: "expenses",
    path: "/expenses",
    icon: ShoppingCart,
    labelKey: "nav.expenses" as const,
  },
  {
    id: "categories",
    path: "/categories",
    icon: Layers,
    labelKey: "nav.categories" as const,
  },
  {
    id: "profile",
    path: "/profile",
    icon: User,
    labelKey: "nav.profile" as const,
  },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* Desktop Sidebar - Visible from tablet up */}
      <aside
        className={cn(
          "hidden md:flex border-r border-border bg-muted/30 flex-col transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Toggle Button */}
        <div className="flex justify-end p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-full hover:bg-accent"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </Button>
        </div>

        <nav className="flex-1 space-y-2 px-2 pb-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-foreground hover:bg-muted"
                )}
                title={isCollapsed ? t(item.labelKey) : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>{t(item.labelKey)}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        {!isCollapsed && (
          <div className="px-4 pb-4 border-t border-border text-xs text-muted-foreground">
            <p className="mt-4">Spendix v{packageJson.version}</p>
            <p className="mt-1">PWA • Offline Ready</p>
          </div>
        )}
      </aside>
    </>
  );
}
