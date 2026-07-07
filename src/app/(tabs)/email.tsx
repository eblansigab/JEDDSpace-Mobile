import { useTheme } from "@/context/ThemeContext";
import MenuDropdown from "@/components/menuDropdown";
import { supabase } from "@/lib/supabase";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type EmailRow = {
  email_id: number;
  sender_id: number;
  recipient_email: string;
  subject: string;
  message_body: string;
  folder: string;
  is_read: boolean;
  created_at: string;
  deleted_by_sender: boolean;
  deleted_by_recipient: boolean;
  reply_to_email_id: number | null;
  thread_id: number | null;
};

type Tab = "inbox" | "unread" | "sent";
type EmployeeOption = { employee_id: number; first_name: string; last_name: string; email: string };

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = ["#4F46E5", "#0891B2", "#059669", "#D97706", "#DC2626"];

export default function Emails() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<EmailRow | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [showRecipientPicker, setShowRecipientPicker] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [recipientQuery, setRecipientQuery] = useState("");
  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [employeeLoading, setEmployeeLoading] = useState(true);
  const [myEmployeeId, setMyEmployeeId] = useState<number | null>(null);
  const [myEmail, setMyEmail] = useState<string | null>(null);
  const [nameMap, setNameMap] = useState<Record<number, string>>({});
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user?.id || !isMounted) return;

        const { data: me } = await supabase
          .from("employee")
          .select("employee_id, email")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (me && isMounted) {
          setMyEmployeeId(Number(me.employee_id));
          setMyEmail(me.email || session.user.email || null);
        }
      } catch (err) {
        console.error("[MobileAI] Email employee lookup error:", err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("employee")
          .select("employee_id, first_name, last_name, email")
          .neq("is_archived", true)
          .order("first_name", { ascending: true });

        if (!error && data && isMounted) {
          const opts = data as EmployeeOption[];
          setEmployees(opts);
          const map: Record<number, string> = {};
          opts.forEach((e) => {
            const full = `${e.first_name || ""} ${e.last_name || ""}`.trim();
            if (full && e.employee_id) map[e.employee_id] = full;
          });
          setNameMap(map);
        }
      } catch (err) {
        console.error("[MobileAI] Employee directory error:", err);
      } finally {
        if (isMounted) setEmployeeLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const loadEmails = async () => {
    if (!myEmployeeId || !myEmail) return;
    setLoading(true);
    try {
      let query = supabase.from("email").select("*").order("created_at", { ascending: false });

      if (activeTab === "inbox") {
        query = query.eq("recipient_email", myEmail).eq("deleted_by_recipient", false);
      } else if (activeTab === "sent") {
        query = query.eq("sender_id", myEmployeeId).eq("deleted_by_sender", false);
        } else if (activeTab === "unread") {
          query = query.eq("recipient_email", myEmail).eq("is_read", false).eq("deleted_by_recipient", false);
        }

      const { data, error } = await query;
      if (error) throw error;
      const rows = (data || []) as EmailRow[];
      setEmails(rows);
    } catch (err) {
      console.error("[MobileAI] Email load error:", err);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadEmails();
  }, [activeTab, myEmployeeId, myEmail]);

  useEffect(() => {
    if (!myEmail) return;

    const channel = supabase
      .channel('email-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'email',
          filter: `recipient_email=eq.${myEmail}`
        },
        (payload) => {
          const newEmail = payload.new as EmailRow;
          setEmails((prev) => {
            if (prev.some((e) => e.email_id === newEmail.email_id)) return prev;
            const next = [newEmail, ...prev];
            if (activeTab !== 'inbox') {
              return prev;
            }
            return next;
          });
          Alert.alert('New Message', `You received a new message: ${newEmail.subject}`);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myEmail, activeTab]);

  const filteredEmails = emails.filter((e) => {
    const senderName = nameMap[e.sender_id] || `Employee ${e.sender_id}`;
    const matchesSearch =
      senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.subject || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const inboxUnreadCount = emails.filter((e) => !e.is_read).length;
  const sentCount = emails.filter((e) => e.sender_id === myEmployeeId && !e.deleted_by_sender).length;

  const markAsRead = async (emailId: number) => {
    try {
      await supabase.from("email").update({ is_read: true }).eq("email_id", emailId);
      setEmails((prev) =>
        prev.map((e) => (e.email_id === emailId ? { ...e, is_read: true } : e))
      );
    } catch (err) {
      console.error("[MobileAI] Mark as read error:", err);
    }
  };

  const handleSelectEmail = (email: EmailRow) => {
    if (!email.is_read) {
      void markAsRead(email.email_id);
    }
    setSelectedEmail({ ...email, is_read: true });
  };

  const resetCompose = () => {
    setRecipientEmail("");
    setRecipientName("");
    setSubject("");
    setBody("");
    setShowCompose(false);
    setShowRecipientPicker(false);
    setRecipientQuery("");
  };

  const handleSend = async () => {
    if (!recipientEmail || !subject.trim() || !body.trim() || !myEmployeeId) {
      Alert.alert("Validation", "Please select a recipient, subject, and message body.");
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from("email").insert({
        sender_id: myEmployeeId,
        recipient_email: recipientEmail,
        subject: subject.trim(),
        message_body: body.trim(),
        folder: "inbox",
        is_read: false,
        deleted_by_sender: false,
        deleted_by_recipient: false,
      });

      if (error) throw error;
      Alert.alert("Success", "Message sent successfully.");
      resetCompose();
      await loadEmails();
    } catch (err) {
      console.error("[MobileAI] Send message error:", err);
      const message = err instanceof Error ? err.message : String(err);
      Alert.alert("Error", `Failed to send message: ${message}`);
    } finally {
      setSending(false);
    }
  };

  const handleReply = () => {
    if (!selectedEmail) return;
    const senderName = nameMap[selectedEmail.sender_id] || `Employee ${selectedEmail.sender_id}`;
    const replySubject = selectedEmail.subject.startsWith("Re: ")
      ? selectedEmail.subject
      : `Re: ${selectedEmail.subject}`;

    setRecipientEmail(
      employees.find((e) => `${e.first_name} ${e.last_name}`.trim() === senderName)?.email || ""
    );
    setRecipientName(senderName);
    setSubject(replySubject);
    setBody("");
    setShowCompose(true);
    setSelectedEmail(null);
  };

  const TABS: { key: Tab; label: string; icon: string; count?: number }[] = [
    { key: "inbox", label: "Inbox", icon: "📥", count: inboxUnreadCount || undefined },
    { key: "unread", label: "Unread", icon: "🔵", count: inboxUnreadCount || undefined },
    { key: "sent", label: "Sent", icon: "📤", count: sentCount || undefined },
  ];

  const filteredEmployees = recipientQuery.trim()
    ? employees.filter((e) => e.email.toLowerCase().includes(recipientQuery.trim().toLowerCase()))
    : employees;

  const renderItem = ({ item, index }: { item: EmailRow; index: number }) => {
    const senderName = nameMap[item.sender_id] || `Employee ${item.sender_id}`;
    const initials = getInitials(senderName);
    const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString() : "";

    return (
      <TouchableOpacity
        style={[styles.emailRow, !item.is_read && styles.emailRowUnread]}
        onPress={() => handleSelectEmail(item)}
        activeOpacity={0.7}
      >
        {!item.is_read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
        <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.emailContent}>
          <View style={styles.emailTopRow}>
            <Text style={[styles.senderName, !item.is_read && styles.bold]} numberOfLines={1}>
              {senderName}
            </Text>
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>
          <Text style={[styles.subjectText, !item.is_read && styles.subjectBold]} numberOfLines={1}>
            {item.subject}
          </Text>
          <Text style={styles.previewText} numberOfLines={1}>
            {item.message_body}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MenuDropdown />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Messages</Text>
        <TouchableOpacity
          style={[styles.composeBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowCompose(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.composeBtnText, { color: "#fff" }]}>✏  Compose</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search messages..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={8}>
            <Text style={[styles.clearIcon, { color: colors.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={[styles.tabSidebar, { borderColor: colors.border }]}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive, { color: colors.text }]}>
              {tab.label}
            </Text>
            {tab.count !== undefined && tab.count > 0 && (
              <View style={[styles.badgeFilled, { backgroundColor: colors.primary }]}>
                <Text style={[styles.badgeText, { color: "#fff" }]}>{tab.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Email list */}
      <FlatList
        data={filteredEmails}
        keyExtractor={(item) => String(item.email_id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          filteredEmails.length === 0
            ? styles.emptyContainer
            : { paddingBottom: 24 }
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✉️</Text>
            <Text style={styles.emptyText}>No messages here.</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
        renderItem={renderItem}
        ListHeaderComponent={<View style={{ height: 8 }} />}
        refreshing={loading}
        onRefresh={loadEmails}
      />

      {/* Read Email Modal */}
      <Modal visible={!!selectedEmail} animationType="slide" onRequestClose={() => setSelectedEmail(null)}>
        <View style={[styles.modalScreen, { backgroundColor: colors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setSelectedEmail(null)} hitSlop={12}>
              <Text style={[styles.backBtn, { color: colors.primary }]}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleReply} hitSlop={12}>
              <Text style={[styles.replyBtn, { color: colors.primary }]}>Reply</Text>
            </TouchableOpacity>
          </View>
          {selectedEmail && (
            <ScrollView contentContainerStyle={styles.emailDetail}>
              <Text style={[styles.detailSubject, { color: colors.text }]}>{selectedEmail.subject}</Text>
              <View style={styles.detailMeta}>
                <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[selectedEmail.sender_id % AVATAR_COLORS.length] }]}>
                  <Text style={styles.avatarText}>{getInitials(nameMap[selectedEmail.sender_id] || "Unknown")}</Text>
                </View>
                <View>
                  <Text style={[styles.detailSender, { color: colors.text }]}>{nameMap[selectedEmail.sender_id] || `Employee ${selectedEmail.sender_id}`}</Text>
                  <Text style={[styles.detailDate, { color: colors.textMuted }]}>
                    {selectedEmail.created_at ? new Date(selectedEmail.created_at).toLocaleString() : ""}
                  </Text>
                </View>
              </View>
              <View style={[styles.detailDivider, { backgroundColor: colors.border }]} />
              <Text style={[styles.detailBody, { color: colors.textSecondary }]}>{selectedEmail.message_body}</Text>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Compose Modal */}
      <Modal visible={showCompose} animationType="slide" transparent onRequestClose={resetCompose}>
        <KeyboardAvoidingView
          style={styles.composeOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable style={styles.composeBackdrop} onPress={resetCompose} />
          <View style={[styles.composeSheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.composeHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.composeTitle, { color: colors.text }]}>{subject.startsWith("Re:") ? "Reply" : "New Internal Message"}</Text>
              <TouchableOpacity onPress={resetCompose} hitSlop={12}>
                <Text style={[styles.composeClose, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.composeBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Recipient */}
              <Text style={[styles.composeLabel, { color: colors.text }]}>Recipient Employee</Text>
              <TouchableOpacity
                style={[styles.recipientSelector, { borderColor: colors.border, backgroundColor: colors.background }]}
                onPress={() => setShowRecipientPicker((p) => !p)}
                activeOpacity={0.8}
              >
                <Text style={[recipientName ? styles.recipientSelected : styles.recipientPlaceholder, { color: recipientName ? colors.text : colors.textMuted }]}>
                  {recipientName || "-- Select Recipient --"}
                </Text>
                <Text style={[styles.chevron, { color: colors.textSecondary }]}>{showRecipientPicker ? "▲" : "▼"}</Text>
              </TouchableOpacity>

              {showRecipientPicker && (
                <View style={[styles.recipientPickerContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <View style={[styles.recipientSearchWrap, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
                    <Text style={styles.recipientSearchIcon}>🔍</Text>
                    <TextInput
                      style={[styles.recipientSearchInput, { color: colors.text }]}
                      placeholder="Search employees..."
                      placeholderTextColor={colors.textMuted}
                      value={recipientQuery}
                      onChangeText={setRecipientQuery}
                    />
                  </View>
                  <ScrollView style={styles.recipientList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                    {employeeLoading ? (
                      <View style={styles.recipientLoading}>
                        <Text style={styles.recipientLoadingText}>Loading employees...</Text>
                      </View>
                    ) : filteredEmployees.length === 0 ? (
                      <View style={styles.recipientEmpty}>
                        <Text style={styles.recipientEmptyText}>No employees found.</Text>
                      </View>
                    ) : (
                      filteredEmployees.map((emp) => {
                        const fullName = `${emp.first_name || ""} ${emp.last_name || ""}`.trim();
                        const label = fullName || "Unnamed";
                        const initials = getInitials(label);
                        return (
                          <TouchableOpacity
                            key={emp.employee_id}
                            style={[styles.recipientOption, { borderBottomColor: colors.border }]}
                            onPress={() => {
                              setRecipientEmail(emp.email);
                              setRecipientName(label);
                              setShowRecipientPicker(false);
                              setRecipientQuery("");
                            }}
                          >
                            <View style={[styles.recipientAvatar, { backgroundColor: AVATAR_COLORS[emp.employee_id % AVATAR_COLORS.length] }]}>
                              <Text style={styles.avatarText}>{initials}</Text>
                            </View>
                            <Text style={[styles.recipientOptionText, { color: colors.text }]}>{label}</Text>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </ScrollView>
                </View>
              )}

              <Text style={[styles.composeLabel, { color: colors.text }]}>Subject</Text>
              <TextInput
                style={[styles.composeInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="Enter subject"
                placeholderTextColor={colors.textMuted}
                value={subject}
                onChangeText={setSubject}
              />

              <Text style={[styles.composeLabel, { color: colors.text }]}>Message Body</Text>
              <TextInput
                style={[styles.composeTextArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="Write your message here..."
                placeholderTextColor={colors.textMuted}
                value={body}
                onChangeText={setBody}
                multiline
                textAlignVertical="top"
              />

              <View style={styles.composeActions}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: colors.border }]}
                  onPress={resetCompose}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
                  onPress={handleSend}
                  disabled={sending}
                  activeOpacity={0.8}
                >
                  {sending ? (
                    <Text style={styles.sendBtnText}>Sending...</Text>
                  ) : (
                    <Text style={styles.sendBtnText}>{subject.startsWith("Re:") ? "Reply" : "Send"}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 24, gap: 12 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pageTitle: { fontSize: 22, fontWeight: "700" },
  composeBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  composeBtnText: { fontSize: 13, fontWeight: "600", color: "#fff" },
  searchWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchIcon: { fontSize: 13 },
  searchInput: { flex: 1, fontSize: 14 },
  clearIcon: { fontSize: 12, fontWeight: "600" },
  tabSidebar: { borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  tabItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, gap: 10, borderBottomWidth: 1 },
  tabItemActive: { backgroundColor: "#EEF2FF" },
  tabIcon: { fontSize: 16, width: 22, textAlign: "center" },
  tabLabel: { flex: 1, fontSize: 14, fontWeight: "500" },
  tabLabelActive: { color: "#1E0977", fontWeight: "700" },
  badgeFilled: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, minWidth: 24, alignItems: "center" },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  emptyContainer: { flex: 1 },
  emptyState: { alignItems: "center", justifyContent: "center", gap: 8, paddingTop: 60 },
  emptyIcon: { fontSize: 32 },
  emptyText: { fontSize: 14 },
  separator: { height: 1, marginLeft: 72 },
  emailRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 4, gap: 12, position: "relative" },
  emailRowUnread: { },
  unreadDot: { position: "absolute", left: -8, width: 6, height: 6, borderRadius: 3, top: "50%" },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  avatarText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  emailContent: { flex: 1, gap: 2 },
  emailTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  senderName: { fontSize: 14, fontWeight: "500", flex: 1 },
  bold: { fontWeight: "700" },
  dateText: { fontSize: 11, marginLeft: 8 },
  subjectText: { fontSize: 13 },
  subjectBold: { fontWeight: "600" },
  previewText: { fontSize: 12 },
  modalScreen: { flex: 1 },
  modalHeader: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  backBtn: { fontSize: 15, fontWeight: "600" },
  replyBtn: { fontSize: 15, fontWeight: "700" },
  emailDetail: { padding: 20, gap: 16 },
  detailSubject: { fontSize: 20, fontWeight: "700" },
  detailMeta: { flexDirection: "row", alignItems: "center", gap: 12 },
  detailSender: { fontSize: 14, fontWeight: "600" },
  detailDate: { fontSize: 12, marginTop: 2 },
  detailDivider: { height: 1 },
  detailBody: { fontSize: 15, lineHeight: 24 },
  composeOverlay: { flex: 1, justifyContent: "flex-end" },
  composeBackdrop: { ...(StyleSheet.absoluteFill as any), backgroundColor: "rgba(0,0,0,0.4)" },
  composeSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "90%", shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 16 },
  composeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1 },
  composeTitle: { fontSize: 16, fontWeight: "700" },
  composeClose: { fontSize: 16, fontWeight: "600" },
  composeBody: { padding: 20, gap: 10, paddingBottom: 32 },
  composeLabel: { fontSize: 13, fontWeight: "600" },
  composeInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14 },
  composeTextArea: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, height: 160 },
  recipientSelector: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  recipientPlaceholder: { fontSize: 14 },
  recipientSelected: { fontSize: 14, fontWeight: "500" },
  chevron: { fontSize: 10 },
  recipientPickerContainer: { borderWidth: 1, borderRadius: 8, overflow: "hidden", marginTop: -4, maxHeight: 320 },
  recipientSearchWrap: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  recipientSearchIcon: { fontSize: 14 },
  recipientSearchInput: { flex: 1, fontSize: 14, paddingVertical: 4 },
  recipientList: { maxHeight: 240 },
  recipientLoading: { paddingVertical: 16, alignItems: "center" },
  recipientLoadingText: { fontSize: 13 },
  recipientEmpty: { paddingVertical: 16, alignItems: "center" },
  recipientEmptyText: { fontSize: 13 },
  recipientOption: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 11, borderBottomWidth: 1 },
  recipientAvatar: { width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  recipientOptionText: { fontSize: 14 },
  composeActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  cancelBtnText: { fontSize: 14, fontWeight: "600" },
  sendBtn: { flex: 1, backgroundColor: "#1E0977", borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
