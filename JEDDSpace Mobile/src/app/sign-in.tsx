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
import { supabase } from "../../lib/supabase";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword || !firstName || !lastName || !department || !position) {
      Alert.alert("Validation Error", "Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            department,
            position,
          },
        },
      });

      if (error) {
        Alert.alert("Sign Up Error", error.message);
        setLoading(false);
        return;
      }

      Alert.alert(
        "Registration Successful",
        data.user
          ? "Your account has been created. Please check your email for confirmation if required. You can now log in."
          : "A confirmation email has been sent. Please verify your email before logging in."
      );
      router.replace("/login");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      Alert.alert("Unexpected Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Create your account</Text>

        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="First Name"
          placeholderTextColor="#999"
          returnKeyType="next"
        />

        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Last Name"
          placeholderTextColor="#999"
          returnKeyType="next"
        />

        <Text style={styles.label}>Department</Text>
        <TextInput
          style={styles.input}
          value={department}
          onChangeText={setDepartment}
          placeholder="Department"
          placeholderTextColor="#999"
          returnKeyType="next"
        />

        <Text style={styles.label}>Position</Text>
        <TextInput
          style={styles.input}
          value={position}
          onChangeText={setPosition}
          placeholder="Position"
          placeholderTextColor="#999"
          returnKeyType="next"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor="#999"
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="next"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter Password"
          placeholderTextColor="#999"
          secureTextEntry
          returnKeyType="next"
        />

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm Password"
          placeholderTextColor="#999"
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={handleSignUp}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={styles.footerLink}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    padding: 20,
    paddingBottom: 40,
    justifyContent: "center",
    flexGrow: 1,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
    color: "#1E0977",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 30,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "300",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 60,
  },
  footerText: {
    color: "#666",
    marginRight: 6,
  },
  footerLink: {
    color: "#007AFF",
    fontWeight: "600",
  },
});
