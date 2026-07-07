import { useTheme } from "@/context/ThemeContext";
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
  const { colors } = useTheme();
  const totalCompleted = WEEKLY_DATA.reduce((sum, d) => sum + d.completed, 0);
  const totalTasks = WEEKLY_DATA.reduce((sum, d) => sum + d.total, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: colors.text }]}>Weekly Progress</Text>
        <Text style={[styles.summary, { color: colors.textSecondary }]}>
          {totalCompleted}/{totalTasks} tasks
        </Text>
      </View>

      <View style={styles.bars}>
        {WEEKLY_DATA.map(({ day, completed, total }) => {
          const ratio = total > 0 ? completed / total : 0;
          return (
            <View key={day} style={styles.barCol}>
              <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${Math.round(ratio * 100)}%`,
                      backgroundColor: ratio === 1 ? colors.success : ratio > 0 ? colors.warning : colors.border,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>{day}</Text>
              <Text style={[styles.countLabel, { color: colors.textMuted }]}>
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
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
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
  },
  summary: {
    fontSize: 12,
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
    fontWeight: "500",
  },
  countLabel: {
    fontSize: 9,
  },
});
