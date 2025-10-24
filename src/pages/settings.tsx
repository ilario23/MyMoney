import { useState } from "react";
import { useAuthStore } from "@/lib/auth.store";
import { useLanguage, type Language } from "@/lib/language";
import { supabase } from "@/lib/supabase";
import { getDatabase } from "@/lib/db";
import { dbLogger, authLogger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { ThemeSelector } from "@/components/ui/theme-selector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import packageJson from "../../package.json";
import { Trash2, ChevronLeft } from "lucide-react";

export function SettingsPage() {
  const { user, logout } = useAuthStore();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleDeleteAllData = async () => {
    try {
      authLogger.info("Starting clear local cache...");

      // Pulisci completamente IndexedDB
      try {
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

      // Pulisci localStorage
      try {
        localStorage.clear();
        authLogger.success("localStorage cleared");
      } catch (lsError) {
        authLogger.warn("Error clearing localStorage:", lsError);
      }

      // Pulisci sessionStorage
      try {
        sessionStorage.clear();
        authLogger.success("sessionStorage cleared");
      } catch (ssError) {
        authLogger.warn("Error clearing sessionStorage:", ssError);
      }

      // Pulisci Cache API (Service Worker caches)
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

      dbLogger.success("All local cache cleared");
      setSuccess(
        t("profile.dataDeleted") ||
          "Cache locale eliminata. Sarai disconnesso e reindirizzato."
      );

      // Logout dopo il clear
      setTimeout(() => {
        handleLogout();
      }, 1500);
    } catch (error) {
      dbLogger.error("Error clearing cache:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setError(`Error: ${errorMsg}`);
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
    <div className="max-w-2xl mx-auto space-y-6 pb-20 px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/profile")}
            className="md:hidden -ml-2"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold">{t("profile.settings")}</h1>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border border-primary/30 bg-primary/10">
          <AlertDescription className="text-primary font-medium">
            ✓ {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle>🌍 {t("profile.language")}</CardTitle>
          <CardDescription>{t("profile.selectLanguage")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("profile.language")}
            </label>
            <Select
              value={language}
              onValueChange={(value) => {
                setLanguage(value as Language);
                setSuccess(t("profile.languageUpdated"));
                setTimeout(() => setSuccess(""), 3000);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="it">🇮🇹 Italiano</SelectItem>
                <SelectItem value="en">🇬🇧 English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <ThemeSelector />

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t("profile.account")}</CardTitle>
          <CardDescription>{t("profile.manageAccount")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-medium mb-2">{t("profile.appVersion")}</h3>
              <Badge variant="secondary">v{packageJson.version} - PWA</Badge>
            </div>

            <div>
              <h3 className="font-medium mb-2">{t("profile.localDatabase")}</h3>
              <Badge variant="secondary">{t("profile.dexieIndexedDB")}</Badge>
            </div>

            <div>
              <h3 className="font-medium mb-2">
                {t("profile.synchronization")}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {t("profile.syncDescription")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>{t("profile.dataManagement")}</CardTitle>
          <CardDescription>{t("profile.exportDeleteData")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                {t("profile.exportData")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("profile.exportData")}</DialogTitle>
                <DialogDescription>
                  {t("profile.exportDescription")}
                </DialogDescription>
              </DialogHeader>
              <Button
                onClick={async () => {
                  const db = getDatabase();
                  const expenses = await db.expenses
                    .where("user_id")
                    .equals(user.id)
                    .toArray();
                  const categories = await db.categories
                    .where("user_id")
                    .equals(user.id)
                    .toArray();
                  const data = {
                    user,
                    expenses: expenses.map((e: (typeof expenses)[0]) => e),
                    categories: categories.map(
                      (c: (typeof categories)[0]) => c
                    ),
                    exportDate: new Date(),
                  };
                  const blob = new Blob([JSON.stringify(data, null, 2)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `mymoney-backup-${Date.now()}.json`;
                  a.click();
                  setSuccess(t("profile.dataExported"));
                }}
                className="w-full"
              >
                ✓ {t("common.save")}
              </Button>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Local Cache
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Clear Local Cache</DialogTitle>
                <DialogDescription className="text-destructive">
                  ⚠️ Questo cancellerà la cache locale (IndexedDB,
                  localStorage). I tuoi dati rimangono in Supabase. Sarai
                  disconnesso.
                </DialogDescription>
              </DialogHeader>
              <Button
                variant="destructive"
                onClick={() => handleDeleteAllData()}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Cache & Logout
              </Button>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
