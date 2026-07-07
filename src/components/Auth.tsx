import { useTheme } from "@/context/ThemeContext";
import { supabase } from "../../lib/supabase";
import React, { useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type AuthProps = {
  navigation: {
    navigate: (screen: string) => void;
  };
};

export default function Auth({ navigation }: AuthProps) {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

async function signInWithEmail() {
  setLoading(true);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  setLoading(false);

  if (error) {
    Alert.alert(error.message);
    return;
  }

  // IMPORTANT: FORCE NAVIGATION (WEB STYLE LOGIC)
  navigation.navigate("Dashboard");
}

  async function signUpWithEmail() {
  setLoading(true);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    Alert.alert(error.message);
    setLoading(false);
    return;
  }

  // IMPORTANT: save profile data (REQUIRED for your system)
  const user = data.user;

  if (user) {
    await supabase.from("users").insert({
      id: user.id,
      email: email,
      position: "Admin", // TEMP (or make input later)
      department: "IT",
      first_name: "",
      last_name: "",
    });
  }

  Alert.alert("Check your email for verification!");
  setLoading(false);
}

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
        <TextInput
          onChangeText={(text) => setEmail(text)}
          value={email}
          placeholder="email@address.com"
          autoCapitalize="none"
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
        />
      </View>
      <View style={styles.verticallySpaced}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
        <TextInput
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry={true}
          placeholder="Password"
          autoCapitalize="none"
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => signInWithEmail()}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Sign in</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.verticallySpaced}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => signUpWithEmail()}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: "stretch",
  },
  mt20: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#86939e",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#86939e",
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2089dc",
    borderRadius: 4,
    padding: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
