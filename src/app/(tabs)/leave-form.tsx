import { useTheme } from "@/context/ThemeContext";
import MenuDropdown from "@/components/menuDropdown";
import { supabase } from "@/lib/supabase";
import { Picker } from "@react-native-picker/picker";
import * as DocumentPicker from "expo-document-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type LeaveType = "VL" | "SL" | "EL" | "OB" | "";

interface LeaveFormState {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  // Sick Leave specific
  dateBecameSick: string;
  dateReturnedToWork: string;
  medicalCertificate: { uri: string; name: string; type: string; size: number } | null;
}

const LEAVE_TYPES = [
  { label: "Select leave type…", value: "" },
  { label: "Vacation Leave (VL)", value: "VL" },
  { label: "Sick Leave (SL)", value: "SL" },
  { label: "Emergency Leave (EL)", value: "EL" },
  { label: "Official Business (OB)", value: "OB" },
];

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(str: string): boolean {
  if (!DATE_REGEX.test(str)) return false;
  const d = new Date(str);
  return !isNaN(d.getTime());
}

export default function LeaveForm() {
  const { colors } = useTheme();
  const [form, setForm] = useState<LeaveFormState>({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
    dateBecameSick: "",
    dateReturnedToWork: "",
    medicalCertificate: null,
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

  const setField = <K extends keyof LeaveFormState>(key: K, value: LeaveFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setField("medicalCertificate", {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType ?? "application/octet-stream",
          size: asset.size ?? 0,
        });
      }
    } catch (err) {
      console.error("[MobileAI] Document picker error:", err);
      Alert.alert("Error", "Could not open document picker.");
    }
  };

  const validate = (): string | null => {
    if (!form.leaveType) return "Please select a leave type.";
    if (!form.startDate || !isValidDate(form.startDate)) return "Enter a valid start date (YYYY-MM-DD).";
    if (!form.endDate || !isValidDate(form.endDate)) return "Enter a valid end date (YYYY-MM-DD).";
    if (new Date(form.startDate) > new Date(form.endDate)) return "Start date must be before end date.";
    if (!form.reason.trim()) return "Please enter a reason for your leave.";
    if (form.leaveType === "SL") {
      if (!form.dateBecameSick || !isValidDate(form.dateBecameSick)) return "Enter a valid date you became sick (YYYY-MM-DD).";
      if (!form.dateReturnedToWork || !isValidDate(form.dateReturnedToWork)) return "Enter a valid date you returned to work (YYYY-MM-DD).";
    }
    return null;
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) {
      Alert.alert("Validation Error", error);
      return;
    }

    if (!employeeId || !userId) {
      Alert.alert("Error", "Could not identify your employee record. Please log in again.");
      return;
    }

    setSubmitting(true);
    try {
      let medCertUrl: string | null = null;

      if (form.leaveType === "SL" && form.medicalCertificate) {
        const file = form.medicalCertificate;
        const fileName = `${Date.now()}-${file.name}`;
        const resp = await fetch(file.uri);
        const fileBody = await resp.arrayBuffer();
        const { error: uploadError } = await supabase.storage
          .from("document")
          .upload(fileName, fileBody, { contentType: file.type });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("document").getPublicUrl(fileName);
        medCertUrl = urlData.publicUrl;
      }

      const insertPayload: Record<string, unknown> = {
        employee_id: employeeId,
        type: form.leaveType,
        start_date: form.startDate,
        end_date: form.endDate,
        reason: form.reason.trim(),
        status: "pending",
        created_by: userId,
      };

      if (form.leaveType === "SL") {
        insertPayload.date_became_sick = form.dateBecameSick;
        insertPayload.date_returned_to_work = form.dateReturnedToWork;
        if (medCertUrl) insertPayload.medical_certificate_url = medCertUrl;
      }

      const { error: insertError } = await supabase.from("leaveform").insert(insertPayload);
      if (insertError) throw insertError;

      Alert.alert("Success", "Leave form submitted successfully!", [
        {
          text: "OK",
          onPress: () => {
            setForm({
              leaveType: "",
              startDate: "",
              endDate: "",
              reason: "",
              dateBecameSick: "",
              dateReturnedToWork: "",
              medicalCertificate: null,
            });
          },
        },
      ]);
    } catch (err) {
      console.error("[MobileAI] Leave form submit error:", err);
      const message = err instanceof Error ? err.message : String(err);
      Alert.alert("Error", `Failed to submit leave form: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <MenuDropdown />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.pageTitle, { color: colors.text }]}>Leave Form</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>Fill in your leave details and submit for approval.</Text>

          {/* Leave Type */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Type of Leave *</Text>
            <View style={[styles.pickerWrapper, { borderColor: colors.border }]}>
              <Picker
                selectedValue={form.leaveType}
                onValueChange={(v) => setField("leaveType", v as LeaveType)}
                mode="dropdown"
                style={[styles.picker, { color: colors.text }]}
              >
                {LEAVE_TYPES.map((lt) => (
                  <Picker.Item key={lt.value} label={lt.label} value={lt.value} enabled={lt.value !== "" || form.leaveType === ""} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Start Date */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Start Date * (YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              placeholder="e.g. 2025-08-01"
              placeholderTextColor={colors.textMuted}
              value={form.startDate}
              onChangeText={(v) => setField("startDate", v)}
              keyboardType="numeric"
            />
          </View>

          {/* End Date */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>End Date * (YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              placeholder="e.g. 2025-08-03"
              placeholderTextColor={colors.textMuted}
              value={form.endDate}
              onChangeText={(v) => setField("endDate", v)}
              keyboardType="numeric"
            />
          </View>

          {/* Sick Leave extras */}
          {form.leaveType === "SL" && (
            <>
              <View style={[styles.sickBanner, { backgroundColor: colors.warning, borderColor: colors.warning }]}>
                <Text style={[styles.sickBannerText, { color: colors.text }]}>🤒 Sick Leave — Additional Fields Required</Text>
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>Date Became Sick * (YYYY-MM-DD)</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                  placeholder="e.g. 2025-07-30"
                  placeholderTextColor={colors.textMuted}
                  value={form.dateBecameSick}
                  onChangeText={(v) => setField("dateBecameSick", v)}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>Date Returned to Work * (YYYY-MM-DD)</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                  placeholder="e.g. 2025-08-04"
                  placeholderTextColor={colors.textMuted}
                  value={form.dateReturnedToWork}
                  onChangeText={(v) => setField("dateReturnedToWork", v)}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>Medical Certificate (optional)</Text>
                <TouchableOpacity style={styles.uploadBtn} onPress={handlePickDocument} activeOpacity={0.7}>
                  <Text style={[styles.uploadBtnText, { color: colors.primary }]}>
                    {form.medicalCertificate ? `✓ ${form.medicalCertificate.name}` : "📎 Attach Medical Certificate"}
                  </Text>
                </TouchableOpacity>
                {form.medicalCertificate && (
                  <TouchableOpacity onPress={() => setField("medicalCertificate", null)}>
                    <Text style={styles.removeFile}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          {/* Reason */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Reason *</Text>
            <TextInput
              style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              placeholder="Enter reason for leave"
              placeholderTextColor={colors.textMuted}
              value={form.reason}
              onChangeText={(v) => setField("reason", v)}
              multiline
              textAlignVertical="top"
            />
          </View>

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
              <Text style={styles.submitBtnText}>Submit Leave Request</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 24, gap: 12 },
  scrollContent: { gap: 4, paddingBottom: 40 },
  pageTitle: { fontSize: 20, fontWeight: "700" },
  pageSubtitle: { fontSize: 13, marginBottom: 8 },
  field: { gap: 4, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
  },
  textArea: { height: 100, textAlignVertical: "top" },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: { height: 52 },
  sickBanner: {
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    marginBottom: 4,
  },
  sickBannerText: { fontSize: 13, fontWeight: "600" },
  uploadBtn: {
    borderWidth: 1.5,
    borderColor: "#1E0977",
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: "center",
    borderStyle: "dashed",
  },
  uploadBtnText: { fontSize: 13, fontWeight: "600", color: "#1E0977" },
  removeFile: { fontSize: 12, color: "#EF4444", marginTop: 4, textAlign: "center" },
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
