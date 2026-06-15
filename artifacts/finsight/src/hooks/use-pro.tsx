import { useState, useEffect, createContext, useContext, ReactNode } from "react";

const USER_ID_KEY = "finsight_user_id";
const PRO_CACHE_KEY = "finsight_is_pro";

function getOrCreateUserId(): string {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

interface ProContextValue {
  isPro: boolean;
  isLoading: boolean;
  userId: string;
  refresh: () => Promise<void>;
}

const ProContext = createContext<ProContextValue>({
  isPro: false,
  isLoading: true,
  userId: "",
  refresh: async () => {},
});

export function ProProvider({ children }: { children: ReactNode }) {
  const [isPro, setIsPro] = useState(() => {
    return localStorage.getItem(PRO_CACHE_KEY) === "true";
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userId] = useState(getOrCreateUserId);

  const refresh = async () => {
    try {
      const res = await fetch(`/api/stripe/subscription/${userId}`);
      const data = await res.json();
      setIsPro(!!data.isPro);
      localStorage.setItem(PRO_CACHE_KEY, String(!!data.isPro));
    } catch {
      // Keep cached value on network error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // Re-check on focus (e.g. returning from Stripe checkout)
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // Handle ?upgraded=true redirect from Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true") {
      refresh();
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  return (
    <ProContext.Provider value={{ isPro, isLoading, userId, refresh }}>
      {children}
    </ProContext.Provider>
  );
}

export function usePro() {
  return useContext(ProContext);
}
