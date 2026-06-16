import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import {
  useCreateScenario,
  useDeleteScenario,
  useListScenarios,
} from "@workspace/api-client-react";
import React, { useState } from "react";
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
  useWindowDimensions,
} from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { ProGate } from "@/components/ProGate";
import { useColors } from "@/hooks/useColors";
import type { Scenario } from "@workspace/api-client-react";

function ProjectionChart({ scenario }: { scenario: Scenario }) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const chartWidth = width - 64;
  const chartHeight = 80;
  const padTop = 6;
  const padBottom = 16;

  const data = scenario.monthlyBreakdown ?? [];
  if (data.length < 2) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * chartWidth,
    y: padTop + (1 - d.value / maxValue) * (chartHeight - padTop - padBottom),
  }));

  const linePath = pts.reduce((acc, pt, i) => {
    if (i === 0) return `M${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    const prev = pts[i - 1];
    const cpx = ((prev.x + pt.x) / 2).toFixed(1);
    return `${acc} C${cpx},${prev.y.toFixed(1)} ${cpx},${pt.y.toFixed(1)} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
  }, "");

  const fillPath = `${linePath} L${chartWidth},${chartHeight} L0,${chartHeight} Z`;

  const yearLabels: { x: number; label: string }[] = [];
  const months = data.length;
  const years = Math.floor(months / 12);
  for (let y = 1; y <= years && y <= 5; y++) {
    const idx = y * 12 - 1;
    if (idx < data.length) {
      yearLabels.push({
        x: (idx / (data.length - 1)) * chartWidth,
        label: `Y${y}`,
      });
    }
  }

  return (
    <Svg width={chartWidth} height={chartHeight}>
      <Defs>
        <LinearGradient id={`grad_${scenario.id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.income} stopOpacity="0.3" />
          <Stop offset="1" stopColor={colors.income} stopOpacity="0.02" />
        </LinearGradient>
      </Defs>
      <Path d={fillPath} fill={`url(#grad_${scenario.id})`} />
      <Path
        d={linePath}
        stroke={colors.income}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      {yearLabels.map((yl) => (
        <SvgText
          key={yl.label}
          x={yl.x}
          y={chartHeight - 2}
          fontSize={9}
          fill={colors.mutedForeground}
          textAnchor="middle"
          fontFamily="Inter_400Regular"
        >
          {yl.label}
        </SvgText>
      ))}
    </Svg>
  );
}

function ScenarioCard({
  scenario,
  onDelete,
}: {
  scenario: Scenario;
  onDelete: () => void;
}) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.scenarioCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity
        style={styles.scenarioHeader}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.8}
      >
        <View style={styles.scenarioHeaderLeft}>
          <Text style={[styles.scenarioName, { color: colors.foreground }]}>
            {scenario.name}
          </Text>
          <Text style={[styles.scenarioDesc, { color: colors.mutedForeground }]} numberOfLines={1}>
            {scenario.changeDescription}
          </Text>
        </View>
        <View style={styles.scenarioHeaderRight}>
          <Text style={[styles.scenarioSavings, { color: colors.income }]}>
            ${(scenario.projectedSavings / 1000).toFixed(0)}k
          </Text>
          <Text style={[styles.scenarioYears, { color: colors.mutedForeground }]}>
            in {scenario.projectionYears}yr
          </Text>
        </View>
        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.mutedForeground}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.expandedContent, { borderTopColor: colors.border }]}>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.income }]}>
                +${scenario.monthlySavingsDelta.toFixed(0)}/mo
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                monthly savings
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {((scenario.annualReturnRate ?? 0.07) * 100).toFixed(0)}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                annual return
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                ${(scenario.projectedSavings / 1000).toFixed(1)}k
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                projected total
              </Text>
            </View>
          </View>

          <ProjectionChart scenario={scenario} />

          <TouchableOpacity
            style={[styles.deleteBtn, { borderColor: colors.border }]}
            onPress={onDelete}
          >
            <Feather name="trash-2" size={14} color={colors.destructive} />
            <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>
              Delete scenario
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function WhatIfScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const { data: scenarios, isLoading } = useListScenarios();
  const createMutation = useCreateScenario({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries();
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowForm(false);
        resetForm();
      },
    },
  });
  const deleteMutation = useDeleteScenario({
    mutation: {
      onSuccess: () => void queryClient.invalidateQueries(),
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [changeDesc, setChangeDesc] = useState("");
  const [savingsDelta, setSavingsDelta] = useState("");
  const [years, setYears] = useState("10");
  const [returnRate, setReturnRate] = useState("7");

  function resetForm() {
    setName("");
    setChangeDesc("");
    setSavingsDelta("");
    setYears("10");
    setReturnRate("7");
  }

  function handleCreate() {
    const delta = parseFloat(savingsDelta);
    const yrs = parseInt(years, 10);
    const rate = parseFloat(returnRate) / 100;
    if (!name.trim() || isNaN(delta) || isNaN(yrs)) {
      Alert.alert("Missing fields", "Please fill in all required fields");
      return;
    }
    createMutation.mutate({
      data: {
        name: name.trim(),
        changeDescription: changeDesc.trim() || name.trim(),
        monthlySavingsDelta: delta,
        projectionYears: Math.min(Math.max(yrs, 1), 40),
        annualReturnRate: isNaN(rate) ? 0.07 : rate,
      },
    });
  }

  function handleDelete(id: number, name: string) {
    Alert.alert("Delete Scenario", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMutation.mutate({ id }),
      },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topInset + 12,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="chevron-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>What-If Simulator</Text>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => {
            setShowForm((v) => !v);
            resetForm();
          }}
        >
          <Feather name={showForm ? "x" : "plus"} size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ProGate
        title="What-If Simulator"
        description="Simulate financial scenarios and project how much you could save over the next 1-40 years."
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scroll,
              { paddingBottom: bottomInset + 40 },
            ]}
          >
            {showForm && (
              <View
                style={[
                  styles.form,
                  { backgroundColor: colors.card, borderColor: colors.primary },
                ]}
              >
                <Text style={[styles.formTitle, { color: colors.foreground }]}>
                  New Scenario
                </Text>

                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                    Name *
                  </Text>
                  <TextInput
                    style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
                    value={name}
                    onChangeText={setName}
                    placeholder='e.g. "Cut coffee habit"'
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                    What changes?
                  </Text>
                  <TextInput
                    style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
                    value={changeDesc}
                    onChangeText={setChangeDesc}
                    placeholder='e.g. "Skip $5 coffee every weekday"'
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>

                <View style={styles.twoCol}>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                      Extra savings/mo
                    </Text>
                    <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                      <Text style={[styles.prefix, { color: colors.mutedForeground }]}>$</Text>
                      <TextInput
                        style={[styles.inputInner, { color: colors.foreground }]}
                        value={savingsDelta}
                        onChangeText={setSavingsDelta}
                        keyboardType="decimal-pad"
                        placeholder="100"
                        placeholderTextColor={colors.mutedForeground}
                      />
                    </View>
                  </View>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                      Years
                    </Text>
                    <TextInput
                      style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
                      value={years}
                      onChangeText={setYears}
                      keyboardType="number-pad"
                      placeholder="10"
                      placeholderTextColor={colors.mutedForeground}
                    />
                  </View>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                      Return %
                    </Text>
                    <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                      <TextInput
                        style={[styles.inputInner, { color: colors.foreground }]}
                        value={returnRate}
                        onChangeText={setReturnRate}
                        keyboardType="decimal-pad"
                        placeholder="7"
                        placeholderTextColor={colors.mutedForeground}
                      />
                      <Text style={[styles.prefix, { color: colors.mutedForeground }]}>%</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.createBtn,
                    {
                      backgroundColor: createMutation.isPending ? colors.muted : colors.primary,
                    },
                  ]}
                  onPress={handleCreate}
                  disabled={createMutation.isPending}
                  activeOpacity={0.8}
                >
                  {createMutation.isPending ? (
                    <ActivityIndicator color={colors.mutedForeground} size="small" />
                  ) : (
                    <Text style={[styles.createBtnText, { color: colors.primaryForeground }]}>
                      Simulate
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {isLoading ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : (scenarios?.length ?? 0) === 0 ? (
              <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="trending-up" size={32} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  No scenarios yet
                </Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Tap + to simulate a financial change and see your projected savings
                </Text>
              </View>
            ) : (
              scenarios!.map((s) => (
                <ScenarioCard
                  key={s.id}
                  scenario={s}
                  onDelete={() => handleDelete(s.id, s.name)}
                />
              ))
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </ProGate>
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
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  form: { borderRadius: 14, borderWidth: 1.5, padding: 16, gap: 14 },
  formTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  field: { gap: 6 },
  fieldLabel: { fontSize: 11, fontFamily: "Inter_500Medium", letterSpacing: 0.5 },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  twoCol: { flexDirection: "row", gap: 10 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 4,
  },
  prefix: { fontSize: 14, fontFamily: "Inter_400Regular" },
  inputInner: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  createBtn: {
    borderRadius: 100,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  createBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  loader: { marginTop: 40 },
  empty: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 40,
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  scenarioCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  scenarioHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  scenarioHeaderLeft: { flex: 1, gap: 3 },
  scenarioName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  scenarioDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  scenarioHeaderRight: { alignItems: "flex-end", gap: 2 },
  scenarioSavings: { fontSize: 18, fontFamily: "Inter_700Bold" },
  scenarioYears: { fontSize: 11, fontFamily: "Inter_400Regular" },
  expandedContent: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 16,
  },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  stat: { gap: 3 },
  statValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 8,
  },
  deleteBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
