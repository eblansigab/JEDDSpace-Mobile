import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const router = useRouter();
  // Form state (same as web)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Validation Error", "Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      console.log("Attempting to sign in with:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Sign in response:", { data, error });

      if (error) {
        console.error("Sign in error:", error);
        Alert.alert("Login Error", error.message);
        setLoading(false);
        return;
      }

      if (!data?.session) {
        console.error("No session returned after sign in");
        Alert.alert("Login Error", "Failed to create session. Please check your credentials.");
        setLoading(false);
        return;
      }

      // Successfully logged in - the auth state listener will handle the redirect
      console.log("Sign in successful, user:", data.user?.email);
      Alert.alert("Success", "Logged in successfully!");
    } catch (err) {
      console.error("Unexpected error during sign in:", err);
      Alert.alert("Unexpected Error", err.message || "An error occurred during login");
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Enter Email"
        placeholderTextColor="#999"
        autoCapitalize="none"
        editable={!loading}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Enter Password"
        placeholderTextColor="#999"
        secureTextEntry
        editable={!loading}
      />

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>

      <View style={styles.signUpContainer}>
        <Text style={styles.signUpText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.push("/sign-in")} disabled={loading}>
          <Text style={[styles.signUpLink, loading && styles.disabled]}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    color: "#333",
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
    minHeight: 50,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  signUpText: {
    color: "#666",
    fontSize: 14,
  },
  signUpLink: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.6,
  },
});