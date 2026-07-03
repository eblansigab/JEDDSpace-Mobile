import MenuDropdown from "@/components/menuDropdown";
import { supabase } from "@/lib/supabase";
import React, { useEffect, useState } from "react";
import {
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

type Email = {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  body: string;
  date: string;
  read: boolean;
  folder: "inbox" | "sent";
};

const emailList: Email[] = [
  {
    id: "1",
    sender: "UserfirstName UserlastName",
    subject: "asdasdsa",
    preview: "asdasdasdas",
    body: "asdasdasdas\n\nThis is the full body of the email.",
    date: "6/22/2026",
    read: false,
    folder: "inbox",
  },
  {
    id: "2",
    sender: "UserfirstName UserlastName",
    subject: "Important message",
    preview: "Happy late fathers day!",
    body: "Happy late fathers day!\n\nHope you had a great one.",
    date: "6/22/2026",
    read: false,
    folder: "inbox",
  },
  {
    id: "3",
    sender: "Danben Test1",
    subject: "testing mail",
    preview: "testing if this works",
    body: "testing if this works\n\nSeems like it does!",
    date: "6/22/2026",
    read: false,
    folder: "inbox",
  },
];

type Tab = "inbox" | "unread" | "sent";
type EmployeeOption = { employee_id: string; first_name: string; last_name: string };

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
  const [activeTab, setActiveTab] = useState<Tab>("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [showRecipientPicker, setShowRecipientPicker] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [recipientQuery, setRecipientQuery] = useState("");
  const [employeeLoading, setEmployeeLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("employee")
          .select("employee_id, first_name, last_name")
          .or("registration_status.is.null,registration_status.neq.rejected")
          .neq("is_archived", true)
          .order("first_name", { ascending: true });

        if (!error && data) {
          setEmployees(data as EmployeeOption[]);
        }
      } catch {
        // keep empty list on failure
      } finally {
        setEmployeeLoading(false);
      }
    })();
  }, []);

  const filteredEmployees = recipientQuery.trim()
    ? employees.filter((e) =>
        `${e.first_name} ${e.last_name}`.toLowerCase().includes(recipientQuery.trim().toLowerCase())
      )
    : employees;

  const filteredEmails = emailList.filter((e) => {
    const matchesTab =
      activeTab === "inbox"
        ? e.folder === "inbox"
        : activeTab === "unread"
        ? !e.read
        : e.folder === "sent";
    const matchesSearch =
      e.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const unreadCount = emailList.filter((e) => !e.read && e.folder === "inbox").length;
  const sentCount = emailList.filter((e) => e.folder === "sent").length;

  const resetCompose = () => {
    setRecipient("");
    setSubject("");
    setBody("");
    setShowCompose(false);
    setShowRecipientPicker(false);
  };

  const TABS: { key: Tab; label: string; icon: string; count?: number }[] = [
    { key: "inbox",  label: "Inbox",  icon: "📥", count: unreadCount },
    { key: "unread", label: "Unread", icon: "🔵" },
    { key: "sent",   label: "Sent",   icon: "📤", count: sentCount },
  ];

  return (
    <View style={styles.container}>
      <MenuDropdown />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Messages</Text>
        <TouchableOpacity
          style={styles.composeBtn}
          onPress={() => setShowCompose(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.composeBtnText}>✏  Compose</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={8}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs — sidebar-style like the web ref */}
      <View style={styles.tabSidebar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {tab.count !== undefined && (
              <View style={[styles.badge, tab.count > 0 ? styles.badgeFilled : styles.badgeEmpty]}>
                <Text style={[styles.badgeText, tab.count === 0 && styles.badgeTextMuted]}>
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Email list */}
      <FlatList
        data={filteredEmails}
        keyExtractor={(item) => item.id}
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
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.emailRow, !item.read && styles.emailRowUnread]}
            onPress={() => setSelectedEmail(item)}
            activeOpacity={0.7}
          >
            {!item.read && <View style={styles.unreadDot} />}
            <View
              style={[
                styles.avatar,
                { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] },
              ]}
            >
              <Text style={styles.avatarText}>{getInitials(item.sender)}</Text>
            </View>
            <View style={styles.emailContent}>
              <View style={styles.emailTopRow}>
                <Text
                  style={[styles.senderName, !item.read && styles.bold]}
                  numberOfLines={1}
                >
                  {item.sender}
                </Text>
                <Text style={styles.dateText}>{item.date}</Text>
              </View>
              <Text
                style={[styles.subjectText, !item.read && styles.subjectBold]}
                numberOfLines={1}
              >
                {item.subject}
              </Text>
              <Text style={styles.previewText} numberOfLines={1}>
                {item.preview}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* ── Read Email Modal ── */}
      <Modal
        visible={!!selectedEmail}
        animationType="slide"
        onRequestClose={() => setSelectedEmail(null)}
      >
        <View style={styles.modalScreen}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedEmail(null)} hitSlop={12}>
              <Text style={styles.backBtn}>← Back</Text>
            </TouchableOpacity>
          </View>
          {selectedEmail && (
            <ScrollView contentContainerStyle={styles.emailDetail}>
              <Text style={styles.detailSubject}>{selectedEmail.subject}</Text>
              <View style={styles.detailMeta}>
                <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[0] }]}>
                  <Text style={styles.avatarText}>{getInitials(selectedEmail.sender)}</Text>
                </View>
                <View>
                  <Text style={styles.detailSender}>{selectedEmail.sender}</Text>
                  <Text style={styles.detailDate}>{selectedEmail.date}</Text>
                </View>
              </View>
              <View style={styles.detailDivider} />
              <Text style={styles.detailBody}>{selectedEmail.body}</Text>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* ── Compose Modal ── */}
      <Modal
        visible={showCompose}
        animationType="slide"
        transparent
        onRequestClose={resetCompose}
      >
        <KeyboardAvoidingView
          style={styles.composeOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable style={styles.composeBackdrop} onPress={resetCompose} />
          <View style={styles.composeSheet}>
            {/* Compose header */}
            <View style={styles.composeHeader}>
              <Text style={styles.composeTitle}>New Internal Message</Text>
              <TouchableOpacity onPress={resetCompose} hitSlop={12}>
                <Text style={styles.composeClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.composeBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Recipient */}
              <Text style={styles.composeLabel}>Recipient Employee</Text>
              <TouchableOpacity
                style={styles.recipientSelector}
                onPress={() => setShowRecipientPicker((p) => !p)}
                activeOpacity={0.8}
              >
                <Text style={recipient ? styles.recipientSelected : styles.recipientPlaceholder}>
                  {recipient || "-- Select Recipient --"}
                </Text>
                <Text style={styles.chevron}>{showRecipientPicker ? "▲" : "▼"}</Text>
              </TouchableOpacity>

              {showRecipientPicker && (
                <View style={styles.recipientPickerContainer}>
                  <View style={styles.recipientSearchWrap}>
                    <Text style={styles.recipientSearchIcon}>🔍</Text>
                    <TextInput
                      style={styles.recipientSearchInput}
                      placeholder="Search employees..."
                      placeholderTextColor="#9CA3AF"
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
                        const fullName = `${emp.first_name} ${emp.last_name}`;
                        const label = fullName.trim() || "Unnamed";
                        const initials = label
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase();

                        return (
                          <TouchableOpacity
                            key={emp.employee_id}
                            style={styles.recipientOption}
                            onPress={() => {
                              setRecipient(label);
                              setShowRecipientPicker(false);
                              setRecipientQuery("");
                            }}
                          >
                            <View style={[styles.recipientAvatar, { backgroundColor: AVATAR_COLORS[(String(emp.employee_id).charCodeAt(0) || 65) % AVATAR_COLORS.length] }]}>
                              <Text style={styles.avatarText}>{initials}</Text>
                            </View>
                            <Text style={styles.recipientOptionText}>{label}</Text>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </ScrollView>
                </View>
              )}

              {/* Subject */}
              <Text style={styles.composeLabel}>Subject</Text>
              <TextInput
                style={styles.composeInput}
                placeholder="Enter subject"
                placeholderTextColor="#9CA3AF"
                value={subject}
                onChangeText={setSubject}
              />

              {/* Body */}
              <Text style={styles.composeLabel}>Message Body</Text>
              <TextInput
                style={styles.composeTextArea}
                placeholder="Write your message here..."
                placeholderTextColor="#9CA3AF"
                value={body}
                onChangeText={setBody}
                multiline
                textAlignVertical="top"
              />

              {/* Actions */}
              <View style={styles.composeActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={resetCompose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sendBtn} activeOpacity={0.8}>
                  <Text style={styles.sendBtnText}>Send</Text>
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
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    backgroundColor: "#fff",
    gap: 12,
  },

  // Top bar
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#111827" },
  composeBtn: {
    backgroundColor: "#1E0977",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  composeBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  // Search
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: "#F9FAFB",
  },
  searchIcon: { fontSize: 13 },
  searchInput: { flex: 1, fontSize: 14, color: "#111827" },
  clearIcon: { fontSize: 12, color: "#9CA3AF", fontWeight: "600" },

  // Sidebar-style tabs
  tabSidebar: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    overflow: "hidden",
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#fff",
  },
  tabItemActive: {
    backgroundColor: "#EEF2FF",
  },
  tabIcon: { fontSize: 16, width: 22, textAlign: "center" },
  tabLabel: { flex: 1, fontSize: 14, fontWeight: "500", color: "#374151" },
  tabLabelActive: { color: "#1E0977", fontWeight: "700" },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  badgeFilled: { backgroundColor: "#1E0977" },
  badgeEmpty: { backgroundColor: "#F3F4F6" },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  badgeTextMuted: { color: "#9CA3AF" },

  // Email list
  emptyContainer: { flex: 1 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingTop: 60,
  },
  emptyIcon: { fontSize: 32 },
  emptyText: { fontSize: 14, color: "#9CA3AF" },
  separator: { height: 1, backgroundColor: "#F3F4F6", marginLeft: 72 },

  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 12,
    position: "relative",
  },
  emailRowUnread: { backgroundColor: "#FAFAFA" },
  unreadDot: {
    position: "absolute",
    left: -8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#1E0977",
    top: "50%",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  avatarText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  emailContent: { flex: 1, gap: 2 },
  emailTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  senderName: { fontSize: 14, color: "#374151", fontWeight: "500", flex: 1 },
  bold: { fontWeight: "700", color: "#111827" },
  dateText: { fontSize: 11, color: "#9CA3AF", marginLeft: 8 },
  subjectText: { fontSize: 13, color: "#6B7280" },
  subjectBold: { fontWeight: "600", color: "#374151" },
  previewText: { fontSize: 12, color: "#9CA3AF" },

  // Read email modal
  modalScreen: { flex: 1, backgroundColor: "#fff" },
  modalHeader: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: { fontSize: 15, color: "#1E0977", fontWeight: "600" },
  emailDetail: { padding: 20, gap: 16 },
  detailSubject: { fontSize: 20, fontWeight: "700", color: "#111827" },
  detailMeta: { flexDirection: "row", alignItems: "center", gap: 12 },
  detailSender: { fontSize: 14, fontWeight: "600", color: "#111827" },
  detailDate: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  detailDivider: { height: 1, backgroundColor: "#F3F4F6" },
  detailBody: { fontSize: 15, color: "#374151", lineHeight: 24 },

  // Compose modal
  composeOverlay: { flex: 1, justifyContent: "flex-end" },
  composeBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  composeSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
  composeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  composeTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  composeClose: { fontSize: 16, color: "#9CA3AF", fontWeight: "600" },
  composeBody: { padding: 20, gap: 10, paddingBottom: 32 },
  composeLabel: { fontSize: 13, fontWeight: "600", color: "#374151" },
  composeInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  composeTextArea: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#F9FAFB",
    height: 160,
  },

  // Recipient picker
  recipientSelector: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: "#F9FAFB",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recipientPlaceholder: { fontSize: 14, color: "#9CA3AF" },
  recipientSelected: { fontSize: 14, color: "#111827", fontWeight: "500" },
  chevron: { fontSize: 10, color: "#6B7280" },
  recipientPickerContainer: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
    marginTop: -4,
    maxHeight: 320,
  },
  recipientSearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: "#F9FAFB",
  },
  recipientSearchIcon: { fontSize: 14 },
  recipientSearchInput: { flex: 1, fontSize: 14, color: "#111827", paddingVertical: 4 },
  recipientList: {
    maxHeight: 240,
  },
  recipientLoading: { paddingVertical: 16, alignItems: "center" },
  recipientLoadingText: { fontSize: 13, color: "#6B7280" },
  recipientEmpty: { paddingVertical: 16, alignItems: "center" },
  recipientEmptyText: { fontSize: 13, color: "#9CA3AF" },
  recipientOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  recipientAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  recipientOptionText: { fontSize: 14, color: "#111827" },

  // Compose actions
  composeActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  sendBtn: {
    flex: 1,
    backgroundColor: "#1E0977",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  sendBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },
});
