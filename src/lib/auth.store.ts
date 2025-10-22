import { create } from "zustand";
import { persist } from "zustand/middleware";
import { syncService } from "@/services/sync.service";

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

interface AuthStore {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  startSync: () => Promise<void>;
  stopSync: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),
      setLoading: (loading) => set({ isLoading: loading }),
      logout: async () => {
        // Stop sync before logout
        await syncService.stopSync();
        set({
          user: null,
          isAuthenticated: false,
        });
      },
      startSync: async () => {
        const { user } = get();
        if (user) {
          try {
            await syncService.startSync(user.id);
            console.log("🔄 Sync started for user:", user.id);
          } catch (error) {
            console.error("Failed to start sync:", error);
          }
        }
      },
      stopSync: async () => {
        try {
          await syncService.stopSync();
          console.log("⏸️ Sync stopped");
        } catch (error) {
          console.error("Failed to stop sync:", error);
        }
      },
    }),
    {
      name: "auth-store",
    }
  )
);
