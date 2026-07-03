import MenuDropdown from "@/components/menuDropdown";
import Card from "@/components/card";
import { aiService, AnalyticsData } from "@/services/aiService";
import { supabase } from "@/lib/supabase";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Topic = { name: string; percentage: number; count: number };
type TopUser = { userId: string; name: string; count: number };

export default function AiAnalyticsScreen() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  const loadAnalytics = async () => {
    setLoading(true);
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
      if (data) {
        setAnalytics(data);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert("Error", `Failed to load analytics: ${message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadAnalytics();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    void loadAnalytics();
  };

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

  return (
    <View style={styles.container}>
      <MenuDropdown />

      <Text style={styles.title}>AI Analytics</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Most Asked Topics</Text>
        {analytics?.topics && analytics.topics.length > 0 ? (
          analytics.topics.map((topic: Topic) => (
            <View key={topic.name} style={styles.topicRow}>
              <Text style={styles.topicName}>{topic.name}</Text>
              <View style={styles.topicBar}>
                <View style={[styles.topicBarFill, { width: `${Math.min(topic.percentage, 100)}%` }]} />
              </View>
              <Text style={styles.topicCount}>{topic.count}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No topics recorded yet.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Most Active Users</Text>
        <Card>
          {analytics?.topUsers && analytics.topUsers.length > 0 ? (
            analytics.topUsers.map((user: TopUser) => (
              <View key={user.userId} style={styles.userRow}>
                <Text style={styles.userName}>{user.name || user.userId}</Text>
                <Text style={styles.userCount}>{user.count} queries</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No users recorded yet.</Text>
          )}
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Usage</Text>
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
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        <Card>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Avg Response Time</Text>
              <Text style={styles.metricValue}>{analytics?.performance?.averageResponseTimeMs ?? 0}ms</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Avg Groq Latency</Text>
              <Text style={styles.metricValue}>{analytics?.performance?.averageGroqLatencyMs ?? 0}ms</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Avg Confidence</Text>
              <Text style={styles.metricValue}>{analytics?.performance?.averageConfidence ?? 0}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Cache Hit Rate</Text>
              <Text style={styles.metricValue}>{analytics?.performance?.cacheHitRate ?? 0}%</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Docs Processed</Text>
              <Text style={styles.metricValue}>{analytics?.performance?.documentsProcessed ?? 0}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Entity Resolutions</Text>
              <Text style={styles.metricValue}>{analytics?.performance?.entityResolutionSuccesses ?? 0}</Text>
            </View>
          </View>
        </Card>
      </View>

      <View style={{ flex: 1 }} />
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  topicName: {
    fontSize: 13,
    color: "#374151",
    width: 80,
  },
  topicBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    overflow: "hidden",
  },
  topicBarFill: {
    height: "100%",
    backgroundColor: "#1E0977",
  },
  topicCount: {
    fontSize: 13,
    color: "#6B7280",
    width: 40,
    textAlign: "right",
  },
  userRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  userName: {
    fontSize: 14,
    color: "#111827",
  },
  userCount: {
    fontSize: 13,
    color: "#6B7280",
  },
  usageRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
  },
  usageItem: {
    alignItems: "center",
    flex: 1,
  },
  usageValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E0977",
  },
  usageLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricItem: {
    width: "48%",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 10,
  },
  metricLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
  },
  emptyText: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    padding: 12,
  },
});