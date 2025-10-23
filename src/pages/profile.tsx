import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth.store";
import { useLanguage } from "@/lib/language";
import { supabase } from "@/lib/supabase";
import { getDatabase } from "@/lib/db";
import { statsService } from "@/services/stats.service";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Load user statistics
  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;
      try {
        const db = getDatabase();

        // Calcola statistiche del mese corrente
        const monthlyStats = await statsService.calculateMonthlyStats(
          user.id,
          new Date()
        );

        // Conta le categorie
        const categories = await db.categories
          .where("user_id")
          .equals(user.id)
          .toArray();

        setStats({
          totalExpenses: monthlyStats.expenseCount,
          totalAmount: monthlyStats.totalExpenses,
          categories: categories.length,
          lastSyncDate: new Date(),
        });
      } catch (error) {
        console.error("Error loading stats:", error);
      }
    };

    loadStats();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      setError(t("profile.nameCannotBeEmpty"));
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      // Update display name in Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        data: { display_name: displayName },
      });

      if (updateError) {
        setError(t("profile.errorUpdatingProfile"));
        return;
      }

      setSuccess(t("profile.profileUpdated"));
      setIsEditing(false);

      // Update local user in auth store
      if (user) {
        // Update would be handled by auth listener
      }
    } catch (err) {
      authLogger.error("Error updating profile:", err);
      setError(t("profile.anErrorOccurred"));
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
      setError(t("profile.logoutError") || "Errore durante il logout");
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

      {error && (
        <Alert
          variant="destructive"
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100"
        >
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border border-primary/30 bg-primary/10 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <AlertDescription className="text-primary font-medium">
            ✓ {success}
          </AlertDescription>
        </Alert>
      )}

      {/* User Info Card */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 hover:shadow-lg transition-all">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("profile.title")}</CardTitle>
            <div className="flex gap-2">
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  {t("profile.editProfile")}
                </Button>
              )}
              <Dialog
                open={showLogoutDialog}
                onOpenChange={setShowLogoutDialog}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    title={t("profile.logout")}
                    className="w-10 h-10 p-0"
                  >
                    <LogOut className="w-4 h-4" />
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
            <label className="text-sm font-medium">{t("profile.name")}</label>
            {isEditing ? (
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("profile.name")}
                disabled={isSaving}
              />
            ) : (
              <p className="text-lg font-semibold">
                {displayName || t("profile.notSet")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("profile.email")}</label>
            <p className="text-sm text-muted-foreground break-all">
              {user.email}
            </p>
          </div>

          {isEditing && (
            <div className="flex gap-2 pt-4">
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
                className="gap-2"
              >
                <X className="w-4 h-4" />
                {t("profile.cancelEdit")}
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
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-secondary rounded-lg border border-input shadow-xs">
              <p className="text-sm text-muted-foreground mb-1">
                {t("profile.expenses")}
              </p>
              <p className="text-2xl font-bold">{stats.totalExpenses}</p>
            </div>

            <div className="p-4 bg-secondary rounded-lg border border-input shadow-xs">
              <p className="text-sm text-muted-foreground mb-1">
                {t("profile.totalAmount")}
              </p>
              <p className="text-2xl font-bold">
                €{stats.totalAmount.toFixed(2)}
              </p>
            </div>

            <div className="p-4 bg-secondary rounded-lg border border-input shadow-xs">
              <p className="text-sm text-muted-foreground mb-1">
                {t("profile.categories")}
              </p>
              <p className="text-2xl font-bold">{stats.categories}</p>
            </div>
          </div>

          {stats.lastSyncDate && (
            <div className="mt-4 p-3 bg-secondary/50 rounded-lg text-sm border border-input shadow-xs">
              <p className="text-muted-foreground">
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
