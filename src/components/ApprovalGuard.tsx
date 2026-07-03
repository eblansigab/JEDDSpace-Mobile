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
    let didNavigate = false;

    void (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user?.id || pathname.includes("awaiting-approval")) {
          if (isMounted) setAllowed(true);
          return;
        }

        const { data } = await supabase
          .from("employee")
          .select("registration_status, role")
          .eq("user_id", session.user.id)
          .maybeSingle();

        const status = data?.registration_status;
        const isAdmin = data?.role?.toLowerCase() === "admin";

        if (!isAdmin && (status === "pending" || status === "rejected")) {
          if (!didNavigate) {
            didNavigate = true;
            if (isMounted) setAllowed(false);
            router.replace("/awaiting-approval");
          }
          return;
        }

        if (isMounted) setAllowed(true);
      } catch (err) {
        console.error("[MobileAI] ApprovalGuard check error:", err);
        if (isMounted) setAllowed(true);
      } finally {
        if (isMounted) setChecking(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  if (checking) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1E0977" />
        <Text style={styles.loadingText}>Verifying access...</Text>
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
