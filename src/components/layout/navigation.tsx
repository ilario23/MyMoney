import { useLocation, Link } from "react-router-dom";
import { Home, Receipt, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language";

export function Navigation() {
  const location = useLocation();
  const { t } = useLanguage();

  // Haptic feedback function
  const triggerHaptic = () => {
    if ("vibrate" in navigator) {
      navigator.vibrate(10); // 10ms vibration
    }
  };

  const navItems = [
    { path: "/dashboard", icon: Home, label: t("nav.home"), special: false },
    {
      path: "/expenses",
      icon: Receipt,
      label: t("nav.expenses"),
      special: false,
    },
    {
      path: "/profile",
      icon: User,
      label: t("nav.profile"),
      special: false,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden px-4 pb-4 pointer-events-none animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-background/95 backdrop-blur-xl border border-border rounded-[24px] shadow-2xl shadow-black/20 dark:shadow-black/40 pointer-events-auto">
        <div className="relative grid grid-cols-3 gap-1 px-3 py-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname.startsWith(path);

            return (
              <Link key={path} to={path}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={triggerHaptic}
                  className={`w-full flex-col h-16 gap-1 transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 scale-105"
                      : "hover:bg-accent hover:scale-105 active:scale-95"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`}
                  />
                  <span className="text-xs">{label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
