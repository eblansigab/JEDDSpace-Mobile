import { useTheme } from "@/context/ThemeContext";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type DatePickerProps = {
  visible: boolean;
  value?: string;
  minDate?: string;
  maxDate?: string;
  onClose: () => void;
  onConfirm: (date: string) => void;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function DatePicker({ visible, value, minDate, maxDate, onClose, onConfirm }: DatePickerProps) {
  const { colors } = useTheme();
  const today = useMemo(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  }, []);

  const initial = useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-").map(Number);
      return { year: y, month: m - 1, day: d };
    }
    return { year: today.year, month: today.month, day: today.day };
  }, [value, today]);

  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [day, setDay] = useState(initial.day);
  const initialRef = useRef(initial);

  useEffect(() => {
    if (!visible) return;
    const next = initialRef.current;
    setYear(next.year);
    setMonth(next.month);
    setDay(next.day);
  }, [visible]);

  const min = useMemo(() => {
    if (!minDate) return null;
    const [y, m, d] = minDate.split("-").map(Number);
    return { year: y, month: m - 1, day: d };
  }, [minDate]);

  const max = useMemo(() => {
    if (!maxDate) return null;
    const [y, m, d] = maxDate.split("-").map(Number);
    return { year: y, month: m - 1, day: d };
  }, [maxDate]);

  const years = useMemo(() => {
    const start = min ? min.year : today.year - 20;
    const end = max ? max.year : today.year + 20;
    const arr: number[] = [];
    for (let y = start; y <= end; y++) arr.push(y);
    return arr;
  }, [min, max, today]);

  const days = useMemo(() => {
    let maxDay = getDaysInMonth(year, month);
    let minDay = 1;
    if (min && year === min.year && month === min.month) minDay = min.day;
    if (max && year === max.year && month === max.month) maxDay = max.day;

    const arr: number[] = [];
    for (let d = minDay; d <= maxDay; d++) arr.push(d);
    return arr;
  }, [year, month, min, max]);

  const currentIndex = useMemo(() => {
    let yIdx = years.indexOf(year);
    let mIdx = month;
    let dIdx = days.indexOf(day);
    if (mIdx < 0) mIdx = 0;
    if (dIdx < 0) dIdx = 0;
    return { yIdx, mIdx, dIdx };
  }, [year, month, day, years, days]);

  const clampDay = (y: number, m: number, d: number) => {
    const maxDay = getDaysInMonth(y, m);
    if (d > maxDay) return maxDay;
    return d;
  };

  const handleConfirm = () => {
    const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
    onConfirm(dateStr);
    onClose();
  };

  const PickerItem = ({ label, selected }: { label: string; selected: boolean }) => (
    <Text style={[styles.pickerItem, selected && [styles.pickerItemSelected, { color: colors.primary }]]}>{label}</Text>
  );

  const Column = ({
    data,
    selected,
    onSelect,
  }: {
    data: number[];
    selected: number;
    onSelect: (v: number) => void;
  }) => {
    const selectedIndex = data.indexOf(selected);

    return (
      <ScrollView
        style={styles.column}
        showsVerticalScrollIndicator={false}
        snapToInterval={36}
        decelerationRate="fast"
        contentContainerStyle={styles.columnContent}
      >
        {/* spacer */}
        <View style={{ height: 72 }} />
        {data.map((item) => {
          const isSelected = item === selected;
          return (
            <TouchableOpacity
              key={item}
              style={styles.columnItem}
              onPress={() => onSelect(item)}
              activeOpacity={0.7}
            >
              <PickerItem label={String(item)} selected={isSelected} />
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 72 }} />
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Select Date</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirm} hitSlop={12}>
                <Text style={[styles.confirmText, { color: colors.primary }]}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.body}>
            <View style={styles.columnsRow}>
              <View style={styles.columnWrap}>
                <Text style={[styles.columnHeader, { color: colors.textMuted }]}>Year</Text>
              </View>
              <View style={styles.columnWrap}>
                <Text style={[styles.columnHeader, { color: colors.textMuted }]}>Month</Text>
              </View>
              <View style={styles.columnWrap}>
                <Text style={[styles.columnHeader, { color: colors.textMuted }]}>Day</Text>
              </View>
            </View>

            <View style={styles.columnsRow}>
              <View style={styles.columnWrap}>
                <ScrollView
                  style={styles.column}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={36}
                  decelerationRate="fast"
                  contentContainerStyle={styles.columnContent}
                >
                  <View style={{ height: 72 }} />
                  {years.map((y) => {
                    const isSelected = y === year;
                    return (
                      <TouchableOpacity
                        key={y}
                        style={styles.columnItem}
                        onPress={() => {
                          setYear(y);
                          setDay((prev) => clampDay(y, month, prev));
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}>
                          {y}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <View style={{ height: 72 }} />
                </ScrollView>
              </View>

              <View style={styles.columnWrap}>
                <ScrollView
                  style={styles.column}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={36}
                  decelerationRate="fast"
                  contentContainerStyle={styles.columnContent}
                >
                  <View style={{ height: 72 }} />
                  {MONTHS.map((m, idx) => {
                    const isSelected = idx === month;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={styles.columnItem}
                        onPress={() => {
                          setMonth(idx);
                          setDay((prev) => clampDay(year, idx, prev));
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}>
                          {m}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <View style={{ height: 72 }} />
                </ScrollView>
              </View>

              <View style={styles.columnWrap}>
                <ScrollView
                  style={styles.column}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={36}
                  decelerationRate="fast"
                  contentContainerStyle={styles.columnContent}
                >
                  <View style={{ height: 72 }} />
                  {days.map((d) => {
                    const isSelected = d === day;
                    return (
                      <TouchableOpacity
                        key={d}
                        style={styles.columnItem}
                        onPress={() => setDay(d)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}>
                          {d}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <View style={{ height: 72 }} />
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  cancelText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  confirmText: {
    fontSize: 14,
    color: "#1E0977",
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
  },
  body: {
    paddingTop: 8,
  },
  columnsRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    gap: 8,
  },
  columnWrap: {
    flex: 1,
    alignItems: "center",
  },
  columnHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
    paddingTop: 8,
  },
  column: {
    flex: 1,
    maxHeight: 252,
  },
  columnContent: {
    gap: 0,
  },
  columnItem: {
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerItem: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  pickerItemSelected: {
    fontSize: 18,
    color: "#1E0977",
    fontWeight: "700",
  },
});
