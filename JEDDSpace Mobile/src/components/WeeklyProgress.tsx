import { StyleSheet, Text, View } from "react-native";

type TaskProgress = {
  day: string;
  completed: number;
  total: number;
};

const WEEKLY_DATA: TaskProgress[] = [
  { day: "Mon", completed: 3, total: 4 },
  { day: "Tue", completed: 2, total: 3 },
  { day: "Wed", completed: 4, total: 4 },
  { day: "Thu", completed: 1, total: 5 },
  { day: "Fri", completed: 3, total: 3 },
  { day: "Sat", completed: 0, total: 2 },
  { day: "Sun", completed: 0, total: 0 },
];

export default function WeeklyProgress() {
  const totalCompleted = WEEKLY_DATA.reduce((sum, d) => sum + d.completed, 0);
  const totalTasks = WEEKLY_DATA.reduce((sum, d) => sum + d.total, 0);

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Weekly Progress</Text>
        <Text style={styles.summary}>
          {totalCompleted}/{totalTasks} tasks
        </Text>
      </View>

      <View style={styles.bars}>
        {WEEKLY_DATA.map(({ day, completed, total }) => {
          const ratio = total > 0 ? completed / total : 0;
          return (
            <View key={day} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${Math.round(ratio * 100)}%`,
                      backgroundColor: ratio === 1 ? "#22C55E" : ratio > 0 ? "#F59E0B" : "#E5E7EB",
                    },
                  ]}
                />
              </View>
              <Text style={styles.dayLabel}>{day}</Text>
              <Text style={styles.countLabel}>
                {total > 0 ? `${completed}/${total}` : "—"}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  summary: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  bars: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 100,
  },
  barCol: {
    alignItems: "center",
    flex: 1,
    gap: 4,
  },
  barTrack: {
    width: 20,
    height: 70,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 10,
  },
  dayLabel: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "500",
  },
  countLabel: {
    fontSize: 9,
    color: "#9CA3AF",
  },
});
