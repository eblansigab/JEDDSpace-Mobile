import { Image } from "expo-image";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter, useSegments } from "expo-router";

export default function RootLayout() {
  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Check if user is already logged in
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setInitializing(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session) {
          // User logged in, redirect to tabs
          router.replace("/(tabs)");
        } else {
          // User logged out, redirect to login
          router.replace("/login");
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Handle deep linking and redirects based on session
  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === "(tabs)";

    if (session && !inAuthGroup) {
      // User is logged in but not in tabs group, redirect
      router.replace("/(tabs)");
    } else if (!session && inAuthGroup) {
      // User is not logged in but trying to access tabs, redirect to login
      router.replace("/login");
    }
  }, [session, segments, initializing]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#1E0977" },
        headerShadowVisible: false,
        headerTintColor: "#fff",
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          headerTitle: () => {
            <Image
              style={{ width: "50%", height: "auto" }}
              source={require("../components/jeddspace_logo.png")}
            />;
          },
        }}
      />
      <Stack.Screen
        name="sign-in"
        options={{
          headerTitle: () => {
            <Image
              style={{ width: "50%", height: "auto" }}
              source={require("../components/jeddspace_logo.png")}
            />;
          },
        }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
