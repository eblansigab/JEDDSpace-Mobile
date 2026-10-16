import { Image } from "expo-image";
import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ThemeProvider } from "@/context/ThemeContext";
import * as SplashScreen from "expo-splash-screen";
import type { Session } from "@supabase/supabase-js";

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(session);
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        if (mounted) {
          setAuthReady(true);
          void SplashScreen.hideAsync();
        }
      }
    })();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        setSession(nextSession);
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;

    const isAuthRoute = pathname === "/login" || pathname === "/sign-in";

    if (session && isAuthRoute) {
      router.replace("/");
    } else if (!session && !isAuthRoute) {
      router.replace("/login");
    }
  }, [authReady, session, pathname, router]);

  return (
    <ThemeProvider>
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
    </ThemeProvider>
  );
}
