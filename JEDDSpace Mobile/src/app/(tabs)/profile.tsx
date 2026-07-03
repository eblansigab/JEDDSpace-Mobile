import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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
import { clearSupabaseSession, supabase } from "@/lib/supabase";

function SectionCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function SectionTitle({ label }: { label: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{label}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

function StyledInput({
  placeholder,
  secure,
  value,
  onChangeText,
}: {
  placeholder: string;
  secure?: boolean;
  value?: string;
  onChangeText?: (t: string) => void;
}) {
  return (
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      secureTextEntry={secure}
      value={value}
      onChangeText={onChangeText}
    />
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.primaryBtn} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.primaryBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function Profile() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [authCode, setAuthCode] = useState("");

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await clearSupabaseSession();
            const { error } = await supabase.auth.signOut();
            if (error) {
              Alert.alert("Logout Error", error.message);
              return;
            }
            router.replace("/login");
          } catch (err: any) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar + name hero */}
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JC</Text>
          </View>
          <Text style={styles.heroName}>Juan dela Cruz</Text>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>Employee</Text>
          </View>
        </View>

        {/* Contact Info */}
        <SectionCard>
          <SectionTitle label="Contact Information" />
          <InfoRow label="Email"    value="1_delacruz@example.com" />
          <InfoRow label="Phone"    value="(123) 456-7890" />
          <InfoRow label="LinkedIn" value="linkedin.com/in/juandelacruz" />
        </SectionCard>

        {/* Profile Picture */}
        <SectionCard>
          <SectionTitle label="Profile Picture" />
          <View style={styles.pictureRow}>
            <View style={styles.picturePlaceholder}>
              <Text style={styles.pictureInitials}>JC</Text>
            </View>
            <View style={styles.pictureInfo}>
              <Text style={styles.pictureHint}>JPG or PNG, max 5MB</Text>
              <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.7}>
                <Text style={styles.outlineBtnText}>Change Picture</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SectionCard>

        {/* Change Password */}
        <SectionCard>
          <SectionTitle label="Change Password" />
          <FieldLabel label="Current Password" />
          <StyledInput
            placeholder="Enter current password"
            secure
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
          <FieldLabel label="New Password" />
          <StyledInput
            placeholder="Enter new password"
            secure
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <PrimaryButton label="Update Password" onPress={() => {}} />
        </SectionCard>

        {/* 2FA */}
        <SectionCard>
          <SectionTitle label="Two-Factor Authentication" />
          <Text style={styles.bodyText}>
            Add an extra layer of security to your account by enabling two-factor authentication.
          </Text>
          <FieldLabel label="Authenticator Code" />
          <StyledInput
            placeholder="Enter 6-digit code"
            value={authCode}
            onChangeText={setAuthCode}
          />
          <PrimaryButton label="Enable 2FA" onPress={() => {}} />
        </SectionCard>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutIcon}>→</Text>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 12,
    paddingBottom: 40,
  },

  // Hero
  hero: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1E0977",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  avatarText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 1,
  },
  heroName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  rolePill: {
    backgroundColor: "#EEF2FF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E0977",
  },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Section title
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#F3F4F6",
  },

  // Info rows
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  infoLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "500",
    flexShrink: 1,
    textAlign: "right",
    marginLeft: 12,
  },

  // Picture
  pictureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  picturePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  pictureInitials: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E0977",
  },
  pictureInfo: {
    flex: 1,
    gap: 8,
  },
  pictureHint: {
    fontSize: 12,
    color: "#9CA3AF",
  },

  // Inputs
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: -4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },

  // Body text
  bodyText: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 19,
  },

  // Buttons
  primaryBtn: {
    backgroundColor: "#1E0977",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: "#1E0977",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
  },
  outlineBtnText: {
    color: "#1E0977",
    fontSize: 13,
    fontWeight: "600",
  },

  // Logout
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  logoutIcon: {
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "700",
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 15,
    fontWeight: "700",
  },
});
