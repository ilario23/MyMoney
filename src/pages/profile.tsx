import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth.store";
import { useLanguage } from "@/lib/language";
import { supabase } from "@/lib/supabase";
import { getDatabase } from "@/lib/db";
import { authLogger, dbLogger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { LogOut, Edit2, Save, X, Settings } from "lucide-react";
import { toast } from "sonner";

export function ProfilePage() {
  const { user, logout } = useAuthStore();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalAmount: 0,
    categories: 0,
    lastSyncDate: null as Date | null,
  });
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Load user statistics
  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;
      try {
        const db = getDatabase();

        // Calcola statistiche di tutti i tempi (non solo questo mese)
        const allExpenses = await db.expenses
          .where("user_id")
          .equals(user.id)
          .filter((exp) => !exp.deleted_at)
          .toArray();

        // Conta le categorie
        const categories = await db.categories
          .where("user_id")
          .equals(user.id)
          .toArray();

        // Calcola l'importo totale
        const totalAmount = allExpenses.reduce(
          (sum, exp) => sum + exp.amount,
          0
        );

        const newStats = {
          totalExpenses: allExpenses.length,
          totalAmount: totalAmount,
          categories: categories.length,
          lastSyncDate: new Date(),
        };
        setStats(newStats);
      } catch (error) {
        console.error("Error loading stats:", error);
      }
    };

    loadStats();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      toast.error(t("profile.nameCannotBeEmpty"));
      return;
    }

    setIsSaving(true);

    try {
      // Update display name in Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        data: { display_name: displayName },
      });

      if (updateError) {
        const errorMsg = t("profile.errorUpdatingProfile");
        toast.error(errorMsg);
        return;
      }

      const successMsg = t("profile.profileUpdated");
      toast.success(successMsg);
      setIsEditing(false);

      // Update local user in auth store
      if (user) {
        // Update would be handled by auth listener
      }
    } catch (err) {
      authLogger.error("Error updating profile:", err);
      const errorMsg = t("profile.anErrorOccurred");
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      authLogger.info("Starting logout process...");

      // 1. Sign out da Supabase
      await supabase.auth.signOut();
      authLogger.success("Supabase logout complete");

      // 2. Pulisci completamente IndexedDB
      try {
        // Chiudi il database Dexie (non è necessario con Dexie)
        dbLogger.success("Dexie database ready for cleanup");

        // Elimina tutti i database IndexedDB
        if (window.indexedDB) {
          const databases = await window.indexedDB.databases();
          for (const dbInfo of databases) {
            if (dbInfo.name) {
              await new Promise<void>((resolve, reject) => {
                const deleteRequest = window.indexedDB.deleteDatabase(
                  dbInfo.name!
                );
                deleteRequest.onsuccess = () => {
                  dbLogger.success(`Deleted IndexedDB: ${dbInfo.name}`);
                  resolve();
                };
                deleteRequest.onerror = () => reject(deleteRequest.error);
              });
            }
          }
        }
      } catch (dbError) {
        dbLogger.warn("Error cleaning IndexedDB:", dbError);
      }

      // 3. Pulisci localStorage
      try {
        localStorage.clear();
        authLogger.success("localStorage cleared");
      } catch (lsError) {
        authLogger.warn("Error clearing localStorage:", lsError);
      }

      // 4. Pulisci sessionStorage
      try {
        sessionStorage.clear();
        authLogger.success("sessionStorage cleared");
      } catch (ssError) {
        authLogger.warn("Error clearing sessionStorage:", ssError);
      }

      // 5. Pulisci Cache API (Service Worker caches)
      try {
        if ("caches" in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map((cacheName) => caches.delete(cacheName))
          );
          authLogger.success(`Cleared ${cacheNames.length} cache(s)`);
        }
      } catch (cacheError) {
        authLogger.warn("Error clearing caches:", cacheError);
      }

      // 6. Logout dall'auth store (Zustand)
      logout();
      authLogger.success("Auth store cleared");

      // 7. Redirect al login
      authLogger.success("Logout complete, redirecting to login...");
      navigate("/login");
    } catch (error) {
      authLogger.error("Logout error:", error);
      toast.error(t("profile.logoutError") || "Errore durante il logout");
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Non autenticato</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700 px-4">
      {/* Header */}
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-500">
        <h1 className="text-3xl font-bold">{t("profile.title")}</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/settings")}
          title={t("nav.settings")}
          className="gap-2"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">{t("nav.settings")}</span>
        </Button>
      </div>

      {/* User Info Card */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 hover:shadow-lg transition-all">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle>{t("profile.title")}</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="gap-2 flex-1 sm:flex-none"
                >
                  <Edit2 className="w-4 h-4" />
                  <span className="sm:inline">{t("profile.editProfile")}</span>
                </Button>
              )}
              <Dialog
                open={showLogoutDialog}
                onOpenChange={setShowLogoutDialog}
              >
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    title={t("profile.logout")}
                    className="gap-2 flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {t("profile.logout")}
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("profile.logout")}</DialogTitle>
                    <DialogDescription>
                      {t("profile.confirmLogout")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowLogoutDialog(false)}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setShowLogoutDialog(false);
                        handleLogout();
                      }}
                    >
                      {t("profile.logout")}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium block">
              {t("profile.name")}
            </label>
            {isEditing ? (
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("profile.name")}
                disabled={isSaving}
              />
            ) : (
              <p className="text-base sm:text-lg font-semibold break-words">
                {displayName || t("profile.notSet")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium block">
              {t("profile.email")}
            </label>
            <p className="text-xs sm:text-sm text-muted-foreground break-all">
              {user.email}
            </p>
          </div>

          {isEditing && (
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="gap-2 flex-1"
              >
                <Save className="w-4 h-4" />
                {isSaving ? t("common.loading") : t("profile.saveChanges")}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setDisplayName(user.displayName || "");
                }}
                disabled={isSaving}
                className="gap-2 flex-1 sm:flex-none"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {t("profile.cancelEdit")}
                </span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Card */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 hover:shadow-lg transition-all">
        <CardHeader>
          <CardTitle>{t("profile.statistics")}</CardTitle>
          <CardDescription>{t("profile.yourTrackingData")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-secondary rounded-lg border border-input shadow-xs flex flex-col items-center sm:items-start justify-between h-full min-h-24">
              <p className="text-sm sm:text-sm text-muted-foreground mb-3 font-medium line-clamp-2">
                {t("profile.expenses")}
              </p>
              <p className="text-3xl sm:text-2xl font-bold text-primary">
                {stats.totalExpenses}
              </p>
            </div>

            <div className="p-4 bg-secondary rounded-lg border border-input shadow-xs flex flex-col items-center sm:items-start justify-between h-full min-h-24">
              <p className="text-sm sm:text-sm text-muted-foreground mb-3 font-medium line-clamp-2">
                {t("profile.totalAmount")}
              </p>
              <p className="text-3xl sm:text-2xl font-bold text-primary">
                €{stats.totalAmount.toFixed(2)}
              </p>
            </div>

            <div className="p-4 bg-secondary rounded-lg border border-input shadow-xs flex flex-col items-center sm:items-start justify-between h-full min-h-24">
              <p className="text-sm sm:text-sm text-muted-foreground mb-3 font-medium line-clamp-2">
                {t("profile.categories")}
              </p>
              <p className="text-3xl sm:text-2xl font-bold text-primary">
                {stats.categories}
              </p>
            </div>
          </div>

          {stats.lastSyncDate && (
            <div className="mt-4 p-3 bg-secondary/50 rounded-lg text-sm border border-input shadow-xs text-center sm:text-left">
              <p className="text-xs sm:text-sm text-muted-foreground">
                {t("profile.lastSync")}:{" "}
                <span className="font-medium">
                  {stats.lastSyncDate.toLocaleDateString(
                    language === "it" ? "it-IT" : "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories Management */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 hover:shadow-lg transition-all">
        <CardHeader>
          <CardTitle>{t("profile.categoriesManagement")}</CardTitle>
          <CardDescription>
            {t("profile.manageCategoriesDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => navigate("/categories")}
            className="w-full"
            variant="outline"
          >
            {t("profile.editCategories")}
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            {t("profile.manageCategoriesDescription")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
