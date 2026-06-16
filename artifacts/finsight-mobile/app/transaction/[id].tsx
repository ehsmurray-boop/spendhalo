import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useDeleteTransaction,
  useGetTransaction,
  useRateTransactionRegret,
  useUpdateTransaction,
} from "@workspace/api-client-react";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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

import { usePro } from "@/context/ProContext";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = [
  "Food & Dining", "Transportation", "Housing", "Entertainment",
  "Healthcare", "Shopping", "Education", "Utilities", "Savings", "Other",
];

const MOODS = ["happy", "calm", "excited", "stressed", "anxious", "bored", "sad", "angry"];
const MOOD_EMOJI: Record<string, string> = {
  happy: "😊", calm: "😌", excited: "🤩", stressed: "😰",
  anxious: "😟", bored: "😑", sad: "😢", angry: "😠",
};

export default function TransactionDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { isPro } = usePro();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const numericId = Number(id);
  const { data: txn, isLoading } = useGetTransaction(numericId);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [regretScore, setRegretScore] = useState<number>(0);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (txn) {
      setDescription(txn.description);
      setAmount(String(txn.amount));
      setCategory(txn.category);
      setDate(txn.date.substring(0, 10));
      setNotes(txn.notes ?? "");
      setMood(txn.moodAtPurchase ?? null);
      setRegretScore(txn.regretScore ?? 0);
    }
  }, [txn]);

  const updateMutation = useUpdateTransaction({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries();
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsDirty(false);
        router.back();
      },
    },
  });

  const deleteMutation = useDeleteTransaction({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries();
        router.back();
      },
    },
  });

  const regretMutation = useRateTransactionRegret({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries();
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
    },
  });

  function handleSave() {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert("Invalid", "Please enter a valid amount");
      return;
    }
    updateMutation.mutate({
      id: numericId,
      data: {
        description: description.trim(),
        amount: amt,
        category,
        date,
        notes: notes.trim() || undefined,
        moodAtPurchase: mood ?? undefined,
      },
    });
  }

  function handleDelete() {
    Alert.alert("Delete", `Delete "${txn?.description}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          deleteMutation.mutate({ id: numericId });
        },
      },
    ]);
  }

  function handleRegretStar(score: number) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRegretScore(score);
    regretMutation.mutate({ id: numericId, data: { score } });
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!txn) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
          Transaction not found
        </Text>
      </View>
    );
  }

  const isIncome = txn.type === "income";
  const amountColor = isIncome ? colors.income : colors.expense;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="chevron-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Transaction</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
          <Feather name="trash-2" size={20} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomInset + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.amountHero}>
          <View
            style={[
              styles.typePill,
              { backgroundColor: isIncome ? colors.incomeBackground : colors.expenseBackground },
            ]}
          >
            <Text style={[styles.typePillText, { color: amountColor }]}>
              {isIncome ? "INCOME" : "EXPENSE"}
            </Text>
          </View>
          <Text style={[styles.heroAmount, { color: amountColor }]}>
            {isIncome ? "+" : "-"}${parseFloat(amount || "0").toFixed(2)}
          </Text>
          <Text style={[styles.heroDate, { color: colors.mutedForeground }]}>
            {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "long", month: "long", day: "numeric",
            })}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>Description</Text>
            <TextInput
              style={[styles.rowInput, { color: colors.foreground }]}
              value={description}
              onChangeText={(v) => { setDescription(v); setIsDirty(true); }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>Amount</Text>
            <TextInput
              style={[styles.rowInput, { color: colors.foreground }]}
              value={amount}
              onChangeText={(v) => { setAmount(v); setIsDirty(true); }}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>Date</Text>
            <TextInput
              style={[styles.rowInput, { color: colors.foreground }]}
              value={date}
              onChangeText={(v) => { setDate(v); setIsDirty(true); }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>Notes</Text>
            <TextInput
              style={[styles.rowInput, { color: colors.foreground }]}
              value={notes}
              onChangeText={(v) => { setNotes(v); setIsDirty(true); }}
              placeholder="Add notes..."
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
                onPress={() => { setCategory(c); setIsDirty(true); }}
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

        {txn.type === "expense" && (
          <View
            style={[
              styles.section,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: isPro ? 1 : 0.6,
              },
            ]}
          >
            <View style={styles.regretHeader}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                REGRET SCORE
              </Text>
              {!isPro && (
                <View style={[styles.proBadge, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.proText, { color: colors.primary }]}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={[styles.regretNote, { color: colors.mutedForeground }]}>
              How much do you regret this purchase?
            </Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => isPro && handleRegretStar(star)}
                  style={styles.starBtn}
                  disabled={!isPro}
                >
                  <Feather
                    name={star <= regretScore ? "star" : "star"}
                    size={32}
                    color={star <= regretScore ? "#D4940A" : colors.border}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {regretScore > 0 && (
              <Text style={[styles.regretLabel, { color: colors.mutedForeground }]}>
                {["", "No regret", "A little", "Some regret", "Quite a bit", "Major regret"][regretScore]}
              </Text>
            )}
          </View>
        )}

        {isDirty && (
          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: updateMutation.isPending ? colors.muted : colors.primary },
            ]}
            onPress={handleSave}
            disabled={updateMutation.isPending}
            activeOpacity={0.8}
          >
            <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
              Save Changes
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  scroll: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },
  amountHero: { alignItems: "center", paddingVertical: 8, gap: 8 },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  typePillText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  heroAmount: { fontSize: 42, fontFamily: "Inter_700Bold" },
  heroDate: { fontSize: 14, fontFamily: "Inter_400Regular" },
  section: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    padding: 16,
    gap: 12,
  },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  rowLabel: { width: 88, fontSize: 14, fontFamily: "Inter_500Medium", paddingTop: 2 },
  rowInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  divider: { height: StyleSheet.hairlineWidth },
  fieldLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  regretHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  proBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  proText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  regretNote: { fontSize: 13, fontFamily: "Inter_400Regular" },
  stars: { flexDirection: "row", gap: 8 },
  starBtn: { padding: 4 },
  regretLabel: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  saveBtn: {
    borderRadius: 100,
    padding: 16,
    alignItems: "center",
    marginTop: 4,
  },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
