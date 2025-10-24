import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/lib/language";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

export function UnauthorizedPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 dark:from-primary/12 dark:via-background dark:to-secondary/12 flex items-center justify-center p-4">
      <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* 401 Code - Large and Bold */}
        <div className="relative">
          <div className="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-primary animate-pulse">
            401
          </div>
          <div className="absolute inset-0 text-9xl font-extrabold text-primary/10 blur-xl -z-10">
            401
          </div>
        </div>

        {/* Lock Icon */}
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
            <Lock className="w-16 h-16 text-primary" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            {t("unauthorized.title")}
          </h1>
          <p className="text-lg text-slate-400 max-w-md mx-auto">
            {t("unauthorized.description")}
          </p>
        </div>

        {/* CTA Button */}
        <Button
          onClick={() => navigate("/login")}
          size="lg"
          className="px-8 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
        >
          {t("unauthorized.button")}
        </Button>

        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-primary/5 rounded-full blur-2xl opacity-50"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl opacity-50"></div>
      </div>
    </div>
  );
}
