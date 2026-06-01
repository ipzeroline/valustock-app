"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { AppData, User, PlanId } from "./types";
import { getPlan } from "./plans";

const KEY = "valustock.v1";

const DEFAULT: AppData = {
  user: null,
  watchlist: [],
  theme: "dark",
  lang: "th",
};

interface Ctx {
  ready: boolean;
  user: User | null;
  watchlist: string[];
  theme: "dark" | "light";
  lang: "th" | "en";
  // auth
  login: (email: string, name?: string) => void;
  logout: () => void;
  // membership
  setPlan: (plan: PlanId, billing?: "monthly" | "yearly") => void;
  // watchlist
  toggleWatch: (symbol: string) => void;
  isWatched: (symbol: string) => boolean;
  // theme
  toggleTheme: () => void;
  toggleLang: () => void;
}

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(DEFAULT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppData;
        setData({ ...DEFAULT, ...parsed });
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [data, ready]);

  // apply theme class
  useEffect(() => {
    const root = document.documentElement;
    if (data.theme === "light") root.classList.add("light");
    else root.classList.remove("light");
  }, [data.theme]);

  const PREMIUM_EMAILS = new Set([
    "zeroline@live.com",
    "tayasit.pea@gmail.com",
  ]);

  const login = useCallback((email: string, name?: string) => {
    const isPremium = PREMIUM_EMAILS.has(email.toLowerCase().trim());
    setData((d) => ({
      ...d,
      user: {
        name: isPremium
          ? (email.toLowerCase().trim() === "zeroline@live.com" ? "Zeroline VIP" : (name || email.split("@")[0] || "นักลงทุน"))
          : (name || email.split("@")[0] || "นักลงทุน"),
        email,
        plan: isPremium ? "premium" : "free",
        billing: isPremium ? "yearly" : "monthly",
        joinedAt: new Date().toISOString(),
      },
    }));
  }, []);

  const logout = useCallback(() => {
    setData((d) => ({ ...d, user: null }));
  }, []);

  const setPlan = useCallback(
    (plan: PlanId, billing: "monthly" | "yearly" = "monthly") => {
      setData((d) => {
        if (!d.user) {
          return {
            ...d,
            user: {
              name: "นักลงทุน",
              email: "guest@valustock.app",
              plan,
              billing,
              joinedAt: new Date().toISOString(),
            },
          };
        }
        const isPremium = PREMIUM_EMAILS.has(d.user.email.toLowerCase().trim());
        return {
          ...d,
          user: {
            ...d.user,
            plan: isPremium ? "premium" : plan,
            billing: isPremium ? "yearly" : billing,
          },
        };
      });
    },
    []
  );

  const toggleWatch = useCallback((symbol: string) => {
    setData((d) => {
      const exists = d.watchlist.includes(symbol);
      return {
        ...d,
        watchlist: exists
          ? d.watchlist.filter((s) => s !== symbol)
          : [...d.watchlist, symbol],
      };
    });
  }, []);

  const isWatched = useCallback(
    (symbol: string) => data.watchlist.includes(symbol),
    [data.watchlist]
  );

  const toggleTheme = useCallback(() => {
    setData((d) => ({ ...d, theme: d.theme === "dark" ? "light" : "dark" }));
  }, []);

  const toggleLang = useCallback(() => {
    setData((d) => ({ ...d, lang: d.lang === "th" ? "en" : "th" }));
  }, []);

  const value: Ctx = {
    ready,
    user: data.user,
    watchlist: data.watchlist,
    theme: data.theme,
    lang: data.lang || "th",
    login,
    logout,
    setPlan,
    toggleWatch,
    isWatched,
    toggleTheme,
    toggleLang,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

/** แผนปัจจุบันของผู้ใช้ (ฟรีถ้ายังไม่ล็อกอิน) */
export function useCurrentPlan() {
  const { user } = useStore();
  return getPlan(user?.plan ?? "free");
}
