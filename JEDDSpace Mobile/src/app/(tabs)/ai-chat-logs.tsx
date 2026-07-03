import MenuDropdown from "@/components/menuDropdown";
import { aiService, ChatLog } from "@/services/aiService";
import { supabase } from "@/lib/supabase";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function AiChatLogsScreen() {
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  const loadLogs = async () => {
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

      const data = await aiService.loadAllChatLogs();
      setLogs(data || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert("Error", `Failed to load chat logs: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const truncate = (str: string, max = 40) => {
    if (!str) return "-";
    return str.length > max ? `${str.slice(0, max)}...` : str;
  };

  if (unauthorized) {
    return (
      <View style={styles.unauthContainer}>
        <MenuDropdown />
        <Text style={styles.unauthText}>Admin access required for AI Chat Logs.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MenuDropdown />

      <Text style={styles.title}>AI Chat Logs</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E0977" />
          <Text style={styles.loadingText}>Loading logs...</Text>
        </View>
      ) : logs.length === 0 ? (
        <Text style={styles.emptyText}>No chat logs found.</Text>
      ) : (
        <ScrollView>
          <View style={styles.tableHeader}>
            <Text style={styles.headerCell}>Date</Text>
            <Text style={styles.headerCell}>User</Text>
            <Text style={styles.headerCell}>Intent</Text>
            <Text style={styles.headerCell}>Prompt</Text>
            <Text style={styles.headerCell}>Response</Text>
          </View>

          {logs.map((log) => (
            <View key={log.chat_id} style={styles.tableRow}>
              <Text style={styles.cell}>{formatDate(log.created_at)}</Text>
              <Text style={styles.cell}>
                {log.employee
                  ? `${log.employee.first_name || ""} ${log.employee.last_name || ""}`.trim() || log.user_id
                  : log.user_id}
              </Text>
              <Text style={styles.cell}>{truncate(log.intent)}</Text>
              <Text style={styles.cell} numberOfLines={1}>
                {truncate(log.prompt)}
              </Text>
              <Text style={styles.cell} numberOfLines={1}>
                {truncate(log.response)}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
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
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 40,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 8,
    gap: 4,
  },
  headerCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingVertical: 10,
    gap: 4,
  },
  cell: {
    flex: 1,
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
  },
});