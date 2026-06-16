import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const USER_ID_KEY = "finsight_user_id";
const PRO_CACHE_KEY = "finsight_is_pro";

function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
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

export function ProProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    async function init() {
      let id = await AsyncStorage.getItem(USER_ID_KEY);
      if (!id) {
        id = generateUserId();
        await AsyncStorage.setItem(USER_ID_KEY, id);
      }
      setUserId(id);

      const cached = await AsyncStorage.getItem(PRO_CACHE_KEY);
      if (cached === "true") setIsPro(true);

      try {
        const res = await fetch(`/api/stripe/subscription/${id}`);
        const data = await res.json() as { isPro?: boolean };
        const proStatus = !!data.isPro;
        setIsPro(proStatus);
        await AsyncStorage.setItem(PRO_CACHE_KEY, String(proStatus));
      } catch {
        // keep cached value
      } finally {
        setIsLoading(false);
      }
    }
    void init();
  }, []);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/stripe/subscription/${userId}`);
      const data = await res.json() as { isPro?: boolean };
      const proStatus = !!data.isPro;
      setIsPro(proStatus);
      await AsyncStorage.setItem(PRO_CACHE_KEY, String(proStatus));
    } catch {
      // keep cached value
    }
  }, [userId]);

  return (
    <ProContext.Provider value={{ isPro, isLoading, userId, refresh }}>
      {children}
    </ProContext.Provider>
  );
}

export function usePro() {
  return useContext(ProContext);
}
