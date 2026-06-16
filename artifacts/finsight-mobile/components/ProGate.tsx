import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { usePro } from "@/context/ProContext";

interface Props {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function ProGate({ title, description, children }: Props) {
  const { isPro } = usePro();
  const colors = useColors();
  const router = useRouter();

  if (isPro) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.container, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <View style={[styles.badge, { backgroundColor: colors.accent }]}>
        <Text style={[styles.badgeText, { color: colors.primary }]}>PRO</Text>
      </View>
      <Feather name="lock" size={28} color={colors.mutedForeground} style={styles.icon} />
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>{description}</Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/upgrade")}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
          Upgrade to Pro
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  badge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  icon: {
    marginBottom: 4,
    marginTop: 8,
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  button: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 100,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
