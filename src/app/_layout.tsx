import { Image } from "expo-image";
import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";

function RootLayoutNav() {
  const { session, authReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useTheme();

  useEffect(() => {
    if (authReady) {
      void SplashScreen.hideAsync();
    }
  }, [authReady]);

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
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
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

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </AuthProvider>
  );
}
