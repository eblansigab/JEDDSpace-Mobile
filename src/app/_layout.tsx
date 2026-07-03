import { Image } from "expo-image";
import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Session } from "@supabase/supabase-js";

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

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
      (event, session) => {
        setSession(session);
        if (event === "SIGNED_OUT" || !session) {
          router.replace("/login");
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  // Handle deep linking and redirects based on session
  useEffect(() => {
    if (initializing) return;

    const isAuthRoute = pathname === "/login" || pathname === "/sign-in";

    if (session && isAuthRoute) {
      router.replace("/(tabs)");
    } else if (!session && !isAuthRoute) {
      router.replace("/login");
    }
  }, [session, initializing, router, pathname]);

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
          headerTitle: () => (
            <Image
              style={{ width: "50%", height: "auto" }}
              source={require("../components/jeddspace_logo.png")}
            />
          ),
        }}
      />
      <Stack.Screen
        name="sign-in"
        options={{
          headerTitle: () => (
            <Image
              style={{ width: "50%", height: "auto" }}
              source={require("../components/jeddspace_logo.png")}
            />
          ),
        }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
