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
  import { loginWithUsername } from "@/lib/authService";

  export default function Login() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignIn = async () => {
      if (!username || !password) {
        Alert.alert("Validation Error", "Please enter both username and password");
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await loginWithUsername(username, password);

        if (error) {
          Alert.alert("Login Error", error.message);
          return;
        }

        if (!data?.session) {
          Alert.alert("Login Error", "Failed to create a session. Please try again.");
          return;
        }



        // RootLayout will handle the redirect to "/" automatically
      } catch (err) {
        const message = err instanceof Error ? err.message : "An error occurred during login";
        Alert.alert("Unexpected Error", message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={styles.brand}>JEDDSpace</Text>
            <Text style={styles.subtitle}>Sign in to continue to your workspace.</Text>
          </View>

          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            returnKeyType="next"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            editable={!loading}
            returnKeyType="done"
            onSubmitEditing={() => void handleSignIn()}
          />

          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={() => void handleSignIn()} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.buttonText}>Sign In</Text>}
          </TouchableOpacity>

          
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: "#F9FAFB" },
    container: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 32 },
    hero: { marginBottom: 24, gap: 6 },
    brand: { fontSize: 28, fontWeight: "800", color: "#1E0977" },
    subtitle: { fontSize: 14, color: "#6B7280" },
    label: { fontSize: 14, fontWeight: "600", color: "#374151", marginTop: 12, marginBottom: 8 },
    input: {
      borderWidth: 1,
      borderColor: "#E5E7EB",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 16,
      color: "#111827",
      backgroundColor: "#fff",
    },
    button: {
      backgroundColor: "#1E0977",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 10,
      marginTop: 20,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 50,
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
    linkRow: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 18 },
    linkText: { color: "#6B7280", fontSize: 13 },
    linkTextBold: { color: "#1E0977", fontSize: 13, fontWeight: "700" },
  });
