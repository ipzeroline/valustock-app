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
const SESSION_VERIFY_INTERVAL_MS = 1000 * 60 * 30;

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
  login: (email: string, name?: string, plan?: PlanId, billing?: "monthly" | "yearly" | "lifetime") => void;
  logout: () => void;
  // membership
  setPlan: (plan: PlanId, billing?: "monthly" | "yearly" | "lifetime") => void;
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
    if (!ready) return;

    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (!payload?.authenticated) return;
        setData((current) => ({
          ...current,
          user: {
            name: payload.name || payload.email,
            email: payload.email,
            plan: payload.plan || "free",
            billing: payload.billing || "monthly",
            joinedAt: current.user?.joinedAt || new Date().toISOString(),
          },
        }));
      })
      .catch(() => {
        /* anonymous session */
      });
  }, [ready]);

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
              headers: {
                "Content-Type": "application/json",
              },
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
      headers: {
        "Content-Type": "application/json",
      },
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

  useEffect(() => {
    if (!ready || !data.user?.email) return;
    const email = data.user.email.trim().toLowerCase();

    const verifyCurrentSession = () => {
      fetch("/api/auth/session")
        .then((res) => {
          if (!res.ok) throw new Error("Session is no longer active");
          return res.json();
        })
        .then((payload) => {
          if (!payload?.authenticated) throw new Error("Session verification failed");
          setData((current) => {
            if (!current.user || current.user.email.trim().toLowerCase() !== email) return current;
            return {
              ...current,
              user: {
                ...current.user,
                name: payload.name || current.user.name,
                plan: payload.plan || current.user.plan,
                billing: payload.billing || current.user.billing,
              },
            };
          });
        })
        .catch(() => {
          setData((current) => ({ ...current, user: null }));
        });
    };

    const timer = window.setInterval(verifyCurrentSession, SESSION_VERIFY_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [ready, data.user?.email]);

  const login = useCallback((email: string, name?: string, plan?: PlanId, billing?: "monthly" | "yearly" | "lifetime") => {
    const normalizedEmail = email.toLowerCase().trim();
    const nextPlan = plan || "free";
    const nextBilling = billing || "monthly";
    const nextUser = {
      name: name || email.split("@")[0] || "นักลงทุน",
      email: normalizedEmail,
      plan: nextPlan,
      billing: nextBilling,
      joinedAt: new Date().toISOString(),
    };
    setData((d) => ({
      ...d,
      user: nextUser,
    }));

    fetch("/api/auth/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: normalizedEmail,
        name: nextUser.name,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (!payload?.success) return;
        setData((current) => {
          if (current.user?.email !== normalizedEmail) return current;
          return {
            ...current,
            user: {
              ...current.user,
              name: payload.name || current.user.name,
              plan: payload.plan || current.user.plan,
              billing: payload.billing || current.user.billing,
            },
          };
        });
      })
      .catch(() => {
        /* local login remains available while offline */
      });
  }, []);

  const logout = useCallback(() => {
    setData((d) => {
      return { ...d, user: null };
    });

    // Clear all locally stored user data for security
    try {
      if (typeof window !== "undefined") {
        // Clear valustock-specific localStorage keys
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith("valustock_") || key === "watchlist" || key === "theme")) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        // Clear all sessionStorage
        sessionStorage.clear();
      }
    } catch {
      /* browser storage may be unavailable */
    }

    setTimeout(() => {
      fetch("/api/auth/logout", {
        method: "POST",
      }).catch(() => {
        /* local logout already completed */
      });
    }, 0);
  }, []);

  const setPlan = useCallback(
    (plan: PlanId, billing: "monthly" | "yearly" | "lifetime" = "monthly") => {
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
        nextUserForSync = {
          ...d.user,
          plan,
          billing,
        };
        return {
          ...d,
          user: nextUserForSync,
        };
      });

      setTimeout(() => {
        if (!nextUserForSync) return;
        fetch("/api/auth/email", {
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
    let shouldSync = true;

    setData((d) => {
      const exists = d.watchlist.includes(normalizedSymbol);
      nextAction = exists ? "remove" : "add";
      emailForSync = d.user?.email.trim().toLowerCase() ?? null;
      const limit = getPlan(d.user?.plan ?? "free").limits.watchlist;
      if (!exists && limit !== "unlimited" && d.watchlist.length >= limit) {
        shouldSync = false;
        return d;
      }
      return {
        ...d,
        watchlist: exists
          ? d.watchlist.filter((s) => s !== normalizedSymbol)
          : [...d.watchlist, normalizedSymbol],
      };
    });

    setTimeout(() => {
      if (!shouldSync) return;
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
