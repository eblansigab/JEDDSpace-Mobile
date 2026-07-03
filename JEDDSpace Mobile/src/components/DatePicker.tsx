import { Picker } from "@react-native-picker/picker";
import { useState } from "react";
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type DateValue = { month: number; day: number; year: number } | null;

const MONTHS = [
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

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 10 }, (_, i) => 2024 + i);

export function DatePickerModal({
  visible,
  onClose,
  onConfirm,
  initial,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (d: DateValue) => void;
  initial: DateValue;
}) {
  const today = new Date();
  const [month, setMonth] = useState(initial?.month ?? today.getMonth());
  const [day, setDay] = useState(initial?.day ?? today.getDate());
  const [year, setYear] = useState(initial?.year ?? today.getFullYear());

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={() => {}}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Date</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pickerRow}>
            {/* Month */}
            <View style={styles.pickerCol}>
              <Text style={styles.pickerColLabel}>Month</Text>
              <View style={styles.pickerBox}>
                <Picker
                  selectedValue={month}
                  onValueChange={(v) => setMonth(Number(v))}
                  mode="dropdown"
                >
                  {MONTHS.map((m, idx) => (
                    <Picker.Item key={m} label={m} value={idx} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Day */}
            <View style={[styles.pickerCol, { flex: 0.6 }]}>
              <Text style={styles.pickerColLabel}>Day</Text>
              <View style={styles.pickerBox}>
                <Picker
                  selectedValue={day}
                  onValueChange={(v) => setDay(Number(v))}
                  mode="dropdown"
                >
                  {DAYS.map((d) => (
                    <Picker.Item key={d} label={String(d)} value={d} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Year */}
            <View style={[styles.pickerCol, { flex: 0.7 }]}>
              <Text style={styles.pickerColLabel}>Year</Text>
              <View style={styles.pickerBox}>
                <Picker
                  selectedValue={year}
                  onValueChange={(v) => setYear(Number(v))}
                  mode="dropdown"
                >
                  {YEARS.map((y) => (
                    <Picker.Item key={y} label={String(y)} value={y} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => onConfirm({ month, day, year })}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmBtnText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function formatDate(d: DateValue): string {
  if (!d) return "";
  return `${MONTHS[d.month]} ${d.day}, ${d.year}`;
}

export function consoleDate(...args: DateValue[]) {
  for (let index = 0; index < args.length; index++) {
    console.log(args[index]);
    console.log(
      new Date(
        new Date(
          new Date(new Date().setFullYear(args[index]?.year!)).setDate(
            args[index]?.day!,
          ),
        ).setMonth(args[index]?.month!),
      )
        .toISOString()
        .split("T")[0],
    );
  }
}

export function formatISODate(date: DateValue) {
  return new Date(
    new Date(
      new Date(new Date().setFullYear(date?.year!)).setDate(date?.day!),
    ).setMonth(date?.month!),
  )
    .toISOString()
    .split("T")[0];
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, paddingHorizontal: 16, paddingVertical: 24, gap: 16 },
  scrollContent: { gap: 8, paddingBottom: 40 },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    color: "#1E0977",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  textArea: { height: 100, textAlignVertical: "top" },
  picker: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 12,
  },

  // Date row
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  dateField: { flex: 1 },
  dateFieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#F9FAFB",
  },
  dateText: { fontSize: 13, color: "#111827", fontWeight: "500", flex: 1 },
  datePlaceholder: { fontSize: 13, color: "#9CA3AF", flex: 1 },
  calIcon: { fontSize: 14 },
  dateSeparator: { paddingTop: 18 },
  dateSeparatorText: { fontSize: 16, color: "#9CA3AF" },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 16,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  modalClose: { fontSize: 16, color: "#9CA3AF", fontWeight: "600" },

  pickerRow: { flexDirection: "row", gap: 8 },
  pickerCol: { flex: 1 },
  pickerColLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: "center",
  },
  pickerBox: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
  },

  modalActions: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  confirmBtn: {
    flex: 1,
    backgroundColor: "#1E0977",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },
});
