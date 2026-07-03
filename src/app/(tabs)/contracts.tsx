import Card from "@/components/card";
import MenuDropdown from "@/components/menuDropdown";
import StatusBadge, { Status } from "@/components/StatusBadge";
import { DatePicker } from "@/components/DatePicker";
import { supabase } from "@/lib/supabase";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";

type Contract = {
  contract_id: string;
  contract_title: string;
  status: string;
  contractor_id?: string;
  contractor_name?: string;
  start_date?: string;
  end_date?: string;
  contract_url?: string | null;
  contract_file_url?: string | null;
  salary?: number | null;
};

export default function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);
  const [tempStart, setTempStart] = useState("");
  const [tempEnd, setTempEnd] = useState("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const { data: contractsData, error: contractError } = await supabase
          .from("contracts")
          .select("*")
          .order("created_at", { ascending: false });

        if (contractError) throw contractError;
        const rawContracts = (contractsData || []) as Record<string, unknown>[];

        const mappedContracts: Contract[] = rawContracts.map((row) => ({
          contract_id: String(row.contracts_id || row.id || ""),
          contract_title: String(row.contract_title || row.title || "Untitled Contract"),
          status: String(row.status || "pending_signature"),
          contractor_id: row.contractor != null ? String(row.contractor) : undefined,
          start_date: row.start_date != null ? String(row.start_date) : undefined,
          end_date: row.end_date != null ? String(row.end_date) : undefined,
          contract_url: row.contract_url ?? null,
          contract_file_url: row.contract_file_url ?? null,
          salary: row.salary != null ? Number(row.salary) : null,
        }));

        const contractorIds = mappedContracts
          .map((c) => c.contractor_id)
          .filter((id): id is string => Boolean(id));

        const uniqueIds = Array.from(new Set(contractorIds));
        let nameMap: Record<string, string> = {};

        if (uniqueIds.length > 0) {
          const { data: emps, error: empError } = await supabase
            .from("employee")
            .select("employee_id, first_name, last_name")
            .or(
              uniqueIds.map((id) => `employee_id.eq.${id}`).join(",")
            );

          if (!empError && emps) {
            emps.forEach((e) => {
              if (e.employee_id) {
                const fullName = `${(e.first_name || "").trim()} ${(e.last_name || "").trim()}`.trim();
                if (fullName) {
                  nameMap[e.employee_id] = fullName;
                }
              }
            });
          }
        }

        const resolvedContracts: Contract[] = mappedContracts.map((c) => {
          const contractorId = c.contractor_id;
          const resolvedName = contractorId
            ? nameMap[contractorId] || `Employee ${contractorId.slice(0, 8)}`
            : undefined;

          return {
            ...c,
            contractor_name: resolvedName,
          };
        });

        setContracts(resolvedContracts);
      } catch (err) {
        console.error("[MobileAI] Contracts load error:", err);
        Alert.alert("Error", "Failed to load contracts.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E0977" />
        <Text style={styles.loadingText}>Loading contracts...</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Contract }) => {
    const name = item.contractor_name || "Unknown";
    const initials = name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    return (
      <Card>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.cardTitles}>
            <Text style={styles.contractTitle} numberOfLines={2}>
              {item.contract_title}
            </Text>
            <StatusBadge status={item.status.toLowerCase().replace(" ", "_") as Status} />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsGrid}>
          <DetailRow label="Contractor" value={name} />
          {item.salary != null && <DetailRow label="Salary" value={`₱${item.salary.toLocaleString()}`} />}
          {item.start_date ? (
            <DetailRow label="Start Date" value={item.start_date} />
          ) : null}
          {item.end_date ? (
            <DetailRow label="End Date" value={item.end_date} />
          ) : null}
          {item.contract_url ? (
            <DetailRow label="Contract URL" value={item.contract_url} />
          ) : null}
          {item.contract_file_url ? (
            <DetailRow label="File URL" value={item.contract_file_url} />
          ) : null}
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <MenuDropdown />

      <ScrollView showsVerticalScrollIndicator={false}>
        <FlatList
          data={contracts}
          keyExtractor={(item) => item.contract_id}
          scrollEnabled={false}
          renderItem={renderItem}
          contentContainerStyle={{ gap: 8 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No contracts found.</Text>
            </View>
          }
        />
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={1}>
        {value || "-"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 16,
    backgroundColor: "#fff",
  },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: "#fff" },
  loadingText: { fontSize: 14, color: "#6B7280" },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#1E0977", fontSize: 14, fontWeight: "700" },
  cardTitles: { flex: 1, gap: 4 },
  contractTitle: { fontSize: 15, fontWeight: "700", color: "#111827", flex: 1 },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 10,
  },
  detailsGrid: {
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  detailLabel: { fontSize: 12, fontWeight: "600", color: "#6B7280", width: 100 },
  detailValue: { fontSize: 13, color: "#111827", flex: 1, textAlign: "right", marginLeft: 12 },
  emptyState: { alignItems: "center", paddingTop: 40 },
  emptyText: { fontSize: 14, color: "#9CA3AF" },
});
