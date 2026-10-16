import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";

export const REACTION_OPTIONS = ["👍", "❤️", "😂", "🎉", "😮", "😢"] as const;

export type ReactionKey = typeof REACTION_OPTIONS[number];

export type ReactionState = Partial<Record<ReactionKey, boolean>>;

export type ReactionCounts = Partial<Record<ReactionKey, number>>;

export type ReactionResult = {
  mine: ReactionState;
  counts: ReactionCounts;
};

type ReactionBarProps = {
  reactions: ReactionState;
  counts?: ReactionCounts;
  onToggle: (reaction: ReactionKey) => Promise<ReactionResult> | void;
  loadingReaction?: ReactionKey | null;
};

export default function ReactionBar({ reactions, counts = {}, onToggle, loadingReaction = null }: ReactionBarProps) {
  return (
    <View style={styles.row}>
      {REACTION_OPTIONS.map((reaction) => {
        const active = Boolean(reactions[reaction]);
        const count = counts[reaction];
        const isThisLoading = loadingReaction === reaction;
        return (
          <TouchableOpacity
            key={reaction}
            onPress={() => onToggle(reaction)}
            activeOpacity={0.7}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            disabled={isThisLoading}
          >
            <View style={[styles.chip, active && styles.chipActive, isThisLoading && styles.chipDisabled]}>
              <Text style={styles.emoji}>{reaction}</Text>
              {typeof count === "number" && count > 0 && <Text style={styles.count}>{count}</Text>}
              {isThisLoading && <ActivityIndicator size="small" color="#1E0977" style={styles.loader} />}
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
    backgroundColor: "#fff",
  },
  chipActive: { backgroundColor: "#EEF2FF", borderColor: "#1E0977" },
  chipDisabled: { opacity: 0.7 },
  emoji: { fontSize: 14 },
  count: { fontSize: 12, fontWeight: "700", color: "#1E0977" },
  loader: { marginLeft: 4 },
});
