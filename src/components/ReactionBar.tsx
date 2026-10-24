import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { useTheme } from "@/context/ThemeContext";

export type ReactionOption = {
  key: string;
  emoji: string;
  label: string;
};

export const REACTION_OPTIONS: ReactionOption[] = [
  { key: "👍", emoji: "👍", label: "Thumbs up" },
  { key: "❤️", emoji: "❤️", label: "Heart" },
  { key: "😂", emoji: "😂", label: "Laugh" },
  { key: "🎉", emoji: "🎉", label: "Celebrate" },
  { key: "😮", emoji: "😮", label: "Surprised" },
  { key: "😢", emoji: "😢", label: "Sad" },
];

export type ReactionKey = string;

export type ReactionState = Partial<Record<ReactionKey, boolean>>;

export type ReactionCounts = Partial<Record<ReactionKey, number>>;

export type ReactionResult = {
  mine: ReactionState;
  counts: ReactionCounts;
};

type ReactionBarProps = {
  options: ReactionOption[];
  reactions: ReactionState;
  counts?: ReactionCounts;
  onToggle: (reaction: ReactionKey) => Promise<ReactionResult> | void;
  loadingReaction?: string | null;
};

export default function ReactionBar({ options, reactions, counts = {}, onToggle, loadingReaction = null }: ReactionBarProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const active = Boolean(reactions[option.key]);
        const count = counts[option.key];
        const isThisLoading = loadingReaction === option.key;
        return (
          <TouchableOpacity
            key={option.key}
            onPress={() => onToggle(option.key)}
            activeOpacity={0.7}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            disabled={isThisLoading}
            accessibilityLabel={option.label}
          >
            <View style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }, active && { backgroundColor: colors.primaryLight, borderColor: colors.primary }, isThisLoading && styles.chipDisabled]}>
              <Text style={styles.emoji}>{option.emoji}</Text>
              {typeof count === "number" && count > 0 && <Text style={[styles.count, { color: colors.primary }]}>{count}</Text>}
              {isThisLoading && <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
  },
  chipDisabled: { opacity: 0.7 },
  emoji: { fontSize: 14 },
  count: { fontSize: 12, fontWeight: "700" },
  loader: { marginLeft: 4 },
});
