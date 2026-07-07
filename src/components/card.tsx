import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { useTheme } from "@/context/ThemeContext";

export default function Card({ children, style, ...props }: ViewProps & { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]} {...props}>
      <View style={styles.cardContent}>
        { children }
      </View>
    </View>
  )
}

const styles = StyleSheet.create ({
    card: {
        borderWidth: 1,
        borderRadius: 8,
    },
    cardContent: {
        margin: 16,
    }
});
