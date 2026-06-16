import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { Transaction } from "@workspace/api-client-react";

interface Props {
  transactions: Transaction[];
}

function computeStreak(transactions: Transaction[]): number {
  const expenseDates = new Set(
    transactions
      .filter((t) => t.type === "expense")
      .map((t) => t.date.substring(0, 10))
  );

  const today = new Date();
  let streak = 0;

  for (let i = 0; i <= 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    if (expenseDates.has(dateStr)) break;
    streak++;
  }

  return streak;
}

function getMessage(streak: number): string {
  if (streak === 0) return "Spent today";
  if (streak === 1) return "No spend today";
  if (streak < 5) return "Keep going!";
  if (streak < 10) return "Amazing focus";
  return "Legendary!";
}

export function StreakCard({ transactions }: Props) {
  const colors = useColors();
  const streak = useMemo(() => computeStreak(transactions), [transactions]);
  const isHot = streak >= 3;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isHot ? colors.primary : colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={styles.emoji}>{streak >= 1 ? "🔥" : "💸"}</Text>
      <View style={styles.text}>
        <Text
          style={[
            styles.count,
            { color: isHot ? colors.primaryForeground : colors.foreground },
          ]}
        >
          {streak}d
        </Text>
        <Text
          style={[
            styles.label,
            { color: isHot ? `${colors.primaryForeground}bb` : colors.mutedForeground },
          ]}
        >
          {getMessage(streak)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  emoji: {
    fontSize: 26,
  },
  text: {
    gap: 2,
  },
  count: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
