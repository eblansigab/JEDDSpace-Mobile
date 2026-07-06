import { clearSupabaseSession, supabase } from "@/lib/supabase";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { getNotificationsEnabled, setNotificationsEnabled } from "@/services/notificationService";

interface EmployeeProfile {
  employee_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  department: string | null;
  position: string | null;
  role: string | null;
  avatar_url: string | null;
  username: string | null;
}

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

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value || "-"}
      </Text>
    </View>
  );
}

function getInitials(profile: EmployeeProfile | null) {
  return `${profile?.first_name?.[0] ?? "?"}${profile?.last_name?.[0] ?? ""}`.toUpperCase();
}

export default function Profile() {
  const router = useRouter();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user?.id) return;

        const { data, error } = await supabase
          .from("employee")
          .select("employee_id, first_name, last_name, email, department, position, role, avatar_url, username")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (error) throw error;
        if (data && isMounted) setProfile(data as EmployeeProfile);
      } catch (err) {
        console.error("[MobileAI] Profile load error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    void (async () => {
      const enabled = await getNotificationsEnabled();
      setNotificationsEnabled(enabled);
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      const enabled = await getNotificationsEnabled();
      setNotificationsEnabled(enabled);
    })();
  }, []);

  const handleChangeAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission Required", "Please grant photo library access to upload an avatar.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];

    if (asset.fileSize && asset.fileSize > 2 * 1024 * 1024) {
      Alert.alert("File Too Large", "Please choose an avatar smaller than 2 MB.");
      return;
    }

    setAvatarLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id || !profile?.employee_id) throw new Error("Not authenticated");

      const resp = await fetch(asset.uri);
      const fileBody = await resp.arrayBuffer();
      const storagePath = `avatars/${session.user.id}.png`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(storagePath, fileBody, {
        contentType: asset.mimeType || "image/png",
        upsert: true,
      });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(storagePath);
      const avatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;

      const { error: updateError } = await supabase.from("employee").update({ avatar_url: avatarUrl }).eq("employee_id", profile.employee_id);
      if (updateError) throw updateError;

      setProfile((prev) => (prev ? { ...prev, avatar_url: avatarUrl } : prev));
      Alert.alert("Success", "Profile picture updated.");
    } catch (err) {
      console.error("[MobileAI] Avatar upload error:", err);
      const message = err instanceof Error ? err.message : String(err);
      Alert.alert("Error", `Failed to upload avatar: ${message}`);
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleRemoveAvatar = () => {
    Alert.alert("Remove Picture", "Remove your profile picture?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          if (!profile?.employee_id) return;
          setAvatarLoading(true);
          try {
            const {
              data: { session },
            } = await supabase.auth.getSession();
            if (session?.user?.id) {
              await supabase.storage.from("avatars").remove([`avatars/${session.user.id}.png`]);
            }
            const { error } = await supabase.from("employee").update({ avatar_url: null }).eq("employee_id", profile.employee_id);
            if (error) throw error;
            setProfile((prev) => (prev ? { ...prev, avatar_url: null } : prev));
          } catch (err) {
            console.error("[MobileAI] Remove avatar error:", err);
          } finally {
            setAvatarLoading(false);
          }
        },
      },
    ]);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert("Validation", "New password must be at least 6 characters.");
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      Alert.alert("Success", "Password updated successfully.");
      setNewPassword("");
    } catch (err) {
      console.error("[MobileAI] Change password error:", err);
      const message = err instanceof Error ? err.message : String(err);
      Alert.alert("Error", `Failed to update password: ${message}`);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    try {
      await setNotificationsEnabled(value);
      setNotificationsEnabled(value);
    } catch (err) {
      console.error("[MobileAI] Notification toggle error:", err);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            await Promise.all([supabase.auth.signOut(), clearSupabaseSession()]);
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            Alert.alert("Logout Error", message);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const initials = getInitials(profile);
  const fullName = profile ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "Employee" : "Loading...";

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E0977" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : (
          <>
            <View style={styles.hero}>
              <View style={styles.avatarContainer}>
                {profile?.avatar_url ? <Image style={styles.avatarImage} source={{ uri: profile.avatar_url }} contentFit="cover" /> : <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>}
                {avatarLoading ? <View style={styles.avatarOverlay}><ActivityIndicator color="#fff" /></View> : null}
              </View>
              <Text style={styles.heroName}>{fullName}</Text>
              <View style={styles.rolePill}>
                <Text style={styles.rolePillText}>{profile?.role ?? "Employee"}</Text>
              </View>
            </View>

            <SectionCard>
              <SectionTitle label="Contact Information" />
              <InfoRow label="Username" value={profile?.username} />
              <Text style={{ fontSize: 12, color: "#6B7280", marginTop: -4, paddingHorizontal: 4 }}>
                Usernames are managed by the administrator.
              </Text>
              <InfoRow label="Department" value={profile?.department} />
              <InfoRow label="Position" value={profile?.position} />
            </SectionCard>

            <SectionCard>
              <SectionTitle label="Profile Picture" />
              <View style={styles.pictureRow}>
                <View style={styles.picturePlaceholder}>
                  {profile?.avatar_url ? <Image style={styles.pictureThumbnail} source={{ uri: profile.avatar_url }} contentFit="cover" /> : <Text style={styles.pictureInitials}>{initials}</Text>}
                </View>
                <View style={styles.pictureInfo}>
                  <Text style={styles.pictureHint}>PNG, JPG, JPEG, or WEBP. Max 2 MB.</Text>
                  <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.7} onPress={handleChangeAvatar} disabled={avatarLoading}>
                    <Text style={styles.outlineBtnText}>{avatarLoading ? "Uploading..." : "Change Picture"}</Text>
                  </TouchableOpacity>
                  {profile?.avatar_url ? (
                    <TouchableOpacity onPress={handleRemoveAvatar} disabled={avatarLoading}>
                      <Text style={styles.removeText}>Remove Picture</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </SectionCard>

            <SectionCard>
              <SectionTitle label="Change Password" />
              <Text style={styles.fieldLabel}>New Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter new password (min 6 chars)"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity style={[styles.primaryBtn, changingPassword && styles.primaryBtnDisabled]} onPress={handleChangePassword} disabled={changingPassword} activeOpacity={0.8}>
                {changingPassword ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.primaryBtnText}>Update Password</Text>}
              </TouchableOpacity>
            </SectionCard>

            <SectionCard>
              <SectionTitle label="Notifications" />
              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleTitle}>Push Notifications</Text>
                  <Text style={styles.toggleHint}>Receive alerts and updates from JEDDSpace</Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: "#E5E7EB", true: "#1E0977" }}
                  thumbColor={notificationsEnabled ? "#fff" : "#9CA3AF"}
                />
              </View>
            </SectionCard>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" color="#EF4444" size={18} />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#F9FAFB" },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 24, gap: 12, paddingBottom: 40 },
  loadingContainer: { marginTop: 80, alignItems: "center", gap: 12 },
  loadingText: { fontSize: 14, color: "#6B7280" },
  hero: { alignItems: "center", paddingVertical: 24, gap: 8 },
  avatarContainer: { position: "relative", marginBottom: 4 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#1E0977", justifyContent: "center", alignItems: "center" },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 40, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "700" },
  heroName: { fontSize: 20, fontWeight: "700", color: "#111827" },
  rolePill: { backgroundColor: "#EEF2FF", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  rolePillText: { fontSize: 12, fontWeight: "600", color: "#1E0977" },
  card: { backgroundColor: "#fff", borderRadius: 8, padding: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 2 },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: "#6B7280", textTransform: "uppercase" },
  sectionLine: { flex: 1, height: 1, backgroundColor: "#F3F4F6" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#F9FAFB" },
  infoLabel: { fontSize: 13, color: "#6B7280", fontWeight: "500" },
  infoValue: { fontSize: 13, color: "#111827", fontWeight: "500", flexShrink: 1, textAlign: "right", marginLeft: 12 },
  pictureRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  picturePlaceholder: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#EEF2FF", justifyContent: "center", alignItems: "center", overflow: "hidden" },
  pictureThumbnail: { width: 72, height: 72 },
  pictureInitials: { fontSize: 22, fontWeight: "700", color: "#1E0977" },
  pictureInfo: { flex: 1, gap: 8 },
  pictureHint: { fontSize: 12, color: "#9CA3AF" },
  removeText: { fontSize: 12, color: "#EF4444", fontWeight: "600" },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: -4 },
  input: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: "#111827", backgroundColor: "#F9FAFB" },
  primaryBtn: { backgroundColor: "#1E0977", borderRadius: 8, paddingVertical: 12, alignItems: "center", marginTop: 4 },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  outlineBtn: { borderWidth: 1.5, borderColor: "#1E0977", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14, alignSelf: "flex-start" },
  outlineBtnText: { color: "#1E0977", fontSize: 13, fontWeight: "600" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#FEF2F2", borderRadius: 8, paddingVertical: 14, marginTop: 4 },
  logoutText: { color: "#EF4444", fontSize: 15, fontWeight: "700" },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  toggleInfo: { flex: 1, gap: 2 },
  toggleTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  toggleHint: { fontSize: 12, color: "#6B7280" },
});
