import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePro } from "@/context/ProContext";
import { useColors } from "@/hooks/useColors";

const PRO_FEATURES = [
  {
    icon: "activity" as const,
    title: "Spending DNA",
    description: "Discover your spending personality and behavioral patterns",
  },
  {
    icon: "alert-triangle" as const,
    title: "Regret Analysis",
    description: "Track which purchases you regret and why",
  },
  {
    icon: "trending-up" as const,
    title: "What-If Simulator",
    description: "Project your savings by simulating financial changes",
  },
  {
    icon: "heart" as const,
    title: "Mood & Money",
    description: "Correlate emotional states with spending behavior",
  },
];

export default function UpgradeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPro, userId } = usePro();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
  const price = billingPeriod === "monthly" ? "$7.99/mo" : "$69/yr";
  const savings = billingPeriod === "yearly" ? "Save 28%" : null;

  function handleSubscribe() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const url = `https://${domain}/upgrade?userId=${userId}`;
    void Linking.openURL(url);
  }

  if (isPro) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topInset + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="chevron-left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Pro Plan</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.alreadyPro}>
          <View style={[styles.proIcon, { backgroundColor: colors.primary }]}>
            <Feather name="star" size={32} color={colors.primaryForeground} />
          </View>
          <Text style={[styles.alreadyProTitle, { color: colors.foreground }]}>
            You're already Pro!
          </Text>
          <Text style={[styles.alreadyProSub, { color: colors.mutedForeground }]}>
            All features are unlocked. Enjoy FinSight Pro.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topInset + 12, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Upgrade to Pro</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomInset + 40 }]}
      >
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <Feather name="star" size={36} color={colors.primaryForeground} />
          <Text style={[styles.heroTitle, { color: colors.primaryForeground }]}>FinSight Pro</Text>
          <Text style={[styles.heroSub, { color: `${colors.primaryForeground}99` }]}>
            Unlock powerful financial insights
          </Text>
        </View>

        <View style={styles.featureList}>
          {PRO_FEATURES.map((feature) => (
            <View
              key={feature.title}
              style={[styles.featureRow, { borderBottomColor: colors.border }]}
            >
              <View style={[styles.featureIcon, { backgroundColor: colors.accent }]}>
                <Feather name={feature.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: colors.foreground }]}>
                  {feature.title}
                </Text>
                <Text style={[styles.featureDesc, { color: colors.mutedForeground }]}>
                  {feature.description}
                </Text>
              </View>
              <Feather name="check-circle" size={18} color={colors.income} />
            </View>
          ))}
        </View>

        <View style={[styles.billingToggle, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          {(["monthly", "yearly"] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.billingOption,
                period === billingPeriod && { backgroundColor: colors.card },
              ]}
              onPress={() => setBillingPeriod(period)}
            >
              <Text
                style={[
                  styles.billingLabel,
                  { color: period === billingPeriod ? colors.foreground : colors.mutedForeground },
                ]}
              >
                {period === "monthly" ? "Monthly" : "Yearly"}
              </Text>
              {period === "yearly" && (
                <View style={[styles.savingsBadge, { backgroundColor: colors.incomeBackground }]}>
                  <Text style={[styles.savingsText, { color: colors.income }]}>Save 28%</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.priceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.priceAmount, { color: colors.foreground }]}>{price}</Text>
          <Text style={[styles.priceNote, { color: colors.mutedForeground }]}>
            {billingPeriod === "monthly"
              ? "Billed monthly. Cancel anytime."
              : "Billed annually. Equivalent to $5.75/mo."}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.subscribeButton, { backgroundColor: colors.primary }]}
          onPress={handleSubscribe}
          activeOpacity={0.8}
        >
          <Text style={[styles.subscribeText, { color: colors.primaryForeground }]}>
            Subscribe on Web
          </Text>
          <Feather name="external-link" size={16} color={`${colors.primaryForeground}99`} />
        </TouchableOpacity>

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          Subscription is managed on the FinSight web app. You'll be taken to a secure Stripe checkout.
        </Text>
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
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontFamily: "Inter_600SemiBold" },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  hero: {
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    gap: 8,
  },
  heroTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  heroSub: { fontSize: 14, fontFamily: "Inter_400Regular" },
  featureList: { gap: 0 },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: { flex: 1, gap: 2 },
  featureTitle: { fontSize: 15, fontFamily: "Inter_500Medium" },
  featureDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  billingToggle: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
    gap: 4,
  },
  billingOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  billingLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  savingsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  savingsText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  priceCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    alignItems: "center",
    gap: 6,
  },
  priceAmount: { fontSize: 32, fontFamily: "Inter_700Bold" },
  priceNote: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  subscribeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100,
    padding: 16,
    gap: 8,
  },
  subscribeText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  disclaimer: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
  },
  alreadyPro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 16,
  },
  proIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  alreadyProTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  alreadyProSub: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
});
