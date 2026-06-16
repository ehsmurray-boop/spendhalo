import React, { useMemo } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";

import { useColors } from "@/hooks/useColors";
import type { Transaction } from "@workspace/api-client-react";

interface Props {
  transactions: Transaction[];
  days?: number;
  height?: number;
}

export function SpendingChart({ transactions, days = 30, height = 110 }: Props) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const chartWidth = width - 32;
  const chartHeight = height;
  const padTop = 8;
  const padBottom = 8;

  const data = useMemo(() => {
    const today = new Date();
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (days - 1 - i));
      const dateStr = d.toISOString().split("T")[0];
      const amount = transactions
        .filter((t) => t.type === "expense" && t.date.startsWith(dateStr))
        .reduce((sum, t) => sum + t.amount, 0);
      return { dateStr, amount };
    });
  }, [transactions, days]);

  const maxValue = Math.max(...data.map((d) => d.amount), 1);

  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * chartWidth,
    y: padTop + (1 - d.amount / maxValue) * (chartHeight - padTop - padBottom),
  }));

  const linePath = pts.reduce((acc, pt, i) => {
    if (i === 0) return `M${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    const prev = pts[i - 1];
    const cpx = ((prev.x + pt.x) / 2).toFixed(1);
    return `${acc} C${cpx},${prev.y.toFixed(1)} ${cpx},${pt.y.toFixed(1)} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
  }, "");

  const fillPath = `${linePath} L${chartWidth},${chartHeight} L0,${chartHeight} Z`;

  const labelIndices = [0, Math.floor(days / 2), days - 1];

  return (
    <View>
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.primary} stopOpacity="0.28" />
            <Stop offset="1" stopColor={colors.primary} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>
        <Path d={fillPath} fill="url(#spendGrad)" />
        <Path
          d={linePath}
          stroke={colors.primary}
          strokeWidth={2}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.xAxis}>
        {labelIndices.map((idx) => (
          <Text key={idx} style={[styles.xLabel, { color: colors.mutedForeground }]}>
            {new Date(data[idx].dateStr + "T00:00:00").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  xAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    marginTop: 4,
  },
  xLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
});
