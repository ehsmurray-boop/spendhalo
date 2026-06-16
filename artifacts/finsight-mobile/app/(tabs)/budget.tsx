import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useListTransactions } from "@workspace/api-client-react";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useBudgets } from "@/context/BudgetContext";
import { useColors } from "@/hooks/useColors";

const ALL_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Housing",
  "Entertainment",
  "Healthcare",
  "Shopping",
  "Education",
  "Utilities",
  "Savings",
  "Other",
];

interface BudgetRingProps {
  spent: number;
  limit: number;
  size?: number;
}

function BudgetRing({ spent, limit, size = 64 }: BudgetRingProps) {
  const colors = useColors();
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(spent / limit, 1.1);
  const offset = circumference * (1 - Math.min(pct, 1));
  const isOver = spent > limit;
  const isWarn = pct >= 0.8 && !isOver;
  const strokeColor = isOver ? colors.destructive : isWarn ? "#B07010" : colors.income;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke={colors.border}
        strokeWidth={6}
        fill="none"
      />
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke={strokeColor}
        strokeWidth={6}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        rotation={-90}
        origin={`${cx},${cy}`}
      />
    </Svg>
  );
}

export default function BudgetScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { budgets, setBudget, removeBudget } = useBudgets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const [modalVisible, setModalVisible] = useState(false);
  const [editCategory, setEditCategory] = useState<string | null>(null);
  const [limitInput, setLimitInput] = useState("");

  const now = new Date();
  const monthName = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const { data: transactions } = useListTransactions({ limit: 500 });

  const monthlySpending = useMemo(() => {
    const result: Record<string, number> = {};
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    (transactions ?? [])
      .filter((t) => t.type === "expense" && t.date.startsWith(yearMonth))
      .forEach((t) => {
        result[t.category] = (result[t.category] ?? 0) + t.amount;
      });
    return result;
  }, [transactions, now]);

  const allCategories = useMemo(() => {
    const cats = new Set([
      ...Object.keys(budgets),
      ...Object.keys(monthlySpending),
    ]);
    return Array.from(cats).sort();
  }, [budgets, monthlySpending]);

  const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0);
  const totalSpent = Object.keys(budgets).reduce(
    (s, cat) => s + (monthlySpending[cat] ?? 0),
    0
  );

  function openAdd() {
    setEditCategory(null);
    setLimitInput("");
    setModalVisible(true);
  }

  function openEdit(category: string) {
    setEditCategory(category);
    setLimitInput(String(budgets[category] ?? ""));
    setModalVisible(true);
  }

  async function handleSave(category: string) {
    const limit = parseFloat(limitInput);
    if (isNaN(limit) || limit <= 0) {
      Alert.alert("Invalid amount", "Please enter a valid budget limit");
      return;
    }
    await setBudget(category, limit);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setModalVisible(false);
  }

  async function handleDelete(category: string) {
    Alert.alert("Remove Budget", `Remove budget for "${category}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => void removeBudget(category),
      },
    ]);
  }

  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES[0]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topInset + 12, borderBottomColor: colors.border },
        ]}
      >
        <View>
          <Text style={[styles.monthLabel, { color: colors.mutedForeground }]}>{monthName}</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Budget</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={openAdd}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={20} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: 16, paddingBottom: bottomInset + 100 },
        ]}
      >
        {totalBudget > 0 && (
          <View style={[styles.overallCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.overallRow}>
              <View>
                <Text style={[styles.overallLabel, { color: colors.mutedForeground }]}>
                  Total Budget
                </Text>
                <Text style={[styles.overallValue, { color: colors.foreground }]}>
                  ${totalBudget.toFixed(0)}
                </Text>
              </View>
              <View style={styles.overallRight}>
                <Text style={[styles.overallLabel, { color: colors.mutedForeground }]}>
                  Spent
                </Text>
                <Text
                  style={[
                    styles.overallValue,
                    {
                      color:
                        totalSpent > totalBudget ? colors.destructive : colors.income,
                    },
                  ]}
                >
                  ${totalSpent.toFixed(0)}
                </Text>
              </View>
              <View style={styles.overallRight}>
                <Text style={[styles.overallLabel, { color: colors.mutedForeground }]}>
                  Remaining
                </Text>
                <Text
                  style={[
                    styles.overallValue,
                    {
                      color:
                        totalBudget - totalSpent >= 0 ? colors.income : colors.destructive,
                    },
                  ]}
                >
                  ${Math.abs(totalBudget - totalSpent).toFixed(0)}
                </Text>
              </View>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%`,
                    backgroundColor:
                      totalSpent > totalBudget ? colors.destructive : colors.income,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {allCategories.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="target" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No budgets yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Tap + to set monthly spending limits per category
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {allCategories.map((cat) => {
              const limit = budgets[cat];
              const spent = monthlySpending[cat] ?? 0;
              const hasBudget = limit != null;
              const pct = hasBudget ? spent / limit : 0;
              const isOver = hasBudget && spent > limit;

              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.card,
                    { backgroundColor: colors.card, borderColor: isOver ? colors.destructive : colors.border },
                  ]}
                  onPress={() => hasBudget ? openEdit(cat) : openAdd()}
                  onLongPress={() => hasBudget ? void handleDelete(cat) : undefined}
                  activeOpacity={0.8}
                >
                  {hasBudget ? (
                    <BudgetRing spent={spent} limit={limit} size={60} />
                  ) : (
                    <View style={[styles.noRing, { backgroundColor: colors.muted }]}>
                      <Feather name="plus-circle" size={22} color={colors.mutedForeground} />
                    </View>
                  )}
                  <Text style={[styles.catName, { color: colors.foreground }]} numberOfLines={1}>
                    {cat}
                  </Text>
                  {hasBudget ? (
                    <>
                      <Text
                        style={[
                          styles.catSpent,
                          {
                            color: isOver ? colors.destructive : colors.income,
                          },
                        ]}
                      >
                        ${spent.toFixed(0)}
                      </Text>
                      <Text style={[styles.catLimit, { color: colors.mutedForeground }]}>
                        / ${limit.toFixed(0)}
                      </Text>
                      {isOver && (
                        <View style={[styles.overBadge, { backgroundColor: colors.expenseBackground }]}>
                          <Text style={[styles.overText, { color: colors.destructive }]}>
                            Over ${(spent - limit).toFixed(0)}
                          </Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <Text style={[styles.catLimit, { color: colors.mutedForeground }]}>
                      ${spent.toFixed(0)} spent
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        />
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 },
          ]}
        >
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
            {editCategory ? `Edit Budget — ${editCategory}` : "Set Budget"}
          </Text>

          {!editCategory && (
            <View style={styles.categoryPicker}>
              <Text style={[styles.pickerLabel, { color: colors.mutedForeground }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {ALL_CATEGORIES.filter((c) => !budgets[c]).map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          selectedCategory === c ? colors.primary : colors.muted,
                        borderColor:
                          selectedCategory === c ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedCategory(c)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color:
                            selectedCategory === c
                              ? colors.primaryForeground
                              : colors.foreground,
                        },
                      ]}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.amountField}>
            <Text style={[styles.pickerLabel, { color: colors.mutedForeground }]}>
              Monthly Limit
            </Text>
            <View
              style={[
                styles.amountInput,
                { backgroundColor: colors.muted, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.currency, { color: colors.mutedForeground }]}>$</Text>
              <TextInput
                style={[styles.amountText, { color: colors.foreground }]}
                value={limitInput}
                onChangeText={setLimitInput}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                autoFocus
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            onPress={() => void handleSave(editCategory ?? selectedCategory)}
            activeOpacity={0.8}
          >
            <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
              Save Budget
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  monthLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { paddingHorizontal: 16, gap: 12 },
  overallCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
  },
  overallRow: { flexDirection: "row", justifyContent: "space-between" },
  overallRight: { alignItems: "flex-end" },
  overallLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 2 },
  overallValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  empty: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 40,
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    width: "47%",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  noRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  catName: { fontSize: 12, fontFamily: "Inter_500Medium", textAlign: "center" },
  catSpent: { fontSize: 18, fontFamily: "Inter_700Bold" },
  catLimit: { fontSize: 12, fontFamily: "Inter_400Regular" },
  overBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  overText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingTop: 12,
    gap: 16,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  sheetTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  categoryPicker: { gap: 8 },
  pickerLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  chipScroll: { flexGrow: 0 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  amountField: { gap: 8 },
  amountInput: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  currency: { fontSize: 20, fontFamily: "Inter_400Regular" },
  amountText: { flex: 1, fontSize: 24, fontFamily: "Inter_700Bold" },
  saveBtn: {
    borderRadius: 100,
    padding: 15,
    alignItems: "center",
  },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
