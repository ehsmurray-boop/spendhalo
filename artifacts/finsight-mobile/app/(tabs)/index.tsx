import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useGetDashboardSummary, useListTransactions } from "@workspace/api-client-react";
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

import { MetricCard } from "@/components/MetricCard";
import { TransactionRow } from "@/components/TransactionRow";
import { useColors } from "@/hooks/useColors";

function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`;
  }
  return `$${amount.toFixed(0)}`;
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    data: dashboard,
    isLoading,
    refetch,
    isRefetching,
  } = useGetDashboardSummary();

  const { data: transactions } = useListTransactions({ limit: 5 });

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const netBalance = dashboard?.netBalance ?? 0;
  const isPositive = netBalance >= 0;

  function handleAdd() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/add-transaction");
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topInset + 16, paddingBottom: bottomInset + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Overview</Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleAdd}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={20} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <>
            <View
              style={[
                styles.balanceCard,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={[styles.balanceLabel, { color: `${colors.primaryForeground}99` }]}>
                Net Balance
              </Text>
              <Text style={[styles.balanceAmount, { color: colors.primaryForeground }]}>
                {isPositive ? "+" : ""}${Math.abs(netBalance).toFixed(2)}
              </Text>
              <View style={styles.balanceRow}>
                <View style={styles.balanceStat}>
                  <Feather name="arrow-down-circle" size={14} color={`${colors.primaryForeground}99`} />
                  <Text style={[styles.balanceStatLabel, { color: `${colors.primaryForeground}99` }]}>
                    Income
                  </Text>
                  <Text style={[styles.balanceStatValue, { color: colors.primaryForeground }]}>
                    {formatCurrency(dashboard?.currentMonthIncome ?? 0)}
                  </Text>
                </View>
                <View style={[styles.balanceDivider, { backgroundColor: `${colors.primaryForeground}33` }]} />
                <View style={styles.balanceStat}>
                  <Feather name="arrow-up-circle" size={14} color={`${colors.primaryForeground}99`} />
                  <Text style={[styles.balanceStatLabel, { color: `${colors.primaryForeground}99` }]}>
                    Spent
                  </Text>
                  <Text style={[styles.balanceStatValue, { color: colors.primaryForeground }]}>
                    {formatCurrency(dashboard?.currentMonthExpenses ?? 0)}
                  </Text>
                </View>
                <View style={[styles.balanceDivider, { backgroundColor: `${colors.primaryForeground}33` }]} />
                <View style={styles.balanceStat}>
                  <Feather name="percent" size={14} color={`${colors.primaryForeground}99`} />
                  <Text style={[styles.balanceStatLabel, { color: `${colors.primaryForeground}99` }]}>
                    Saved
                  </Text>
                  <Text style={[styles.balanceStatValue, { color: colors.primaryForeground }]}>
                    {(dashboard?.savingsRate ?? 0).toFixed(0)}%
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.metricsRow}>
              <MetricCard
                label="Total Transactions"
                value={String(dashboard?.transactionCount ?? 0)}
                subtitle="all time"
              />
              <MetricCard
                label="Avg Daily Spend"
                value={`$${(dashboard?.avgDailySpend ?? 0).toFixed(0)}`}
                subtitle="per day"
              />
            </View>

            {(dashboard?.categoryBreakdown?.length ?? 0) > 0 && (
              <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Top Categories
                </Text>
                {dashboard!.categoryBreakdown!.slice(0, 4).map((cat) => (
                  <View key={cat.category} style={styles.categoryRow}>
                    <View style={styles.categoryLeft}>
                      <Text style={[styles.categoryName, { color: colors.foreground }]}>
                        {cat.category}
                      </Text>
                      <Text style={[styles.categoryCount, { color: colors.mutedForeground }]}>
                        {cat.count} txns
                      </Text>
                    </View>
                    <View style={styles.categoryRight}>
                      <View style={[styles.barTrack, { backgroundColor: colors.muted }]}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              backgroundColor: colors.primary,
                              width: `${Math.min(cat.percentage, 100)}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.categoryAmount, { color: colors.foreground }]}>
                        ${cat.total.toFixed(0)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {(transactions?.length ?? 0) > 0 && (
              <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    Recent
                  </Text>
                  <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
                    <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
                  </TouchableOpacity>
                </View>
                {transactions!.map((txn) => (
                  <TransactionRow key={txn.id} transaction={txn} />
                ))}
              </View>
            )}

            {!isLoading && (transactions?.length ?? 0) === 0 && (
              <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="inbox" size={32} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  No transactions yet
                </Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Tap + to add your first transaction
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  greeting: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loader: {
    marginTop: 60,
  },
  balanceCard: {
    borderRadius: 16,
    padding: 20,
    gap: 4,
  },
  balanceLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  balanceStat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  balanceDivider: {
    width: 1,
    height: 32,
  },
  balanceStatLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  balanceStatValue: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
  },
  section: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  seeAll: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  categoryLeft: {
    width: 100,
    gap: 2,
  },
  categoryName: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  categoryCount: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  categoryRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  categoryAmount: {
    width: 48,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textAlign: "right",
  },
  emptyState: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 40,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
