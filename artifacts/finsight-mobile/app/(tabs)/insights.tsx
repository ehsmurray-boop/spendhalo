import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  useGetTimeCostBreakdown,
  useGetSpendingDna,
  useGetRegretAnalysis,
  useGetMoodCorrelation,
  useGetProfile,
} from "@workspace/api-client-react";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProGate } from "@/components/ProGate";
import { usePro } from "@/context/ProContext";
import { useColors } from "@/hooks/useColors";

const MOOD_EMOJI: Record<string, string> = {
  happy: "😊", calm: "😌", stressed: "😰", anxious: "😟",
  bored: "😑", sad: "😢", excited: "🤩", angry: "😠",
};

export default function InsightsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isPro } = usePro();
  const router = useRouter();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const { data: profile } = useGetProfile();
  const { data: timeCost, isLoading: tcLoading, refetch: refetchTc, isRefetching: tcRefreshing } =
    useGetTimeCostBreakdown();
  const { data: dna, refetch: refetchDna } = useGetSpendingDna();
  const { data: regret, refetch: refetchRegret } = useGetRegretAnalysis();
  const { data: mood, refetch: refetchMood } = useGetMoodCorrelation();

  const hourlyWage = profile?.hourlyWage ?? 20;

  function handleRefresh() {
    void refetchTc();
    if (isPro) {
      void refetchDna();
      void refetchRegret();
      void refetchMood();
    }
  }

  const topTimeCostItems = (timeCost ?? [])
    .sort((a, b) => b.hoursOfWork - a.hoursOfWork)
    .slice(0, 5);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topInset + 16, paddingBottom: bottomInset + 100 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={tcRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Insights</Text>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="clock" size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Time Cost</Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
            At ${hourlyWage}/hr — purchases as hours of your life
          </Text>
          {tcLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : topTimeCostItems.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Add expense transactions to see time cost
            </Text>
          ) : (
            topTimeCostItems.map((item) => (
              <View
                key={item.transactionId}
                style={[styles.timeCostRow, { borderTopColor: colors.border }]}
              >
                <View style={styles.timeCostInfo}>
                  <Text style={[styles.timeCostDesc, { color: colors.foreground }]} numberOfLines={1}>
                    {item.description}
                  </Text>
                  <Text style={[styles.timeCostCat, { color: colors.mutedForeground }]}>
                    {item.category}
                  </Text>
                </View>
                <View style={styles.timeCostRight}>
                  <Text style={[styles.timeCostHours, { color: colors.primary }]}>
                    {item.hoursOfWork.toFixed(1)}h
                  </Text>
                  <Text style={[styles.timeCostAmount, { color: colors.mutedForeground }]}>
                    ${item.amount.toFixed(0)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <ProGate
          title="Spending DNA"
          description="Discover your spending personality, peak days, and behavioral patterns."
        >
          {dna && (
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Feather name="activity" size={16} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Spending DNA</Text>
              </View>
              <View style={[styles.dnaPersonality, { backgroundColor: colors.accent }]}>
                <Text style={[styles.dnaPersonalityLabel, { color: colors.mutedForeground }]}>You are</Text>
                <Text style={[styles.dnaPersonalityText, { color: colors.primary }]}>
                  {dna.spendingPersonality}
                </Text>
              </View>
              <View style={styles.dnaScores}>
                {[
                  { label: "Impulse", value: dna.impulseScore },
                  { label: "Consistency", value: dna.consistencyScore },
                  { label: "Diversity", value: dna.diversityScore },
                ].map((s) => (
                  <View key={s.label} style={styles.dnaScore}>
                    <View style={styles.dnaScoreRow}>
                      <Text style={[styles.dnaScoreLabel, { color: colors.mutedForeground }]}>
                        {s.label}
                      </Text>
                      <Text style={[styles.dnaScoreValue, { color: colors.foreground }]}>
                        {s.value.toFixed(0)}
                      </Text>
                    </View>
                    <View style={[styles.dnaBar, { backgroundColor: colors.muted }]}>
                      <View
                        style={[
                          styles.dnaBarFill,
                          { backgroundColor: colors.primary, width: `${s.value}%` },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
              {dna.topPatterns.length > 0 && (
                <View style={styles.patterns}>
                  {dna.topPatterns.map((p) => (
                    <View key={p} style={[styles.patternChip, { backgroundColor: colors.muted }]}>
                      <Text style={[styles.patternText, { color: colors.foreground }]}>{p}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </ProGate>

        <ProGate
          title="Regret Analysis"
          description="See which purchases you regret most and identify costly patterns."
        >
          {regret && (
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Feather name="alert-triangle" size={16} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Regret Analysis</Text>
              </View>
              <View style={styles.regretStats}>
                <View style={styles.regretStat}>
                  <Text style={[styles.regretStatValue, { color: colors.foreground }]}>
                    {regret.avgRegretScore.toFixed(1)}/5
                  </Text>
                  <Text style={[styles.regretStatLabel, { color: colors.mutedForeground }]}>Avg Regret</Text>
                </View>
                <View style={styles.regretStat}>
                  <Text style={[styles.regretStatValue, { color: colors.expense }]}>
                    ${regret.totalRegretted.toFixed(0)}
                  </Text>
                  <Text style={[styles.regretStatLabel, { color: colors.mutedForeground }]}>Regretted $</Text>
                </View>
              </View>
              <View style={[styles.regretCategory, { backgroundColor: colors.expenseBackground }]}>
                <Text style={[styles.regretCatLabel, { color: colors.mutedForeground }]}>Most Regretted</Text>
                <Text style={[styles.regretCatValue, { color: colors.expense }]}>
                  {regret.mostRegrettedCategory}
                </Text>
              </View>
            </View>
          )}
        </ProGate>

        <ProGate
          title="Mood & Money"
          description="Understand how your emotional state drives spending decisions."
        >
          {mood && mood.length > 0 && (
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Feather name="heart" size={16} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mood & Money</Text>
              </View>
              {mood.slice(0, 5).map((m) => (
                <View key={m.mood} style={[styles.moodRow, { borderTopColor: colors.border }]}>
                  <Text style={styles.moodEmoji}>{MOOD_EMOJI[m.mood] ?? "😐"}</Text>
                  <View style={styles.moodInfo}>
                    <Text style={[styles.moodName, { color: colors.foreground }]}>
                      {m.mood.charAt(0).toUpperCase() + m.mood.slice(1)}
                    </Text>
                    <Text style={[styles.moodCount, { color: colors.mutedForeground }]}>
                      {m.count} purchases
                    </Text>
                  </View>
                  <Text style={[styles.moodAvg, { color: colors.foreground }]}>
                    ${m.avgSpend.toFixed(0)} avg
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ProGate>

        <TouchableOpacity
          style={[styles.whatIfBanner, { backgroundColor: colors.accent, borderColor: colors.border }]}
          onPress={() => isPro ? router.push("/what-if") : router.push("/upgrade")}
          activeOpacity={0.8}
        >
          <View style={[styles.whatIfIcon, { backgroundColor: colors.primary }]}>
            <Feather name="trending-up" size={18} color={colors.primaryForeground} />
          </View>
          <View style={styles.whatIfText}>
            <Text style={[styles.whatIfTitle, { color: colors.primary }]}>What-If Simulator</Text>
            <Text style={[styles.whatIfSub, { color: colors.mutedForeground }]}>
              {isPro
                ? "Project your savings with scenario simulations →"
                : "Upgrade to Pro to simulate financial scenarios"}
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, gap: 12 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  section: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden", paddingBottom: 8 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  loader: { marginVertical: 16 },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", padding: 16 },
  timeCostRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  timeCostInfo: { flex: 1, gap: 2 },
  timeCostDesc: { fontSize: 14, fontFamily: "Inter_500Medium" },
  timeCostCat: { fontSize: 12, fontFamily: "Inter_400Regular" },
  timeCostRight: { alignItems: "flex-end", gap: 2 },
  timeCostHours: { fontSize: 16, fontFamily: "Inter_700Bold" },
  timeCostAmount: { fontSize: 11, fontFamily: "Inter_400Regular" },
  dnaPersonality: { marginHorizontal: 16, marginBottom: 12, borderRadius: 10, padding: 14, gap: 4 },
  dnaPersonalityLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  dnaPersonalityText: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  dnaScores: { paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  dnaScore: { gap: 4 },
  dnaScoreRow: { flexDirection: "row", justifyContent: "space-between" },
  dnaScoreLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  dnaScoreValue: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  dnaBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  dnaBarFill: { height: 6, borderRadius: 3 },
  patterns: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 6, paddingBottom: 4 },
  patternChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  patternText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  regretStats: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 24 },
  regretStat: { gap: 2 },
  regretStatValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  regretStatLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  regretCategory: { marginHorizontal: 16, marginBottom: 8, borderRadius: 10, padding: 12, gap: 4 },
  regretCatLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  regretCatValue: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  moodRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  moodEmoji: { fontSize: 24 },
  moodInfo: { flex: 1, gap: 2 },
  moodName: { fontSize: 14, fontFamily: "Inter_500Medium" },
  moodCount: { fontSize: 12, fontFamily: "Inter_400Regular" },
  moodAvg: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  whatIfBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
  },
  whatIfIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  whatIfText: { flex: 1, gap: 2 },
  whatIfTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  whatIfSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
