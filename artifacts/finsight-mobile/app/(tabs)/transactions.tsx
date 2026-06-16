import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import {
  useDeleteTransaction,
  useListTransactions,
  useRateTransactionRegret,
} from "@workspace/api-client-react";
import React, { useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { TransactionRow } from "@/components/TransactionRow";
import { useColors } from "@/hooks/useColors";
import type { Transaction } from "@workspace/api-client-react";

const FILTERS = ["All", "Income", "Expense"] as const;
type Filter = (typeof FILTERS)[number];

function SwipeableRow({
  transaction,
  onPress,
  onDelete,
  onRegret,
}: {
  transaction: Transaction;
  onPress: () => void;
  onDelete: () => void;
  onRegret: (score: number) => void;
}) {
  const colors = useColors();
  const swipeRef = useRef<Swipeable>(null);

  function handleRegretAction() {
    swipeRef.current?.close();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Rate Regret",
      `"${transaction.description}" — how much do you regret this?`,
      [
        { text: "★☆☆☆☆  No regret", onPress: () => onRegret(1) },
        { text: "★★☆☆☆  A little", onPress: () => onRegret(2) },
        { text: "★★★☆☆  Some", onPress: () => onRegret(3) },
        { text: "★★★★☆  Quite a bit", onPress: () => onRegret(4) },
        { text: "★★★★★  Major regret", onPress: () => onRegret(5) },
        { text: "Cancel", style: "cancel" },
      ]
    );
  }

  const rightActions =
    transaction.type === "expense"
      ? () => (
          <TouchableOpacity
            style={[styles.regretAction, { backgroundColor: "#B07010" }]}
            onPress={handleRegretAction}
            activeOpacity={0.9}
          >
            <Feather name="star" size={20} color="#fff" />
            <Text style={styles.regretActionText}>Rate</Text>
          </TouchableOpacity>
        )
      : undefined;

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={rightActions}
      overshootRight={false}
      friction={2}
    >
      <TransactionRow
        transaction={transaction}
        onPress={onPress}
        onLongPress={onDelete}
      />
    </Swipeable>
  );
}

export default function TransactionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const params =
    filter === "All"
      ? { limit: 200 }
      : { limit: 200, type: filter.toLowerCase() as "income" | "expense" };

  const { data: transactions, isLoading, refetch, isRefetching } = useListTransactions(params);

  const deleteMutation = useDeleteTransaction({
    mutation: {
      onSuccess: () => void queryClient.invalidateQueries(),
    },
  });

  const regretMutation = useRateTransactionRegret({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries();
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
    },
  });

  const filtered = (transactions ?? []).filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  });

  function handleDelete(txn: Transaction) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete Transaction", `Delete "${txn.description}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMutation.mutate({ id: txn.id }),
      },
    ]);
  }

  function handleRegret(txn: Transaction, score: number) {
    regretMutation.mutate({ id: txn.id, data: { score } });
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
        <Text style={[styles.title, { color: colors.foreground }]}>Transactions</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/add-transaction");
          }}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={20} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.searchContainer,
          { backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.muted, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search transactions..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.filters}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === f ? colors.primary : colors.muted,
                  borderColor: filter === f ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === f ? colors.primaryForeground : colors.mutedForeground },
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <SwipeableRow
            transaction={item}
            onPress={() => router.push(`/transaction/${item.id}`)}
            onDelete={() => handleDelete(item)}
            onRegret={(score) => handleRegret(item, score)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={colors.primary}
          />
        }
        scrollEnabled={!!filtered.length}
        contentContainerStyle={[styles.list, { paddingBottom: bottomInset + 100 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="inbox" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {isLoading ? "Loading..." : "No transactions"}
            </Text>
            {!isLoading && (
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Tap + to add one · Swipe left to rate regret
              </Text>
            )}
          </View>
        }
      />
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
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  filters: { flexDirection: "row", gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  list: { flexGrow: 1 },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  regretAction: {
    width: 72,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  regretActionText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
});
