import { supabase } from "./supabase";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "";

/**
 * Authenticates a user using their username or email.
 * First tries username resolution via backend API, then falls back to email login.
 */
export const loginWithUsername = async (usernameOrEmail: string, password: string) => {
  try {
    const normalizedInput = usernameOrEmail.trim().toLowerCase();

    // 1. Try username resolution via backend (public endpoint, no auth)
    const resolveResponse = await fetch(`${API_BASE_URL}/api/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: normalizedInput }),
    });

    let emailToUse = normalizedInput;

    if (resolveResponse.ok) {
      const result = await resolveResponse.json();
      if (result?.email) {
        emailToUse = result.email;
      }
    }

    // 2. If input is email and resolve failed, use it directly
    if (!resolveResponse.ok && !normalizedInput.includes("@")) {
      return { data: null, error: new Error("Invalid username or password.") };
    }

    // 3. Perform Supabase authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password,
    });

    return error ? { data: null, error: new Error("Invalid username or password.") } : { data, error: null };
  } catch {
    return { data: null, error: new Error("Invalid username or password.") };
  }
};
