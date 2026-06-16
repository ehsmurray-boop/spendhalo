import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useGetProfile, useUpdateProfile } from "@workspace/api-client-react";
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

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "INR"];
const MOODS = ["happy", "calm", "stressed", "anxious", "bored", "sad", "excited", "angry"];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isPro } = usePro();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const { data: profile, isLoading } = useGetProfile();

  const [name, setName] = useState("");
  const [hourlyWage, setHourlyWage] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [monthlyIncomeGoal, setMonthlyIncomeGoal] = useState("");
  const [monthlySavingsGoal, setMonthlySavingsGoal] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setHourlyWage(String(profile.hourlyWage ?? 20));
      setCurrency(profile.currency ?? "USD");
      setMonthlyIncomeGoal(profile.monthlyIncomeGoal != null ? String(profile.monthlyIncomeGoal) : "");
      setMonthlySavingsGoal(profile.monthlySavingsGoal != null ? String(profile.monthlySavingsGoal) : "");
    }
  }, [profile]);

  const updateMutation = useUpdateProfile({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries();
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Saved", "Profile updated successfully");
      },
      onError: () => {
        Alert.alert("Error", "Failed to save profile");
      },
    },
  });

  function handleSave() {
    const wage = parseFloat(hourlyWage);
    if (isNaN(wage) || wage <= 0) {
      Alert.alert("Invalid", "Please enter a valid hourly wage");
      return;
    }
    updateMutation.mutate({
      data: {
        name: name.trim() || undefined,
        hourlyWage: wage,
        currency,
        monthlyIncomeGoal: monthlyIncomeGoal ? parseFloat(monthlyIncomeGoal) : null,
        monthlySavingsGoal: monthlySavingsGoal ? parseFloat(monthlySavingsGoal) : null,
      },
    });
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topInset + 16, paddingBottom: bottomInset + 100 },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>

        {isPro ? (
          <View style={[styles.proBanner, { backgroundColor: colors.primary }]}>
            <Feather name="star" size={18} color={colors.primaryForeground} />
            <View style={styles.proBannerText}>
              <Text style={[styles.proBannerTitle, { color: colors.primaryForeground }]}>
                FinSight Pro
              </Text>
              <Text style={[styles.proBannerSub, { color: `${colors.primaryForeground}99` }]}>
                All features unlocked
              </Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.upgradeCard, { backgroundColor: colors.accent, borderColor: colors.border }]}
            onPress={() => router.push("/upgrade")}
            activeOpacity={0.8}
          >
            <View style={styles.upgradeLeft}>
              <Feather name="lock" size={18} color={colors.primary} />
              <View>
                <Text style={[styles.upgradeTitle, { color: colors.primary }]}>Upgrade to Pro</Text>
                <Text style={[styles.upgradeSub, { color: colors.mutedForeground }]}>
                  $7.99/mo · Unlock all features
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <>
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>PROFILE</Text>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>Name</Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>Hourly Wage</Text>
                <Text style={[styles.fieldNote, { color: colors.mutedForeground }]}>
                  Used to calculate time cost of purchases
                </Text>
                <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                  <Text style={[styles.inputPrefix, { color: colors.mutedForeground }]}>$</Text>
                  <TextInput
                    style={[styles.inputInner, { color: colors.foreground }]}
                    value={hourlyWage}
                    onChangeText={setHourlyWage}
                    keyboardType="decimal-pad"
                    placeholder="20"
                    placeholderTextColor={colors.mutedForeground}
                  />
                  <Text style={[styles.inputSuffix, { color: colors.mutedForeground }]}>/hr</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>Currency</Text>
                <View style={styles.currencyRow}>
                  {CURRENCIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.currencyChip,
                        {
                          backgroundColor: currency === c ? colors.primary : colors.muted,
                          borderColor: currency === c ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setCurrency(c)}
                    >
                      <Text
                        style={[
                          styles.currencyText,
                          { color: currency === c ? colors.primaryForeground : colors.foreground },
                        ]}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>MONTHLY GOALS</Text>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>Income Goal</Text>
                <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                  <Text style={[styles.inputPrefix, { color: colors.mutedForeground }]}>$</Text>
                  <TextInput
                    style={[styles.inputInner, { color: colors.foreground }]}
                    value={monthlyIncomeGoal}
                    onChangeText={setMonthlyIncomeGoal}
                    keyboardType="decimal-pad"
                    placeholder="Optional"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>Savings Goal</Text>
                <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                  <Text style={[styles.inputPrefix, { color: colors.mutedForeground }]}>$</Text>
                  <TextInput
                    style={[styles.inputInner, { color: colors.foreground }]}
                    value={monthlySavingsGoal}
                    onChangeText={setMonthlySavingsGoal}
                    keyboardType="decimal-pad"
                    placeholder="Optional"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: updateMutation.isPending ? colors.muted : colors.primary,
                },
              ]}
              onPress={handleSave}
              disabled={updateMutation.isPending}
              activeOpacity={0.8}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator color={colors.mutedForeground} size="small" />
              ) : (
                <Text style={[styles.saveButtonText, { color: colors.primaryForeground }]}>
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, gap: 12 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  loader: { marginTop: 40 },
  proBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  proBannerText: { gap: 2 },
  proBannerTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  proBannerSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  upgradeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  upgradeLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  upgradeTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  upgradeSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  section: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  field: { paddingHorizontal: 16, paddingBottom: 14, gap: 6 },
  label: { fontSize: 14, fontFamily: "Inter_500Medium" },
  fieldNote: { fontSize: 12, fontFamily: "Inter_400Regular" },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  inputPrefix: { fontSize: 15, fontFamily: "Inter_400Regular" },
  inputInner: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  inputSuffix: { fontSize: 15, fontFamily: "Inter_400Regular" },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16, marginBottom: 14 },
  currencyRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  currencyChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  currencyText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  saveButton: {
    borderRadius: 100,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  saveButtonText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
