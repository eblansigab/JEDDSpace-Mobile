import {
  DatePickerModal,
  formatDate,
  formatISODate,
} from "@/components/DatePicker";
import MenuDropdown from "@/components/menuDropdown";
import { submitBusinessForm } from "@/components/submitBusinessForm";
import { useState } from "react";
import {
  Button,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type DateValue = { month: number; day: number; year: number } | null;

export default function BusinessForm() {
  const [projectName, setProjectName] = useState("");
  const [location, setLocation] = useState("");
  const [companyCar, setCompanyCar] = useState("");
  const [driver, setDriver] = useState("");
  const [contactNo, setContactNo] = useState("");

  const [startDate, setStartDate] = useState<DateValue>(null);
  const [endDate, setEndDate] = useState<DateValue>(null);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  async function submitForm() {
    const isConfirmed = await submitBusinessForm(
      projectName,
      formatISODate(startDate),
      formatISODate(endDate),
      location,
      companyCar,
      driver,
      contactNo,
    );
    if (isConfirmed) {
      alert("Form successfully submitted");
      setStartDate(null);
      setEndDate(null);
      setLocation("");
      setCompanyCar("");
      setDriver("");
      setContactNo("");
    } else {
      alert(
        "Form not submitted. Please recheck details if it's not a database issue.",
      );
    }
  }
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <MenuDropdown />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View>
            <Text style={styles.label}>Project Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter project name"
              value={projectName}
              onChangeText={setProjectName}
              returnKeyType="next"
            />
          </View>

          <View>
            <Text style={styles.label}>Duration</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.dateFieldLabel}>Start Date</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowStart(true)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={startDate ? styles.dateText : styles.datePlaceholder}
                  >
                    {startDate ? formatDate(startDate) : "Select date"}
                  </Text>
                  <Text style={styles.calIcon}>📅</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dateSeparator}>
                <Text style={styles.dateSeparatorText}>→</Text>
              </View>

              <View style={styles.dateField}>
                <Text style={styles.dateFieldLabel}>End Date</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowEnd(true)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={endDate ? styles.dateText : styles.datePlaceholder}
                  >
                    {endDate ? formatDate(endDate) : "Select date"}
                  </Text>
                  <Text style={styles.calIcon}>📅</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter location"
              value={location}
              onChangeText={setLocation}
              returnKeyType="next"
            />
          </View>

          <View>
            <Text style={styles.label}>Company Car</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter car details"
              value={companyCar}
              onChangeText={setCompanyCar}
              returnKeyType="next"
            />
          </View>

          <View>
            <Text style={styles.label}>Driver</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter driver name"
              value={driver}
              onChangeText={setDriver}
              returnKeyType="next"
            />
          </View>

          <View>
            <Text style={styles.label}>Contact No.</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter contact number"
              value={contactNo}
              onChangeText={setContactNo}
              keyboardType="phone-pad"
              returnKeyType="done"
            />
          </View>

          <Button title="Submit" onPress={submitForm} />
        </ScrollView>
      </View>

      <DatePickerModal
        visible={showStart}
        onClose={() => setShowStart(false)}
        onConfirm={(d) => {
          setStartDate(d);
          setShowStart(false);
        }}
        initial={startDate}
      />
      <DatePickerModal
        visible={showEnd}
        onClose={() => setShowEnd(false)}
        onConfirm={(d) => {
          setEndDate(d);
          setShowEnd(false);
        }}
        initial={endDate}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 16,
  },
  scrollContent: {
    gap: 8,
    paddingBottom: 40,
  },
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
