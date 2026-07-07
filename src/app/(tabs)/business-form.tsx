import MenuDropdown from "@/components/menuDropdown";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface BusinessFormState {
  project: string;
  startDate: string;
  endDate: string;
  location: string;
  companyCar: boolean;
  carName: string;
  driverName: string;
  phoneNum: string;
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(str: string): boolean {
  if (!DATE_REGEX.test(str)) return false;
  const d = new Date(str);
  return !isNaN(d.getTime());
}

export default function BusinessForm() {
  const [form, setForm] = useState<BusinessFormState>({
    project: "",
    startDate: "",
    endDate: "",
    location: "",
    companyCar: false,
    carName: "",
    driverName: "",
    phoneNum: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
        const { data } = await supabase
          .from("employee")
          .select("employee_id")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (data?.employee_id) setEmployeeId(data.employee_id);
      }
    })();
  }, []);

  const setField = <K extends keyof BusinessFormState>(
    key: K,
    value: BusinessFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): string | null => {
    if (!form.project) return "Enter your project name";
    if (!form.startDate || !isValidDate(form.startDate))
      return "Enter a valid start date (YYYY-MM-DD).";
    if (!form.endDate || !isValidDate(form.endDate))
      return "Enter a valid end date (YYYY-MM-DD).";
    if (new Date(form.startDate) > new Date(form.endDate))
      return "Start date must be before end date.";
    if (!form.location.trim()) return "Please enter a location.";
    if (form.companyCar && !form.carName)
      return "Please enter the company car information.";
    if (form.companyCar && !form.driverName.trim())
      return "Please enter the driver name when using a company car.";
    if (form.companyCar && !form.phoneNum.trim())
      return "Please enter a contact phone number.";
    return null;
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) {
      Alert.alert("Validation Error", error);
      return;
    }

    if (!employeeId || !userId) {
      Alert.alert(
        "Error",
        "Could not identify your employee record. Please log in again.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const { error: insertError } = await supabase
        .from("businessform")
        .insert({
          project_name: form.project.trim(),
          employee_id: employeeId,
          start_date: form.startDate,
          end_date: form.endDate,
          location: form.location.trim(),
          company_car: form.companyCar ? form.carName.trim() : "Personal",
          driver_name: form.companyCar ? form.driverName.trim() : "Personal",
          phone_num: form.companyCar ? form.phoneNum.trim() : "Personal",
        });

      if (insertError) throw insertError;

      Alert.alert("Success", "Official Business form submitted successfully!", [
        {
          text: "OK",
          onPress: () => {
            setForm({
              project: "",
              startDate: "",
              endDate: "",
              location: "",
              companyCar: false,
              carName: "",
              driverName: "",
              phoneNum: "",
            });
          },
        },
      ]);
    } catch (err) {
      console.error("[MobileAI] Business form submit error:", err);
      const message = err instanceof Error ? err.message : String(err);
      Alert.alert("Error", `Failed to submit form: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

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
          <Text style={styles.pageTitle}>Official Business Form</Text>
          <Text style={styles.pageSubtitle}>
            Submit your official business trip details for approval.
          </Text>

          {/* Project */}
          <View style={styles.field}>
            <Text style={styles.label}>Project Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter project name"
              placeholderTextColor="#9CA3AF"
              value={form.project}
              onChangeText={(v) => setField("project", v)}
            />
          </View>

          {/* Start Date */}
          <View style={styles.field}>
            <Text style={styles.label}>Start Date * (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2025-08-01"
              placeholderTextColor="#9CA3AF"
              value={form.startDate}
              onChangeText={(v) => setField("startDate", v)}
              keyboardType="numeric"
            />
          </View>

          {/* End Date */}
          <View style={styles.field}>
            <Text style={styles.label}>End Date * (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2025-08-03"
              placeholderTextColor="#9CA3AF"
              value={form.endDate}
              onChangeText={(v) => setField("endDate", v)}
              keyboardType="numeric"
            />
          </View>

          {/* Location */}
          <View style={styles.field}>
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter destination or location"
              placeholderTextColor="#9CA3AF"
              value={form.location}
              onChangeText={(v) => setField("location", v)}
            />
          </View>

          {/* Company Car toggle */}
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.label}>Company Car</Text>
              <Text style={styles.switchHint}>
                Will a company vehicle be used?
              </Text>
            </View>
            <Switch
              value={form.companyCar}
              onValueChange={(v) => setField("companyCar", v)}
              trackColor={{ false: "#E5E7EB", true: "#1E0977" }}
              thumbColor={form.companyCar ? "#fff" : "#9CA3AF"}
            />
          </View>

          {/* Driver fields — shown only when companyCar is true */}
          {form.companyCar && (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Company Car *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter the company car to use"
                  placeholderTextColor="#9CA3AF"
                  value={form.carName}
                  onChangeText={(v) => setField("carName", v)}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Driver Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter driver's full name"
                  placeholderTextColor="#9CA3AF"
                  value={form.driverName}
                  onChangeText={(v) => setField("driverName", v)}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter contact phone number"
                  placeholderTextColor="#9CA3AF"
                  value={form.phoneNum}
                  onChangeText={(v) => setField("phoneNum", v)}
                  keyboardType="phone-pad"
                />
              </View>
            </>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Official Business</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 24, gap: 12 },
  scrollContent: { gap: 4, paddingBottom: 40 },
  pageTitle: { fontSize: 20, fontWeight: "700", color: "#111827" },
  pageSubtitle: { fontSize: 13, color: "#6B7280", marginBottom: 8 },
  field: { gap: 4, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151" },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fff",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  switchInfo: { gap: 2 },
  switchHint: { fontSize: 12, color: "#9CA3AF" },
  submitBtn: {
    backgroundColor: "#1E0977",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
