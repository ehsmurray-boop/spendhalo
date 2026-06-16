import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const BUDGETS_KEY = "finsight_budgets_v1";

interface BudgetContextValue {
  budgets: Record<string, number>;
  setBudget: (category: string, limit: number) => Promise<void>;
  removeBudget: (category: string) => Promise<void>;
  isLoaded: boolean;
}

const BudgetContext = createContext<BudgetContextValue>({
  budgets: {},
  setBudget: async () => {},
  removeBudget: async () => {},
  isLoaded: false,
});

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [budgets, setBudgetsState] = useState<Record<string, number>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(BUDGETS_KEY)
      .then((val) => {
        if (val) {
          try {
            setBudgetsState(JSON.parse(val) as Record<string, number>);
          } catch {}
        }
      })
      .finally(() => setIsLoaded(true));
  }, []);

  const setBudget = useCallback(
    async (category: string, limit: number) => {
      const updated = { ...budgets, [category]: limit };
      setBudgetsState(updated);
      await AsyncStorage.setItem(BUDGETS_KEY, JSON.stringify(updated));
    },
    [budgets]
  );

  const removeBudget = useCallback(
    async (category: string) => {
      const updated = { ...budgets };
      delete updated[category];
      setBudgetsState(updated);
      await AsyncStorage.setItem(BUDGETS_KEY, JSON.stringify(updated));
    },
    [budgets]
  );

  return (
    <BudgetContext.Provider value={{ budgets, setBudget, removeBudget, isLoaded }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudgets() {
  return useContext(BudgetContext);
}
