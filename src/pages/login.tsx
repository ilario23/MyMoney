import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/lib/language";
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
import { AlertCircle, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/auth.store";
import { getDatabase } from "@/lib/db";
import { authLogger } from "@/lib/logger";

export function LoginPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser, startSync } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      if (data.user) {
        const displayName = data.user.user_metadata?.display_name;
        const avatarUrl = data.user.user_metadata?.avatar_url;

        // Assicura che il record user esista in Supabase
        const { data: existingUser, error: checkError } = await supabase
          .from("users")
          .select("id")
          .eq("id", data.user.id)
          .single();

        if (checkError && checkError.code !== "PGRST116") {
          authLogger.error("Error checking user:", checkError);
        }

        if (!existingUser) {
          authLogger.info("Creating user in database...");
          const { error: createError } = await supabase.from("users").insert({
            id: data.user.id,
            email: data.user.email,
            display_name: displayName,
            avatar_url: avatarUrl,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (createError) {
            authLogger.error("Error creating user:", createError);
          } else {
            authLogger.success("User created successfully");
          }
        }

        // Salva nel database locale Dexie
        const db = getDatabase();
        await db.users.put({
          id: data.user.id,
          email: data.user.email!,
          full_name: displayName,
          avatar_url: avatarUrl,
          preferred_language: "it",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
        });

        // Imposta user nello store
        setUser({
          id: data.user.id,
          email: data.user.email!,
          displayName,
          avatarUrl,
        });

        // Avvia sincronizzazione
        await startSync();

        navigate("/dashboard");
      }
    } catch (err) {
      setError(t("auth.errorOccurred"));
      authLogger.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-3xl font-bold">
            <Wallet className="w-8 h-8 text-primary" />
            <span>Spendix</span>
          </div>
        </div>

        {/* Card */}
        <Card className="border-border">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">{t("auth.login")}</CardTitle>
            <CardDescription>{t("auth.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">{t("auth.email")}</label>
                <Input
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("auth.password")}
                </label>
                <Input
                  type="password"
                  placeholder={t("auth.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? t("auth.loggingIn") : t("auth.login")}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              {t("auth.noAccount")}{" "}
              <button
                onClick={() => navigate("/signup")}
                className="text-primary hover:underline font-medium"
              >
                {t("auth.signup")}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 text-center text-xs text-muted-foreground">
          <div>{t("auth.mobileFriendly")}</div>
          <div>{t("auth.offline")}</div>
          <div>{t("auth.secure")}</div>
        </div>
      </div>
    </div>
  );
}
