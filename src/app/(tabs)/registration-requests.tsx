import MenuDropdown from "@/components/menuDropdown";
import { supabase } from "@/lib/supabase";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface PendingEmployee {
  employee_id: string;
  first_name: string | null;
  last_name: string | null;
  department: string | null;
  position: string | null;
  created_at: string | null;
  avatar_url?: string | null;
}

function getInitials(employee: PendingEmployee) {
  return `${employee.first_name?.[0] ?? "?"}${employee.last_name?.[0] ?? ""}`.toUpperCase();
}

export default function RegistrationRequestsScreen() {
  const [employees, setEmployees] = useState<PendingEmployee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return employees;
    return employees.filter((employee) =>
      [employee.first_name, employee.last_name, employee.department, employee.position].filter(Boolean).join(" ").toLowerCase().includes(needle),
    );
  }, [employees, search]);

  const loadData = async (refresh = false) => {
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

      const { data: emp } = await supabase.from("employee").select("role").eq("user_id", session.user.id).maybeSingle();
      if (emp?.role?.toLowerCase() !== "admin") {
        setUnauthorized(true);
        return;
      }

      const { data, error } = await supabase
        .from("employee")
        .select("employee_id, first_name, last_name, department, position, created_at, avatar_url")
        .eq("registration_status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEmployees((data ?? []) as PendingEmployee[]);
      setUnauthorized(false);
    } catch (err) {
      console.error("[MobileAI] Registration requests load error:", err);
      const message = err instanceof Error ? err.message : String(err);
      Alert.alert("Error", `Failed to load registration requests: ${message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const updateStatus = async (employeeId: string, status: "approved" | "rejected") => {
    setProcessingId(employeeId);
    try {
      const { error } = await supabase.from("employee").update({ registration_status: status }).eq("employee_id", employeeId);
      if (error) throw error;
      setEmployees((prev) => prev.filter((employee) => employee.employee_id !== employeeId));
      Alert.alert("Done", `Employee has been ${status}.`);
    } catch (err) {
      console.error("[MobileAI] Status update error:", err);
      const message = err instanceof Error ? err.message : String(err);
      Alert.alert("Error", `Failed to update: ${message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const confirmStatus = (employee: PendingEmployee, status: "approved" | "rejected") => {
    const fullName = `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() || "this employee";
    Alert.alert(status === "approved" ? "Approve" : "Reject", `${status === "approved" ? "Approve" : "Reject"} ${fullName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: status === "approved" ? "Approve" : "Reject",
        style: status === "rejected" ? "destructive" : "default",
        onPress: () => void updateStatus(employee.employee_id, status),
      },
    ]);
  };

  if (unauthorized) {
    return (
      <View style={styles.unauthContainer}>
        <MenuDropdown />
        <Text style={styles.unauthText}>Admin access required to view registration requests.</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: PendingEmployee }) => {
    const isProcessing = processingId === item.employee_id;
    const date = item.created_at ? new Date(item.created_at).toLocaleDateString() : "-";
    const fullName = `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim() || "Unnamed employee";

    return (
      <View style={styles.card}>
        <View style={styles.cardInfo}>
          <View style={styles.initials}>
            <Text style={styles.initialsText}>{getInitials(item)}</Text>
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardName}>{fullName}</Text>
            <Text style={styles.cardMeta}>
              {item.position ?? "-"} - {item.department ?? "-"}
            </Text>
            <Text style={styles.cardDate}>Requested: {date}</Text>
          </View>
        </View>
        <View style={styles.cardActions}>
          {isProcessing ? (
            <ActivityIndicator size="small" color="#1E0977" />
          ) : (
            <>
              <TouchableOpacity style={styles.approveBtn} onPress={() => confirmStatus(item, "approved")} activeOpacity={0.7}>
                <Text style={styles.approveBtnText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => confirmStatus(item, "rejected")} activeOpacity={0.7}>
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <MenuDropdown />
      <Text style={styles.title}>Registration Requests</Text>
      <TextInput style={styles.searchInput} placeholder="Search by name or department" placeholderTextColor="#9CA3AF" value={search} onChangeText={setSearch} />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E0977" />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.employee_id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadData(true)} />}
          ListEmptyComponent={<Text style={styles.emptyText}>{search ? "No results match your search." : "No pending registration requests."}</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  unauthContainer: { flex: 1, backgroundColor: "#F9FAFB", paddingHorizontal: 16, paddingTop: 24, gap: 12 },
  unauthText: { fontSize: 16, color: "#DC2626", textAlign: "center", marginTop: 40 },
  container: { flex: 1, backgroundColor: "#F9FAFB", paddingHorizontal: 16, paddingTop: 24, gap: 12 },
  title: { fontSize: 20, fontWeight: "700", color: "#111827" },
  searchInput: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#fff", fontSize: 14, color: "#111827" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#6B7280" },
  list: { gap: 10, paddingBottom: 32 },
  emptyText: { textAlign: "center", color: "#9CA3AF", fontSize: 14, marginTop: 40 },
  card: { backgroundColor: "#fff", borderRadius: 8, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, gap: 12 },
  cardInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  initials: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#EEF2FF", justifyContent: "center", alignItems: "center" },
  initialsText: { fontSize: 15, fontWeight: "700", color: "#1E0977" },
  cardText: { flex: 1, gap: 2 },
  cardName: { fontSize: 15, fontWeight: "700", color: "#111827" },
  cardMeta: { fontSize: 12, color: "#6B7280" },
  cardDate: { fontSize: 11, color: "#9CA3AF" },
  cardActions: { flexDirection: "row", gap: 8, justifyContent: "flex-end" },
  approveBtn: { backgroundColor: "#059669", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  approveBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  rejectBtn: { backgroundColor: "#FEF2F2", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: "#FCA5A5" },
  rejectBtnText: { color: "#EF4444", fontSize: 13, fontWeight: "700" },
});
