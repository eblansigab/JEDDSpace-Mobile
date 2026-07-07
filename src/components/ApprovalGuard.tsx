import { useAuth } from "@/lib/AuthContext";
import { usePathname, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";

interface ApprovalGuardProps {
  children: React.ReactNode;
}

export default function ApprovalGuard({ children }: ApprovalGuardProps) {
  const { authReady, session, employee } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useTheme();

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
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading workspace...</Text>
      </View>
    );
  }

  // Prevent rendering the protected content if we are supposed to redirect
  if (shouldRedirectToApproval) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
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
    gap: 12,
  },
  loadingText: { fontSize: 14 },
});
