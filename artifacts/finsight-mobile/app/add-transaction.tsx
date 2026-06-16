import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useCreateTransaction } from "@workspace/api-client-react";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { useColors } from "@/hooks/useColors";

const CATEGORIES = [
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

const MOODS = [
  { key: "happy", emoji: "😊" },
  { key: "calm", emoji: "😌" },
  { key: "excited", emoji: "🤩" },
  { key: "stressed", emoji: "😰" },
  { key: "anxious", emoji: "😟" },
  { key: "bored", emoji: "😑" },
  { key: "sad", emoji: "😢" },
  { key: "angry", emoji: "😠" },
];

export default function AddTransactionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const createMutation = useCreateTransaction({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries();
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      },
      onError: () => {
        Alert.alert("Error", "Failed to create transaction. Please try again.");
      },
    },
  });

  function handleSubmit() {
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount greater than 0");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Missing Description", "Please enter a description");
      return;
    }

    createMutation.mutate({
      data: {
        amount: amt,
        type,
        category,
        description: description.trim(),
        date,
        moodAtPurchase: selectedMood ?? undefined,
        notes: notes.trim() || undefined,
      },
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topInset + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>New Transaction</Text>
        <TouchableOpacity
          style={[
            styles.saveBtn,
            { backgroundColor: createMutation.isPending ? colors.muted : colors.primary },
          ]}
          onPress={handleSubmit}
          disabled={createMutation.isPending}
          activeOpacity={0.8}
        >
          <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: bottomInset + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.typeToggle, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          {(["expense", "income"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.typeOption,
                {
                  backgroundColor:
                    type === t
                      ? t === "expense"
                        ? colors.expenseBackground
                        : colors.incomeBackground
                      : "transparent",
                },
              ]}
              onPress={() => setType(t)}
              activeOpacity={0.8}
            >
              <Feather
                name={t === "expense" ? "arrow-up-right" : "arrow-down-left"}
                size={16}
                color={
                  type === t
                    ? t === "expense"
                      ? colors.expense
                      : colors.income
                    : colors.mutedForeground
                }
              />
              <Text
                style={[
                  styles.typeText,
                  {
                    color:
                      type === t
                        ? t === "expense"
                          ? colors.expense
                          : colors.income
                        : colors.mutedForeground,
                  },
                ]}
              >
                {t === "expense" ? "Expense" : "Income"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.amountContainer}>
          <Text style={[styles.currencySymbol, { color: colors.mutedForeground }]}>$</Text>
          <TextInput
            style={[styles.amountInput, { color: colors.foreground }]}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.mutedForeground}
            autoFocus
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>Description</Text>
            <TextInput
              style={[styles.rowInput, { color: colors.foreground }]}
              value={description}
              onChangeText={setDescription}
              placeholder="What did you spend on?"
              placeholderTextColor={colors.mutedForeground}
              returnKeyType="next"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>Date</Text>
            <TextInput
              style={[styles.rowInput, { color: colors.foreground }]}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>Notes</Text>
            <TextInput
              style={[styles.rowInput, { color: colors.foreground }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional notes"
              placeholderTextColor={colors.mutedForeground}
              multiline
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>CATEGORY</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.chip,
                  {
                    backgroundColor: category === c ? colors.primary : colors.muted,
                    borderColor: category === c ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setCategory(c)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: category === c ? colors.primaryForeground : colors.foreground },
                  ]}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>MOOD (OPTIONAL)</Text>
          <View style={styles.moodGrid}>
            {MOODS.map((m) => (
              <TouchableOpacity
                key={m.key}
                style={[
                  styles.moodChip,
                  {
                    backgroundColor: selectedMood === m.key ? colors.accent : colors.muted,
                    borderColor: selectedMood === m.key ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedMood(selectedMood === m.key ? null : m.key)}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text style={[styles.moodLabel, { color: colors.foreground }]}>
                  {m.key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: "Inter_600SemiBold" },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  scroll: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },
  typeToggle: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
    gap: 4,
  },
  typeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  typeText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 4,
  },
  currencySymbol: { fontSize: 32, fontFamily: "Inter_400Regular", paddingBottom: 4 },
  amountInput: { fontSize: 48, fontFamily: "Inter_700Bold", minWidth: 100, textAlign: "center" },
  section: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    padding: 16,
    gap: 12,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowLabel: { width: 88, fontSize: 14, fontFamily: "Inter_500Medium" },
  rowInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", textAlignVertical: "top" },
  divider: { height: StyleSheet.hairlineWidth },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  moodGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  moodChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    gap: 2,
    minWidth: 72,
  },
  moodEmoji: { fontSize: 20 },
  moodLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
