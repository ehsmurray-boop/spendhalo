import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useCreateMoodLog, useListTransactions } from "@workspace/api-client-react";
import React, { useMemo, useState } from "react";
import {
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

const MOODS = [
  { key: "happy", emoji: "😊", label: "Happy" },
  { key: "calm", emoji: "😌", label: "Calm" },
  { key: "excited", emoji: "🤩", label: "Excited" },
  { key: "stressed", emoji: "😰", label: "Stressed" },
  { key: "anxious", emoji: "😟", label: "Anxious" },
  { key: "bored", emoji: "😑", label: "Bored" },
  { key: "sad", emoji: "😢", label: "Sad" },
  { key: "angry", emoji: "😠", label: "Angry" },
];

export default function MoodLogScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const { data: transactions } = useListTransactions({ limit: 500 });

  const todaySpent = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return (transactions ?? [])
      .filter((t) => t.type === "expense" && t.date.startsWith(today))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const createMutation = useCreateMoodLog({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries();
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      },
    },
  });

  function handleSubmit() {
    if (!selectedMood) return;
    createMutation.mutate({
      data: {
        mood: selectedMood,
        note: note.trim() || undefined,
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
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Log Mood</Text>
        <View style={styles.closeBtn} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomInset + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.question, { color: colors.foreground }]}>
          How are you feeling today?
        </Text>

        {todaySpent > 0 && (
          <View
            style={[
              styles.spendingBadge,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          >
            <Feather name="shopping-bag" size={14} color={colors.mutedForeground} />
            <Text style={[styles.spendingText, { color: colors.mutedForeground }]}>
              You've spent{" "}
              <Text style={[styles.spendingAmount, { color: colors.foreground }]}>
                ${todaySpent.toFixed(2)}
              </Text>{" "}
              today
            </Text>
          </View>
        )}

        {todaySpent === 0 && (
          <View
            style={[
              styles.spendingBadge,
              { backgroundColor: colors.incomeBackground, borderColor: colors.border },
            ]}
          >
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={[styles.spendingText, { color: colors.income }]}>
              No spending today — you're on a streak!
            </Text>
          </View>
        )}

        <View style={styles.moodGrid}>
          {MOODS.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[
                styles.moodCard,
                {
                  backgroundColor:
                    selectedMood === m.key ? colors.accent : colors.card,
                  borderColor:
                    selectedMood === m.key ? colors.primary : colors.border,
                  borderWidth: selectedMood === m.key ? 2 : StyleSheet.hairlineWidth,
                },
              ]}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedMood(m.key);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.moodEmoji}>{m.emoji}</Text>
              <Text
                style={[
                  styles.moodLabel,
                  {
                    color:
                      selectedMood === m.key ? colors.primary : colors.mutedForeground,
                  },
                ]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View
          style={[
            styles.noteSection,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.noteLabel, { color: colors.mutedForeground }]}>
            Add a note (optional)
          </Text>
          <TextInput
            style={[styles.noteInput, { color: colors.foreground }]}
            value={note}
            onChangeText={setNote}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.submitBtn,
            {
              backgroundColor: selectedMood ? colors.primary : colors.muted,
            },
          ]}
          onPress={handleSubmit}
          disabled={!selectedMood || createMutation.isPending}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.submitText,
              {
                color: selectedMood ? colors.primaryForeground : colors.mutedForeground,
              },
            ]}
          >
            {createMutation.isPending ? "Logging..." : "Log Mood"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  scroll: { paddingHorizontal: 20, paddingTop: 24, gap: 20 },
  question: { fontSize: 24, fontFamily: "Inter_700Bold", textAlign: "center" },
  spendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  streakEmoji: { fontSize: 16 },
  spendingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  spendingAmount: { fontFamily: "Inter_600SemiBold" },
  moodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  moodCard: {
    width: "22%",
    aspectRatio: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  moodEmoji: { fontSize: 28 },
  moodLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  noteSection: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 8,
  },
  noteLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  noteInput: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlignVertical: "top",
    minHeight: 60,
  },
  submitBtn: {
    borderRadius: 100,
    padding: 16,
    alignItems: "center",
  },
  submitText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
