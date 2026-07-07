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
  import { loginWithUsername } from "@/lib/authService";

  export default function Login() {
    const router = useRouter();
    const { colors } = useTheme();
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
      <KeyboardAvoidingView style={[styles.flex, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={[styles.brand, { color: colors.primary }]}>JEDDSpace</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign in to continue to your workspace.</Text>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Username</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            returnKeyType="next"
          />

          <Text style={[styles.label, { color: colors.text }]}>Password</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            placeholderTextColor={colors.textMuted}
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
    flex: { flex: 1 },
    container: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 32 },
    hero: { marginBottom: 24, gap: 6 },
    brand: { fontSize: 28, fontWeight: "800" },
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
      minHeight: 50,
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
    linkRow: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 18 },
    linkText: { fontSize: 13 },
    linkTextBold: { fontSize: 13, fontWeight: "700" },
  });
