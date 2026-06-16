import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { Transaction } from "@workspace/api-client-react";

const CATEGORY_ICONS: Record<string, string> = {
  "food": "coffee",
  "food & dining": "coffee",
  "dining": "coffee",
  "transport": "truck",
  "transportation": "truck",
  "housing": "home",
  "rent": "home",
  "entertainment": "film",
  "health": "heart",
  "healthcare": "heart",
  "shopping": "shopping-bag",
  "education": "book",
  "utilities": "zap",
  "savings": "dollar-sign",
  "income": "trending-up",
  "salary": "trending-up",
};

function getCategoryIcon(category: string): string {
  const key = category.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_ICONS)) {
    if (key.includes(k)) return v;
  }
  return "circle";
}

function formatAmount(amount: number, type: "income" | "expense"): string {
  const sign = type === "income" ? "+" : "-";
  return `${sign}$${amount.toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface Props {
  transaction: Transaction;
  onPress?: () => void;
  onLongPress?: () => void;
}

export function TransactionRow({ transaction, onPress, onLongPress }: Props) {
  const colors = useColors();
  const isIncome = transaction.type === "income";
  const iconName = getCategoryIcon(transaction.category) as Parameters<typeof Feather>[0]["name"];
  const amountColor = isIncome ? colors.income : colors.expense;
  const iconBg = isIncome ? colors.incomeBackground : colors.expenseBackground;

  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <Feather name={iconName} size={18} color={amountColor} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.description, { color: colors.foreground }]} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={[styles.category, { color: colors.mutedForeground }]}>
          {transaction.category}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {formatAmount(transaction.amount, transaction.type)}
        </Text>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>
          {formatDate(transaction.date)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  description: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  category: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  right: {
    alignItems: "flex-end",
    gap: 2,
  },
  amount: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  date: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
