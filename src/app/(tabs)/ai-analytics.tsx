import Card from "@/components/card";
import MenuDropdown from "@/components/menuDropdown";
import { supabase } from "@/lib/supabase";
import { aiService, AnalyticsData } from "@/services/aiService";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Topic = { name: string; percentage: number; count: number };
type TopUser = { userId: string; name: string; count: number; avatar_url?: string };

export default function AiAnalyticsScreen() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  const loadAnalytics = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        setUnauthorized(true);
        return;
      }

      const { data: employee } = await supabase
        .from("employee")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (employee?.role?.toLowerCase() !== "admin") {
        setUnauthorized(true);
        return;
      }

      const data = await aiService.loadAnalytics();
      setAnalytics(data);
      setUnauthorized(false);
    } catch (error) {
      console.error("[MobileAI] Analytics load failed:", error);
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert("Error", `Failed to load analytics: ${message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadAnalytics();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (unauthorized) {
    return (
      <View style={styles.unauthContainer}>
        <MenuDropdown />
        <Text style={styles.unauthText}>Admin access required for AI Analytics.</Text>
      </View>
    );
  }

  if (loading && !analytics) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E0977" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  const performance = analytics?.performance;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadAnalytics(true)} />}
    >
      <MenuDropdown />
      <Text style={styles.title}>AI Analytics</Text>

      <View style={styles.usageRow}>
        <View style={styles.usageItem}>
          <Text style={styles.usageValue}>{analytics?.usage?.today ?? 0}</Text>
          <Text style={styles.usageLabel}>Today</Text>
        </View>
        <View style={styles.usageItem}>
          <Text style={styles.usageValue}>{analytics?.usage?.thisWeek ?? 0}</Text>
          <Text style={styles.usageLabel}>This Week</Text>
        </View>
        <View style={styles.usageItem}>
          <Text style={styles.usageValue}>{analytics?.usage?.thisMonth ?? 0}</Text>
          <Text style={styles.usageLabel}>This Month</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Most Asked Topics</Text>
        <Card>
          {analytics?.topics?.length ? (
            analytics.topics.map((topic: Topic) => (
              <View key={topic.name} style={styles.topicRow}>
                <Text style={styles.topicName}>{topic.name || "-"}</Text>
                <View style={styles.topicBar}>
                  <View style={[styles.topicBarFill, { width: `${Math.min(topic.percentage || 0, 100)}%` }]} />
                </View>
                <Text style={styles.topicCount}>{topic.count ?? 0}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No topics recorded yet.</Text>
          )}
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Most Active Users</Text>
        <Card>
          {analytics?.topUsers?.length ? (
            analytics.topUsers.map((user: TopUser) => (
              <View key={user.userId} style={styles.userRow}>
                <View style={styles.initials}>
                  <Text style={styles.initialsText}>{(user.name || user.userId || "?").slice(0, 2).toUpperCase()}</Text>
                </View>
                <Text style={styles.userName}>{user.name || user.userId || "-"}</Text>
                <Text style={styles.userCount}>{user.count} queries</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No users recorded yet.</Text>
          )}
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        <Card>
          <View style={styles.metricsGrid}>
            <Metric label="Avg Response" value={`${performance?.averageResponseTimeMs ?? 0}ms`} />
            <Metric label="Groq Latency" value={`${performance?.averageGroqLatencyMs ?? 0}ms`} />
            <Metric label="Confidence" value={`${performance?.averageConfidence ?? 0}`} />
            <Metric label="Cache Hit Rate" value={`${performance?.cacheHitRate ?? 0}%`} />
            <Metric label="Docs Processed" value={`${performance?.documentsProcessed ?? 0}`} />
            <Metric label="Clarifications" value={`${performance?.clarificationRequests ?? 0}`} />
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricItem}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  unauthContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  unauthText: {
    fontSize: 16,
    color: "#DC2626",
    textAlign: "center",
    marginTop: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { marginTop: 12, fontSize: 14, color: "#6B7280" },
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32, gap: 16 },
  title: { fontSize: 20, fontWeight: "700", color: "#111827" },
  section: { gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  topicRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
  topicName: { fontSize: 13, color: "#374151", width: 92 },
  topicBar: { flex: 1, height: 8, backgroundColor: "#F3F4F6", borderRadius: 4, overflow: "hidden" },
  topicBarFill: { height: "100%", backgroundColor: "#1E0977" },
  topicCount: { fontSize: 13, color: "#6B7280", width: 36, textAlign: "right" },
  userRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  initials: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
  initialsText: { color: "#1E0977", fontWeight: "700", fontSize: 12 },
  userName: { flex: 1, fontSize: 14, color: "#111827" },
  userCount: { fontSize: 13, color: "#6B7280" },
  usageRow: { flexDirection: "row", gap: 12 },
  usageItem: { alignItems: "center", flex: 1, backgroundColor: "#fff", borderRadius: 8, padding: 14 },
  usageValue: { fontSize: 24, fontWeight: "700", color: "#1E0977" },
  usageLabel: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metricItem: { width: "47%", backgroundColor: "#F9FAFB", borderRadius: 8, padding: 10 },
  metricLabel: { fontSize: 12, color: "#6B7280" },
  metricValue: { fontSize: 16, fontWeight: "700", color: "#111827", marginTop: 4 },
  emptyText: { fontSize: 13, color: "#9CA3AF", textAlign: "center", padding: 12 },
});
