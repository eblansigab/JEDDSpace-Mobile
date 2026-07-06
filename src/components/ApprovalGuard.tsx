import { useAuth } from "@/lib/AuthContext";
import { usePathname, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

interface ApprovalGuardProps {
  children: React.ReactNode;
}

export default function ApprovalGuard({ children }: ApprovalGuardProps) {
  const { authReady, session, employee } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthRoute = pathname === "/login" || pathname === "/sign-in";
  const isApprovalRoute = pathname === "/awaiting-approval";
  const status = employee?.registration_status;
  const isAdmin = employee?.role?.toLowerCase() === "admin";
  
  const needsApproval = !isAdmin && (status === "pending" || status === "rejected");
  const shouldRedirectToApproval = !isAuthRoute && !isApprovalRoute && session?.user?.id && needsApproval;

  useEffect(() => {
    if (!authReady) return;

    if (shouldRedirectToApproval) {
      router.replace("/awaiting-approval");
    }
  }, [authReady, shouldRedirectToApproval, router]);

  if (!authReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1E0977" />
        <Text style={styles.loadingText}>Loading workspace...</Text>
      </View>
    );
  }

  // Prevent rendering the protected content if we are supposed to redirect
  if (shouldRedirectToApproval) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1E0977" />
      </View>
    );
  }

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
