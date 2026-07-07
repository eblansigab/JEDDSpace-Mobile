import { useRouter } from "expo-router";
import { useState } from "react";
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
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

export default function SignIn() {
  const router = useRouter();
  const { colors } = useTheme();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!username || !email || !password || !confirmPassword || !firstName || !lastName || !department || !position) {
      Alert.alert("Validation Error", "Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match.");
      return;
    }

    // Username validation: lowercase, letters, numbers, underscores, no spaces
    const usernameRegex = /^[a-z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      Alert.alert("Validation Error", "Username can only contain lowercase letters, numbers, and underscores (no spaces).");
      return;
    }

    setLoading(true);
    try {
      // Skip username check (RLS blocks) - let Supabase handle it via user_metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            department,
            position,
            username,
          },
        },
      });

      if (error) {
        Alert.alert("Sign Up Error", error.message);
        return;
      }

      console.log("[Sign-up] Auth user created:", { userId: data?.user?.id, email: data?.user?.email });

      if (!data?.session) {
        Alert.alert("Registration successful", "Your account was created. Please sign in to continue.");
        router.replace("/login");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      Alert.alert("Unexpected Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={[styles.heading, { color: colors.primary }]}>Create your account</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Set up your workspace access in a few steps.</Text>
        </View>

        <Text style={[styles.label, { color: colors.text }]}>First Name</Text>
        <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} value={firstName} onChangeText={setFirstName} placeholder="First Name" placeholderTextColor={colors.textMuted} returnKeyType="next" />

        <Text style={[styles.label, { color: colors.text }]}>Last Name</Text>
        <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} value={lastName} onChangeText={setLastName} placeholder="Last Name" placeholderTextColor={colors.textMuted} returnKeyType="next" />

        <Text style={[styles.label, { color: colors.text }]}>Username</Text>
        <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} value={username} onChangeText={setUsername} placeholder="Choose a username" placeholderTextColor={colors.textMuted} autoCapitalize="none" autoCorrect={false} returnKeyType="next" />

        <Text style={[styles.label, { color: colors.text }]}>Department</Text>
        <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} value={department} onChangeText={setDepartment} placeholder="Department" placeholderTextColor={colors.textMuted} returnKeyType="next" />

        <Text style={[styles.label, { color: colors.text }]}>Position</Text>
        <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} value={position} onChangeText={setPosition} placeholder="Position" placeholderTextColor={colors.textMuted} returnKeyType="next" />

        <Text style={[styles.label, { color: colors.text }]}>Email</Text>
        <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={colors.textMuted} autoCapitalize="none" keyboardType="email-address" returnKeyType="next" />

        <Text style={[styles.label, { color: colors.text }]}>Password</Text>
        <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} value={password} onChangeText={setPassword} placeholder="Create password" placeholderTextColor={colors.textMuted} secureTextEntry returnKeyType="next" />

        <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
        <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm password" placeholderTextColor={colors.textMuted} secureTextEntry returnKeyType="done" onSubmitEditing={() => void handleSignUp()} />

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={() => void handleSignUp()} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.buttonText}>Create Account</Text>}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { paddingHorizontal: 24, paddingVertical: 32, justifyContent: "center", flexGrow: 1 },
  hero: { marginBottom: 16, gap: 6 },
  heading: { fontSize: 24, fontWeight: "700" },
  subtitle: { fontSize: 14 },
  label: { fontSize: 14, fontWeight: "600", marginTop: 12, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#1E0977",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24, gap: 6 },
  footerText: { fontSize: 13 },
  footerLink: { fontSize: 13, fontWeight: "700" },
});
