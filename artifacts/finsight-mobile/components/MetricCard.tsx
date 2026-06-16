import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  label: string;
  value: string;
  subtitle?: string;
  valueColor?: string;
  accent?: boolean;
}

export function MetricCard({ label, value, subtitle, valueColor, accent }: Props) {
  const colors = useColors();
  const bg = accent ? colors.primary : colors.card;
  const labelClr = accent ? colors.primaryForeground : colors.mutedForeground;
  const valueClr = valueColor ?? (accent ? colors.primaryForeground : colors.foreground);
  const subClr = accent ? `${colors.primaryForeground}99` : colors.mutedForeground;

  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: labelClr }]}>{label}</Text>
      <Text style={[styles.value, { color: valueClr }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: subClr }]} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
    minWidth: 0,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
