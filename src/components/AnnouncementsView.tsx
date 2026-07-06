import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";
import Card from "@/components/card";
import { Ionicons } from "@react-native-vector-icons/ionicons";

type Announcement = {
  announcement_id?: string;
  id?: string;
  title: string;
  body?: string;
  description?: string;
  created_at?: string | null;
  sender?: string;
  isUnread?: boolean;
};

export function AnnouncementsView({ searchQuery = "" }: { searchQuery?: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("announcement")
          .select("*")
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;

        const mapped: Announcement[] = (data || []).map((row: Record<string, unknown>) => ({
          announcement_id: String(row.announcement_id || row.id || ""),
          title: String(row.title || "Untitled"),
          body: row.body ? String(row.body) : row.description ? String(row.description) : "",
          created_at: row.created_at ? String(row.created_at) : null,
          sender: row.sender ? String(row.sender) : row.created_by ? String(row.created_by) : "Company",
          isUnread: Boolean(row.is_unread ?? row.isUnread ?? false),
        }));

        if (isMounted) {
          setAnnouncements(mapped);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error("[MobileAI] Announcements load error:", err);
          setError("Failed to load announcements.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerText}>Loading announcements...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (announcements.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="megaphone-outline" size={40} color="#9CA3AF" />
        <Text style={styles.emptyText}>No announcements yet.</Text>
      </View>
    );
  }

  const q = searchQuery.trim().toLowerCase();
  const filtered = q
    ? announcements.filter((a) =>
        a.title.toLowerCase().includes(q) ||
        (a.body || "").toLowerCase().includes(q) ||
        (a.sender || "").toLowerCase().includes(q)
      )
    : announcements;

  if (filtered.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="search-outline" size={40} color="#9CA3AF" />
        <Text style={styles.emptyText}>No matching announcements.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.announcement_id || item.id || Math.random().toString()}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <Card style={[styles.card, item.isUnread && styles.unreadCard]}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              {item.isUnread && <View style={styles.unreadDot} />}
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="person-outline" size={14} color="#6B7280" />
              <Text style={styles.metaText}>{item.sender}</Text>
              {item.created_at ? (
                <>
                  <View style={styles.metaDot} />
                  <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                  <Text style={styles.metaText}>{formatDate(item.created_at)}</Text>
                </>
              ) : null}
            </View>
          </View>
          {item.body ? (
            <View style={styles.divider} />
          ) : null}
          {item.body ? (
            <Text style={styles.body} numberOfLines={4}>
              {item.body}
            </Text>
          ) : null}
        </Card>
      )}
    />
  );
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

const styles = StyleSheet.create({
  listContent: {
    gap: 10,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#1E0977",
    backgroundColor: "#F9FAFB",
  },
  header: {
    gap: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1E0977",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 10,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: "#374151",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 8,
  },
  centerText: {
    fontSize: 14,
    color: "#6B7280",
  },
  errorText: {
    fontSize: 14,
    color: "#EF4444",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
  },
});
