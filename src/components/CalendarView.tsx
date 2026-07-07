import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useState } from "react";

const TASK_DAYS: Record<number, { color: string; count: number }> = {
  2:  { color: "#F59E0B", count: 2 },
  5:  { color: "#22C55E", count: 1 },
  9:  { color: "#F59E0B", count: 3 },
  12: { color: "#EF4444", count: 1 },
  14: { color: "#F59E0B", count: 2 },
  18: { color: "#22C55E", count: 4 },
  20: { color: "#F59E0B", count: 1 },
  23: { color: "#22C55E", count: 2 },
  25: { color: "#EF4444", count: 1 },
  27: { color: "#F59E0B", count: 3 },
  30: { color: "#22C55E", count: 1 },
};

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABEL = "June 2025";
const START_DAY = 0;
const TOTAL_DAYS = 30;

export default function CalendarView() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const cells: (number | null)[] = [
    ...Array(START_DAY).fill(null),
    ...Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1),
  ];

  while (cells.length % 7 !== 0) cells.push(null);

  const selectedTask = selectedDay ? TASK_DAYS[selectedDay] : null;

  return (
    <View style={styles.container}>
      <Text style={styles.month}>{MONTH_LABEL}</Text>

      <View style={styles.weekRow}>
        {DAYS_OF_WEEK.map((d) => (
          <Text key={d} style={styles.weekLabel}>{d}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, idx) => {
          if (day === null) return <View key={`empty-${idx}`} style={styles.cell} />;
          const task = TASK_DAYS[day];
          const isSelected = selectedDay === day;
          return (
            <TouchableOpacity
              key={day}
              style={[styles.cell, isSelected && styles.cellSelected]}
              onPress={() => setSelectedDay(isSelected ? null : day)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayNum, isSelected && styles.dayNumSelected]}>
                {day}
              </Text>
              {task && (
                <View style={[styles.dot, { backgroundColor: task.color }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedDay && (
        <View style={styles.detail}>
          {selectedTask ? (
            <View style={styles.detailRow}>
              <View style={[styles.detailDot, { backgroundColor: selectedTask.color }]} />
              <Text style={styles.detailText}>
                {selectedTask.count} task{selectedTask.count > 1 ? "s" : ""} scheduled on June {selectedDay}
              </Text>
            </View>
          ) : (
            <Text style={styles.noTask}>No tasks on June {selectedDay}</Text>
          )}
        </View>
      )}

      <View style={styles.legend}>
        {[
          { color: "#F59E0B", label: "Ongoing" },
          { color: "#22C55E", label: "Completed" },
          { color: "#EF4444", label: "Cancelled" },
        ].map(({ color, label }) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text style={styles.legendLabel}>{label}</Text>
          </View>
        ))}
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
  month: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 12,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  weekLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    gap: 2,
  },
  cellSelected: {
    backgroundColor: "#EEF2FF",
  },
  dayNum: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
  dayNumSelected: {
    color: "#4F46E5",
    fontWeight: "700",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  detail: {
    marginTop: 12,
    padding: 10,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  detailText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
  noTask: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendLabel: {
    fontSize: 10,
    color: "#6B7280",
  },
});
