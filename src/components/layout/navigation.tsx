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
      path: "/transactions",
      icon: Receipt,
      label: t("nav.transactions"),
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
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 md:hidden pb-6 pointer-events-none animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-background/95 backdrop-blur-xl border border-border rounded-[20px] shadow-2xl shadow-black/20 dark:shadow-black/40 pointer-events-auto">
        <div className="relative grid grid-cols-3 gap-5 px-4 py-2">
          {navItems.map(({ path, icon: Icon }) => {
            const isActive = location.pathname.startsWith(path);

            return (
              <Link key={path} to={path}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={triggerHaptic}
                  className={`w-10 h-10 p-0 flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 scale-110"
                      : "hover:bg-accent hover:scale-105 active:scale-95"
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 transition-transform ${isActive ? "scale-110" : ""}`}
                  />
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
