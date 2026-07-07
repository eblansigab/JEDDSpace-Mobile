import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type CalendarEvent = {
  title: string;
  start: string;
  end?: string;
  color?: string;
};

interface CalendarViewProps {
  events?: CalendarEvent[];
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function CalendarView({ events = [] }: CalendarViewProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // How many days in the current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // What day of week the month starts on
  const startDay = new Date(currentYear, currentMonth, 1).getDay();

  // Build grid cells
  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  // Map events to days in the current month
  function getEventsForDay(day: number): CalendarEvent[] {
    return events.filter((event) => {
      if (!event.start) return false;
      const eventDate = new Date(event.start);
      return (
        eventDate.getFullYear() === currentYear &&
        eventDate.getMonth() === currentMonth &&
        eventDate.getDate() === day
      );
    });
  }

  // Get first event color for dot indicator
  function getDotColorForDay(day: number): string | null {
    const dayEvents = getEventsForDay(day);
    if (dayEvents.length === 0) return null;
    return dayEvents[0].color ?? "#1E0977";
  }

  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  function prevMonth() {
    setSelectedDay(null);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    setSelectedDay(null);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear();

  return (
    <View style={styles.container}>
      {/* Month navigation */}
      <View style={styles.navRow}>
        <TouchableOpacity
          onPress={prevMonth}
          style={styles.navBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.month}>
          {MONTH_NAMES[currentMonth]} {currentYear}
        </Text>
        <TouchableOpacity
          onPress={nextMonth}
          style={styles.navBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={styles.weekRow}>
        {DAYS_OF_WEEK.map((d) => (
          <Text key={d} style={styles.weekLabel}>
            {d}
          </Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {cells.map((day, idx) => {
          if (day === null)
            return <View key={`empty-${idx}`} style={styles.cell} />;
          const dotColor = getDotColorForDay(day);
          const isSelected = selectedDay === day;
          const todayCell = isToday(day);
          return (
            <TouchableOpacity
              key={day}
              style={[
                styles.cell,
                isSelected && styles.cellSelected,
                todayCell && styles.cellToday,
              ]}
              onPress={() => setSelectedDay(isSelected ? null : day)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayNum,
                  isSelected && styles.dayNumSelected,
                  todayCell && styles.dayNumToday,
                ]}
              >
                {day}
              </Text>
              {dotColor && (
                <View style={[styles.dot, { backgroundColor: dotColor }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected day events */}
      {selectedDay && (
        <View style={styles.detail}>
          {selectedEvents.length > 0 ? (
            <ScrollView style={{ maxHeight: 100 }}>
              {selectedEvents.map((event, idx) => (
                <View key={idx} style={styles.detailRow}>
                  <View
                    style={[
                      styles.detailDot,
                      { backgroundColor: event.color ?? "#1E0977" },
                    ]}
                  />
                  <Text style={styles.detailText} numberOfLines={1}>
                    {event.title}
                  </Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.noTask}>
              No events on {MONTH_NAMES[currentMonth]} {selectedDay}
            </Text>
          )}
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        {[
          { color: "#D97706", label: "Announcement" },
          { color: "#059669", label: "Leave" },
          { color: "#0891B2", label: "Business" },
          { color: "#1E0977", label: "Job" },
          { color: "#7C3AED", label: "Contract" },
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
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  navBtn: {
    padding: 4,
    width: 32,
    alignItems: "center",
  },
  navArrow: {
    fontSize: 22,
    color: "#1E0977",
    fontWeight: "700",
  },
  month: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
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
  cellToday: {
    borderWidth: 1.5,
    borderColor: "#1E0977",
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
  dayNumToday: {
    color: "#1E0977",
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
    marginBottom: 4,
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
    flex: 1,
  },
  noTask: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
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
