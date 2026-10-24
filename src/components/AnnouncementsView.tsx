import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../lib/supabase";
import Card from "@/components/card";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useTheme } from "@/context/ThemeContext";
import { getCurrentEmployeeId } from "@/lib/AuthContext";
import ReactionBar, { ReactionCounts, ReactionOption, ReactionResult, ReactionState } from "@/components/ReactionBar";
import { getAnnouncementReactionData, toggleAnnouncementReaction } from "@/services/reactionService";

export const ANNOUNCEMENT_REACTION_OPTIONS: ReactionOption[] = [
  { key: "acknowledged", emoji: "👍", label: "Acknowledged" },
  { key: "appreciated", emoji: "❤️", label: "Appreciated" },
  { key: "important", emoji: "⭐", label: "Important" },
  { key: "confirmed", emoji: "✅", label: "Confirmed" },
  { key: "question", emoji: "❓", label: "Question" },
];

type Announcement = {
  announcement_id?: string;
  id?: string;
  title: string;
  body?: string;
  description?: string;
  status?: string;
  visibility_scope?: string | null;
  visibility_target?: string | null;
  created_at?: string | null;
  sender?: string;
  isUnread?: boolean;
};

export function AnnouncementsView({ searchQuery = "" }: { searchQuery?: string }) {
  const { colors } = useTheme();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, ReactionState>>({});
  const [reactionCounts, setReactionCounts] = useState<Record<string, ReactionCounts>>({});
  const [reactionLoading, setReactionLoading] = useState<Record<string, string | null>>({});

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("announcement")
          .select("*")
          .eq("status", "Published")
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;

        const mapped: Announcement[] = (data || []).map((row: Record<string, unknown>) => ({
          announcement_id: String(row.announcement_id || row.id || ""),
          title: String(row.title || "Untitled"),
          body: row.body ? String(row.body) : row.description ? String(row.description) : "",
          status: String(row.status || "Published"),
          visibility_scope: row.visibility_scope ? String(row.visibility_scope) : null,
          visibility_target: row.visibility_target ? String(row.visibility_target) : null,
          created_at: row.created_at ? String(row.created_at) : null,
          sender: row.sender ? String(row.sender) : row.created_by ? String(row.created_by) : "Company",
          isUnread: Boolean(row.is_unread ?? row.isUnread ?? false),
        }));

        const reactionData = await getAnnouncementReactionData(mapped.map((item) => item.announcement_id || item.id || ""));

        if (isMounted) {
          setAnnouncements(mapped);
          setReactions(reactionData.mine);
          setReactionCounts(reactionData.counts);
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

  const markAnnouncementViewed = async (announcementId: string) => {
    const employeeId = await getCurrentEmployeeId();
    const numericAnnouncementId = Number(announcementId);
    const numericEmployeeId = employeeId ? Number(employeeId) : NaN;

    if (!Number.isInteger(numericAnnouncementId) || !Number.isInteger(numericEmployeeId)) {
      return;
    }

    const { data: existing, error: lookupError } = await supabase
      .from("announcement_views")
      .select("announcement_view_id")
      .eq("announcement_id", numericAnnouncementId)
      .eq("employee_id", numericEmployeeId)
      .maybeSingle();

    if (lookupError) {
      console.error("[MobileAI] Announcement view lookup error:", lookupError);
      return;
    }

    if (existing) return;

    const { error: insertError } = await supabase.from("announcement_views").insert({
      announcement_id: numericAnnouncementId,
      employee_id: numericEmployeeId,
    });

    if (insertError) {
      console.error("[MobileAI] Announcement view insert error:", insertError);
    }
  };

  const toggleReaction = async (announcementId: string, reaction: string): Promise<ReactionResult> => {
    setReactionLoading((prev) => ({ ...prev, [announcementId]: reaction }));
    try {
      const result = await toggleAnnouncementReaction(announcementId, reaction);
      setReactions((prev) => ({ ...prev, [announcementId]: result.mine }));
      setReactionCounts((prev) => ({ ...prev, [announcementId]: result.counts }));
      return result;
    } finally {
      setReactionLoading((prev) => ({ ...prev, [announcementId]: null }));
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={[styles.centerText, { color: colors.textSecondary }]}>Loading announcements...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
      </View>
    );
  }

  if (announcements.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="megaphone-outline" size={40} color={colors.textMuted} />
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>No announcements yet.</Text>
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

  const getAudienceLabel = (item: Announcement) => {
    if (item.visibility_scope === "ORGANIZATION" && !item.visibility_target) return "BOTH";
    if (item.visibility_scope === "DEPARTMENT" && item.visibility_target?.trim()) {
      return item.visibility_target.trim().toUpperCase();
    }
    return null;
  };

  if (filtered.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="search-outline" size={40} color={colors.textMuted} />
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>No matching announcements.</Text>
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
        <TouchableOpacity onPress={() => void markAnnouncementViewed(item.announcement_id || item.id || "")} activeOpacity={0.7}>
          <Card style={[styles.card, item.isUnread && styles.unreadCard]}>
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.isUnread && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.sender}</Text>
                {item.created_at ? (
                  <>
                    <View style={[styles.metaDot, { backgroundColor: colors.border }]} />
                    <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{formatDate(item.created_at)}</Text>
                  </>
                ) : null}
                {getAudienceLabel(item) ? (
                  <View style={[styles.audienceBadge, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.audienceText, { color: colors.primary }]}>{getAudienceLabel(item)}</Text>
                  </View>
                ) : null}
                <View style={[styles.statusBadge, { backgroundColor: item.status === "Published" ? `${colors.success}20` : colors.background }]}>
                  <View style={[styles.statusDot, { backgroundColor: item.status === "Published" ? colors.success : colors.textMuted }]} />
                  <Text style={[styles.statusText, { color: item.status === "Published" ? colors.success : colors.textMuted }]}>{item.status}</Text>
                </View>
              </View>
            </View>
            {item.body ? <View style={[styles.divider, { backgroundColor: colors.border }]} /> : null}
            {item.body ? (
              <Text style={[styles.body, { color: colors.textSecondary }]} numberOfLines={4}>
                {item.body}
              </Text>
            ) : null}
            <ReactionBar
              options={ANNOUNCEMENT_REACTION_OPTIONS}
              reactions={reactions[item.announcement_id || item.id || ""] || {}}
              counts={reactionCounts[item.announcement_id || item.id || ""] || {}}
              onToggle={(reaction) => toggleReaction(item.announcement_id || item.id || "", reaction)}
              loadingReaction={reactionLoading[item.announcement_id || item.id || ""] ?? null}
            />
          </Card>
        </TouchableOpacity>
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
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  unreadCard: {
    borderLeftWidth: 4,
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
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "500",
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: "auto",
  },
  audienceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  audienceText: {
    fontSize: 10,
    fontWeight: "700",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 8,
  },
  centerText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
  },
});
