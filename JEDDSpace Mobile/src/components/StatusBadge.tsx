import { StyleSheet, Text, View } from "react-native";

type Status = "ongoing" | "cancelled" | "completed";

type Props = {
  status: Status;
};

const STATUS_CONFIG: Record<Status, { color: string; label: string }> = {
  ongoing:   { color: "#F59E0B", label: "Ongoing" },
  cancelled: { color: "#EF4444", label: "Cancelled" },
  completed: { color: "#22C55E", label: "Completed" },
};

export default function StatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status] ?? { color: "#9CA3AF", label: status };

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
});
