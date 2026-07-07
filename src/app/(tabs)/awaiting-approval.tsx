import { useTheme } from "@/context/ThemeContext";
import { clearSupabaseSession, supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type RegistrationStatus = "pending" | "rejected" | "approved" | null;

export default function AwaitingApprovalScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [status, setStatus] = useState<RegistrationStatus>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("employee")
        .select("first_name, registration_status")
        .eq("user_id", session.user.id)
        .maybeSingle();

      setStatus((data?.registration_status as RegistrationStatus) ?? null);
      setName(data?.first_name ?? null);
      setLoading(false);
    })();
  }, []);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E0977" />
      </View>
    );
  }

  const isRejected = status === "rejected";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.statusIcon, isRejected && styles.statusIconRejected]}>{isRejected ? "!" : "..."}</Text>
        <Text style={[styles.heading, { color: colors.text }]}>{isRejected ? "Access Denied" : "Awaiting Approval"}</Text>
        {name ? <Text style={[styles.greeting, { color: colors.textSecondary }]}>Hi, {name}.</Text> : null}
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {isRejected
            ? "Your registration request has been rejected. Please contact your administrator for assistance."
            : "Your account registration is currently under review. You will be notified once an administrator approves your access."}
        </Text>
        {isRejected ? (
          <View style={styles.helpBox}>
            <Text style={styles.helpText}>If you believe this is a mistake, please reach out to HR.</Text>
          </View>
        ) : null}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={styles.signOutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, justifyContent: "center", padding: 24 },
  card: {
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EEF2FF",
    color: "#1E0977",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 52,
  },
  statusIconRejected: { backgroundColor: "#FEF2F2", color: "#DC2626" },
  heading: { fontSize: 22, fontWeight: "700", textAlign: "center" },
  greeting: { fontSize: 16, fontWeight: "500" },
  message: { fontSize: 14, textAlign: "center", lineHeight: 21, paddingHorizontal: 8 },
  helpBox: { backgroundColor: "#FEF3C7", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#FDE68A" },
  helpText: { fontSize: 13, color: "#92400E", textAlign: "center" },
  signOutBtn: {
    marginTop: 8,
    backgroundColor: "#1E0977",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignSelf: "stretch",
    alignItems: "center",
  },
  signOutBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
