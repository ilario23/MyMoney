import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth.store";
import { supabase } from "@/lib/supabase";
import { syncService } from "@/services/sync.service";
import { Layout } from "@/components/layout/layout";
import { LoginPage } from "@/pages/login";
import { SignupPage } from "@/pages/signup";
import { DashboardPage } from "@/pages/dashboard";
import { ProfilePage } from "@/pages/profile";
import { SettingsPage } from "@/pages/settings";
import { CategoriesPage } from "@/pages/categories";
import { StatisticsPage } from "@/pages/statistics";
import { ExpenseForm } from "@/components/expense/expense-form";
import { ExpensesPage } from "@/pages/expenses";

function NotFound() {
  return <div className="text-center py-12">Pagina non trovata</div>;
}

export function AppRoutes() {
  const { user, isLoading, setUser, setLoading } = useAuthStore();

  // Controlla login state al caricamento
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            displayName: session.user.user_metadata?.display_name,
            avatarUrl: session.user.user_metadata?.avatar_url,
          });

          // Initialize app: Load from Dexie first, then sync with Supabase in background
          // This ensures data is available immediately while syncing remotely
          await syncService.initializeAtStartup(session.user.id);

          // Setup realtime monitoring to detect remote changes
          syncService.setupRealtimeMonitoring(session.user.id);
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Ascolta cambiamenti di autenticazione
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          displayName: session.user.user_metadata?.display_name,
          avatarUrl: session.user.user_metadata?.avatar_url,
        });
      } else {
        setUser(null);
        // Clean up realtime monitoring on logout
        syncService.cleanupRealtimeMonitoring();
      }
    });

    return () => {
      subscription?.unsubscribe();
      syncService.cleanupRealtimeMonitoring();
    };
  }, [setUser, setLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected Routes */}
        {user ? (
          <>
            <Route
              path="/dashboard"
              element={
                <Layout>
                  <DashboardPage />
                </Layout>
              }
            />
            <Route
              path="/expense/new"
              element={
                <Layout>
                  <ExpenseForm />
                </Layout>
              }
            />
            <Route
              path="/expense/:id"
              element={
                <Layout>
                  <ExpenseForm />
                </Layout>
              }
            />
            <Route
              path="/expenses"
              element={
                <Layout>
                  <ExpensesPage />
                </Layout>
              }
            />
            <Route
              path="/profile"
              element={
                <Layout>
                  <ProfilePage />
                </Layout>
              }
            />
            <Route
              path="/settings"
              element={
                <Layout>
                  <SettingsPage />
                </Layout>
              }
            />
            <Route
              path="/categories"
              element={
                <Layout>
                  <CategoriesPage />
                </Layout>
              }
            />
            <Route
              path="/statistics"
              element={
                <Layout>
                  <StatisticsPage />
                </Layout>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </>
        ) : (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </>
        )}

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
