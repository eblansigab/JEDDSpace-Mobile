import { useEffect, useState } from "react";
import { FlatList, ScrollView, StyleSheet, Text, View, TouchableOpacity, Modal, TextInput } from "react-native";
import { supabase } from "../../lib/supabase";
import Card from "@/components/card";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/lib/AuthContext";
import { Alert } from "react-native";
import { isAdmin } from "@/lib/rbac";
import { getSeenAnnouncementIds, markAnnouncementAsSeen, getAnnouncementReactions, getAnnouncementReactionCounts, toggleAnnouncementReaction, ReactionKey, ReactionState, ReactionCounts, ReactionResult } from "@/services/reactionService";
import ReactionBar from "@/components/ReactionBar";

export const ANNOUNCEMENT_STATUSES = ["Published", "Draft", "Archived"];

type Announcement = {
  announcement_id: string;
  title: string;
  body: string;
  status: string;
  created_at: string | null;
  created_by?: string;
};

type AnnouncementForm = {
  title: string;
  body: string;
  status: string;
};

export function AnnouncementsView({ searchQuery = "" }: { searchQuery?: string }) {
  const { colors } = useTheme();
  const { employee } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editStatus, setEditStatus] = useState("Published");
  const [isSaving, setIsSaving] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [reactions, setReactions] = useState<Record<string, ReactionState>>({});
  const [reactionCounts, setReactionCounts] = useState<Record<string, ReactionCounts>>({});
  const [reactionLoading, setReactionLoading] = useState(false);

  const admin = isAdmin(employee);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const [ids, announcements] = await Promise.all([
          getSeenAnnouncementIds(),
          supabase.from("announcement").select("*").order("created_at", { ascending: false }),
        ]);

        if (!isMounted) return;

        setSeenIds(new Set(ids));

        if (announcements.error) throw announcements.error;

        const mapped: Announcement[] = (announcements.data || []).map((row: Record<string, unknown>) => ({
          announcement_id: String(row.announcement_id || row.id || ""),
          title: String(row.title || "Untitled"),
          body: row.body ? String(row.body) : "",
          status: String(row.status || "Published"),
          created_at: row.created_at ? String(row.created_at) : null,
          created_by: row.created_by ? String(row.created_by) : undefined,
        }));

        const reactionEntries = await Promise.all(
          mapped.map(async (item) => {
            const [reactionMap, countMap] = await Promise.all([
              getAnnouncementReactions(item.announcement_id),
              getAnnouncementReactionCounts(item.announcement_id),
            ]);
            return [item.announcement_id, reactionMap, countMap] as const;
          })
        );

        if (isMounted) {
          const reactionMap: Record<string, ReactionState> = {};
          const countMap: Record<string, ReactionCounts> = {};
          reactionEntries.forEach(([id, reactions, counts]) => {
            reactionMap[id] = reactions;
            countMap[id] = counts;
          });
          setReactions(reactionMap);
          setReactionCounts(countMap);
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

  const markAsSeen = async (announcementId: string) => {
    const updated = await markAnnouncementAsSeen(announcementId);
    setSeenIds(new Set(updated));
  };

  const toggleReaction = async (announcementId: string, reaction: ReactionKey): Promise<ReactionResult> => {
    setReactionLoading(true);
    try {
      const result = await toggleAnnouncementReaction(announcementId, reaction);
      setReactions((prev) => ({ ...prev, [announcementId]: result.mine }));
      setReactionCounts((prev) => ({ ...prev, [announcementId]: result.counts }));
      return result;
    } finally {
      setReactionLoading(false);
    }
  };

  const handlePressAnnouncement = (item: Announcement) => {
    void markAsSeen(item.announcement_id);
  };

  const openEditModal = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setEditTitle(announcement.title || "");
    setEditBody(announcement.body || "");
    setEditStatus(announcement.status || "Published");
  };

  const closeEditModal = () => {
    setEditingAnnouncement(null);
    setEditTitle("");
    setEditBody("");
    setEditStatus("Published");
  };

  const handleSaveEdit = async () => {
    if (!editingAnnouncement) return;

    if (!editTitle.trim() || !editBody.trim()) {
      Alert.alert("Missing Details", "Please complete the title and body.");
      return;
    }

    setIsSaving(true);
    try {
      const { error: updateError } = await supabase
        .from("announcement")
        .update({
          title: editTitle.trim(),
          body: editBody.trim(),
          status: editStatus,
        })
        .eq("announcement_id", Number(editingAnnouncement.announcement_id));

      if (updateError) throw updateError;

      Alert.alert("Success", "Announcement updated successfully.");
      closeEditModal();
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.announcement_id === editingAnnouncement.announcement_id
            ? { ...a, title: editTitle.trim(), body: editBody.trim(), status: editStatus }
            : a
        )
      );
    } catch (err) {
      console.error("[MobileAI] Update announcement error:", err);
      Alert.alert("Error", "Unable to update announcement.");
    } finally {
      setIsSaving(false);
    }
  };

   const visibleAnnouncements = admin ? announcements : announcements.filter((item) => (item.status || "Published") === "Published");

  const q = searchQuery.trim().toLowerCase();
  const filtered = visibleAnnouncements.filter((item) => {
    const matchesStatus = statusFilter === "All" || (item.status || "Published") === statusFilter;
    const matchesQuery =
      !q ||
      item.title.toLowerCase().includes(q) ||
      (item.body || "").toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

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

  if (filtered.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="search-outline" size={40} color={colors.textMuted} />
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>No matching announcements.</Text>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Published":
        return "#059669";
      case "Draft":
        return "#D97706";
      case "Archived":
        return "#64748b";
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View>
      {admin && (
        <View style={styles.filterRow}>
          {ANNOUNCEMENT_STATUSES.map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                statusFilter === status && { backgroundColor: colors.primary },
                statusFilter !== status && { borderColor: colors.border, borderWidth: 1 },
              ]}
              onPress={() => setStatusFilter(status)}
            >
              <Text style={[styles.filterChipText, statusFilter === status && { color: "#fff" }, statusFilter !== status && { color: colors.text }]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
          {statusFilter !== "All" && (
            <TouchableOpacity onPress={() => setStatusFilter("All")}>
              <Text style={[styles.clearFilterText, { color: colors.primary }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.announcement_id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isUnread = !seenIds.has(item.announcement_id);
          return (
            <TouchableOpacity onPress={() => handlePressAnnouncement(item)} activeOpacity={0.7}>
              <Card style={[styles.card, isUnread && styles.unreadCard]}>
                <View style={styles.header}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {isUnread && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
                    {admin && (
                      <TouchableOpacity onPress={() => openEditModal(item)} hitSlop={8}>
                        <Text style={[styles.editBtn, { color: colors.primary }]}>Edit</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                      {item.created_by || "Company"}
                    </Text>
                    <View style={[styles.metaDot, { backgroundColor: colors.border }]} />
                    <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                      {item.created_at ? formatDate(item.created_at) : ""}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
                      <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                    </View>
                  </View>
                </View>
                {item.body ? <View style={[styles.divider, { backgroundColor: colors.border }]} /> : null}
                {item.body ? (
                  <Text style={[styles.body, { color: colors.textSecondary }]} numberOfLines={4}>
                    {item.body}
                  </Text>
                ) : null}
                <ReactionBar reactions={reactions[item.announcement_id] || {}} counts={reactionCounts[item.announcement_id] || {}} onToggle={(reaction) => toggleReaction(item.announcement_id, reaction)} loading={reactionLoading} />
              </Card>
            </TouchableOpacity>
          );
        }}
      />

      {/* Edit Modal */}
      <Modal visible={Boolean(editingAnnouncement)} animationType="slide" onRequestClose={closeEditModal}>
        <View style={[styles.modalScreen, { backgroundColor: colors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={closeEditModal} hitSlop={12}>
              <Text style={[styles.backBtn, { color: colors.primary }]}>← Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveEdit} hitSlop={12} disabled={isSaving}>
              <Text style={[styles.saveBtn, { color: isSaving ? colors.textMuted : colors.primary }]}>
                {isSaving ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <Text style={[styles.modalLabel, { color: colors.text }]}>Title</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Enter announcement title"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.modalLabel, { color: colors.text }]}>Content</Text>
            <TextInput
              style={[styles.modalTextArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              value={editBody}
              onChangeText={setEditBody}
              placeholder="Write your announcement here..."
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />

            <Text style={[styles.modalLabel, { color: colors.text }]}>Status</Text>
            <View style={styles.statusPickerRow}>
              {ANNOUNCEMENT_STATUSES.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusChip,
                    editStatus === status && { backgroundColor: colors.primary },
                    editStatus !== status && { borderColor: colors.border, borderWidth: 1 },
                  ]}
                  onPress={() => setEditStatus(status)}
                >
                  <Text style={[styles.statusChipText, editStatus === status && { color: "#fff" }, editStatus !== status && { color: colors.text }]}>
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
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
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  editBtn: {
    fontSize: 13,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
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
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: "auto",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  modalScreen: {
    flex: 1,
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backBtn: {
    fontSize: 15,
    fontWeight: "600",
  },
  saveBtn: {
    fontSize: 15,
    fontWeight: "700",
  },
  modalBody: {
    padding: 20,
    gap: 16,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
  },
  modalTextArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    height: 160,
  },
  statusPickerRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
