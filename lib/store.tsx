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
  authToken: null,
};

interface Ctx {
  ready: boolean;
  user: User | null;
  watchlist: string[];
  theme: "dark" | "light";
  lang: "th" | "en";
  // auth
  login: (email: string, name?: string, plan?: PlanId, billing?: "monthly" | "yearly", authToken?: string) => void;
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

  useEffect(() => {
    if (!ready || !data.user?.email) return;

    const email = data.user.email.trim().toLowerCase();
    const localSymbols = data.watchlist.map((symbol) => symbol.toUpperCase());

    fetch(`/api/watchlist?email=${encodeURIComponent(email)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (!payload || !Array.isArray(payload.watchlist)) return;
        const dbSymbols = payload.watchlist.map((symbol: string) => symbol.toUpperCase());
        const merged = Array.from(new Set([...dbSymbols, ...localSymbols]));

        setData((current) => {
          if (current.user?.email.trim().toLowerCase() !== email) return current;
          if (JSON.stringify(current.watchlist) === JSON.stringify(merged)) return current;
          return { ...current, watchlist: merged };
        });

        localSymbols
          .filter((symbol) => !dbSymbols.includes(symbol))
          .forEach((symbol) => {
            fetch("/api/watchlist", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, symbol }),
            }).catch(() => {
              /* keep local optimistic state */
            });
          });
      })
      .catch(() => {
        /* keep local optimistic state if the database is unavailable */
      });
  }, [ready, data.user?.email]);

  useEffect(() => {
    if (!ready || !data.user?.email) return;

    const email = data.user.email.trim().toLowerCase();
    fetch(`/api/preferences?email=${encodeURIComponent(email)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (!payload?.preferences) return;
        setData((current) => {
          if (current.user?.email.trim().toLowerCase() !== email) return current;
          return {
            ...current,
            theme: payload.preferences.theme === "light" ? "light" : "dark",
            lang: payload.preferences.lang === "en" ? "en" : "th",
          };
        });
      })
      .catch(() => {
        /* keep local preferences if the database is unavailable */
      });
  }, [ready, data.user?.email]);

  useEffect(() => {
    if (!ready || !data.user?.email) return;
    const email = data.user.email.trim().toLowerCase();

    fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        theme: data.theme,
        lang: data.lang || "th",
      }),
    }).catch(() => {
      /* local preferences remain available while offline */
    });
  }, [ready, data.user?.email, data.theme, data.lang]);

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

  useEffect(() => {
    if (!ready || !data.user?.email || !data.authToken) return;

    const verifyCurrentSession = () => {
      fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: data.authToken }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Session is no longer active");
          return res.json();
        })
        .catch(() => {
          setData((current) => ({ ...current, user: null, authToken: null }));
        });
    };

    const timer = window.setInterval(verifyCurrentSession, 10000);
    return () => window.clearInterval(timer);
  }, [ready, data.user?.email, data.authToken]);

  const login = useCallback((email: string, name?: string, plan?: PlanId, billing?: "monthly" | "yearly", authToken?: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    const isPremium = PREMIUM_EMAILS.has(normalizedEmail);
    const nextPlan = isPremium ? "premium" : (plan || "free");
    const nextBilling = isPremium ? "yearly" : (billing || "monthly");
    const nextUser = {
      name: isPremium
        ? (normalizedEmail === "zeroline@live.com" ? "Zeroline VIP" : (name || email.split("@")[0] || "นักลงทุน"))
        : (name || email.split("@")[0] || "นักลงทุน"),
      email: normalizedEmail,
      plan: nextPlan,
      billing: nextBilling,
      joinedAt: new Date().toISOString(),
    };
    setData((d) => ({
      ...d,
      user: nextUser,
      authToken: authToken || d.authToken || null,
    }));

    fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: normalizedEmail,
        name: nextUser.name,
        plan: nextUser.plan,
        billing: nextUser.billing,
      }),
    }).catch(() => {
      /* local login remains available while offline */
    });
  }, []);

  const logout = useCallback(() => {
    setData((d) => ({ ...d, user: null, authToken: null }));
  }, []);

  const setPlan = useCallback(
    (plan: PlanId, billing: "monthly" | "yearly" = "monthly") => {
      let nextUserForSync: User | null = null;
      setData((d) => {
        if (!d.user) {
          nextUserForSync = {
            name: "นักลงทุน",
            email: "guest@valustock.app",
            plan,
            billing,
            joinedAt: new Date().toISOString(),
          };
          return {
            ...d,
            user: nextUserForSync,
          };
        }
        const isPremium = PREMIUM_EMAILS.has(d.user.email.toLowerCase().trim());
        nextUserForSync = {
          ...d.user,
          plan: isPremium ? "premium" : plan,
          billing: isPremium ? "yearly" : billing,
        };
        return {
          ...d,
          user: nextUserForSync,
        };
      });

      setTimeout(() => {
        if (!nextUserForSync) return;
        fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: nextUserForSync.email.trim().toLowerCase(),
            name: nextUserForSync.name,
            plan: nextUserForSync.plan,
            billing: nextUserForSync.billing,
          }),
        }).catch(() => {
          /* local membership remains available while offline */
        });
      }, 0);
    },
    []
  );

  const toggleWatch = useCallback((symbol: string) => {
    const normalizedSymbol = symbol.toUpperCase();
    let nextAction: "add" | "remove" = "add";
    let emailForSync: string | null = null;

    setData((d) => {
      const exists = d.watchlist.includes(normalizedSymbol);
      nextAction = exists ? "remove" : "add";
      emailForSync = d.user?.email.trim().toLowerCase() ?? null;
      return {
        ...d,
        watchlist: exists
          ? d.watchlist.filter((s) => s !== normalizedSymbol)
          : [...d.watchlist, normalizedSymbol],
      };
    });

    setTimeout(() => {
      if (!emailForSync) return;
      fetch("/api/watchlist", {
        method: nextAction === "add" ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailForSync, symbol: normalizedSymbol }),
      }).catch(() => {
        /* local optimistic state remains available while offline */
      });
    }, 0);
  }, []);

  const isWatched = useCallback(
    (symbol: string) => data.watchlist.includes(symbol.toUpperCase()),
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
