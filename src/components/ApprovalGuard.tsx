import { supabase } from "@/lib/supabase";
import { usePathname, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

interface ApprovalGuardProps {
  children: React.ReactNode;
}

export default function ApprovalGuard({ children }: ApprovalGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const isAuthRoute = pathname === "/login" || pathname === "/sign-in";
    const isApprovalRoute = pathname === "/awaiting-approval";

    const checkPermission = async () => {
      if (isAuthRoute || isApprovalRoute) {
        if (isMounted) {
          setAllowed(true);
          setChecking(false);
        }
        return;
      }

      setChecking(true);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user?.id) {
          if (isMounted) {
            setAllowed(false);
            setChecking(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from("employee")
          .select("registration_status, role")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (!isMounted) return;

        if (error) {
          console.error("[MobileAI] ApprovalGuard check error:", error);
          setAllowed(true);
          setChecking(false);
          return;
        }

        const status = data?.registration_status;
        const isAdmin = data?.role?.toLowerCase() === "admin";

        if (!isAdmin && (status === "pending" || status === "rejected")) {
          if (pathname !== "/awaiting-approval") {
            router.replace("/awaiting-approval");
          }
          setAllowed(true);
          setChecking(false);
          return;
        }

        setAllowed(true);
        setChecking(false);
      } catch (err) {
        console.error("[MobileAI] ApprovalGuard check error:", err);
        if (isMounted) {
          setAllowed(false);
          setChecking(false);
        }
      }
    };

    void checkPermission();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "SIGNED_OUT" || !nextSession?.user?.id) {
        if (isMounted) {
          setAllowed(false);
          setChecking(false);
        }
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        void checkPermission();
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (checking && !allowed) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1E0977" />
        <Text style={styles.loadingText}>Loading workspace...</Text>
      </View>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    gap: 12,
  },
  loadingText: { fontSize: 14, color: "#6B7280" },
});
