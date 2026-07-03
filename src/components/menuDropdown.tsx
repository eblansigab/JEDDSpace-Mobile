import { supabase } from "@/lib/supabase";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type IconName = React.ComponentProps<typeof Ionicons>["name"];
type NavItem =
  | { kind: "link"; label: string; icon: IconName; value: string; adminOnly?: boolean }
  | { kind: "section"; label: string };

const ALL_NAV_ITEMS: NavItem[] = [
  { kind: "link", label: "Dashboard", icon: "grid-outline", value: "/" },
  { kind: "link", label: "Documents", icon: "document-text-outline", value: "/documents" },
  { kind: "link", label: "Messages", icon: "mail-outline", value: "/email" },
  { kind: "link", label: "Contracts", icon: "briefcase-outline", value: "/contracts" },
  { kind: "link", label: "Announcements", icon: "megaphone-outline", value: "/announcements" },
  { kind: "section", label: "HR Forms" },
  { kind: "link", label: "Business Form", icon: "reader-outline", value: "/business-form" },
  { kind: "link", label: "Leave Form", icon: "calendar-outline", value: "/leave-form" },
  { kind: "section", label: "AI Tools" },
  { kind: "link", label: "AI Assistant", icon: "sparkles-outline", value: "/ai-assistant" },
  { kind: "link", label: "AI Analytics", icon: "pie-chart-outline", value: "/ai-analytics", adminOnly: true },
  { kind: "link", label: "AI Chat Logs", icon: "list-outline", value: "/ai-chat-logs", adminOnly: true },
  { kind: "section", label: "Admin" },
  { kind: "link", label: "Registration Requests", icon: "person-add-outline", value: "/registration-requests", adminOnly: true },
];

export default function MenuDropdown() {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user?.id) return;
        const { data } = await supabase.from("employee").select("role").eq("user_id", session.user.id).maybeSingle();
        setIsAdmin(data?.role?.toLowerCase() === "admin");
      } catch {
        // Keep the menu usable even if the role lookup fails.
      }
    })();
  }, []);

  const visibleItems = ALL_NAV_ITEMS.filter((item) => !(item.kind === "link" && item.adminOnly && !isAdmin)).filter(
    (item, index, items) => item.kind !== "section" || items.slice(index + 1).some((candidate) => candidate.kind === "link"),
  );

  const handleNav = (value: string) => {
    setOpen(false);
    router.push(value as never);
  };

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <View style={styles.triggerLeft}>
          <Ionicons name="menu-outline" color="#fff" size={22} />
          <Text style={styles.triggerLabel}>Menu</Text>
        </View>
        <Ionicons name={open ? "chevron-up-outline" : "chevron-down-outline"} color="#fff" size={16} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Navigate to</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={12}>
                <Ionicons name="close-outline" color="#9CA3AF" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {visibleItems.map((item, index) => {
                if (item.kind === "section") {
                  return (
                    <View key={`${item.label}-${index}`} style={styles.sectionHeader}>
                      <Text style={styles.sectionLabel}>{item.label}</Text>
                      <View style={styles.sectionLine} />
                    </View>
                  );
                }
                return (
                  <TouchableOpacity
                    key={`${item.value}-${index}`}
                    style={styles.navItem}
                    onPress={() => handleNav(item.value)}
                    activeOpacity={0.6}
                  >
                    <Ionicons name={item.icon} color="#1E0977" size={20} style={styles.navIcon} />
                    <Text style={styles.navLabel}>{item.label}</Text>
                    {item.adminOnly ? (
                      <View style={styles.adminBadge}>
                        <Text style={styles.adminBadgeText}>Admin</Text>
                      </View>
                    ) : null}
                    <Ionicons name="chevron-forward-outline" color="#D1D5DB" size={18} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1E0977",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  triggerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  triggerLabel: { color: "#fff", fontWeight: "600", fontSize: 14 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-start", paddingTop: 100, paddingHorizontal: 16 },
  sheet: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    maxHeight: 520,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sheetTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#9CA3AF", textTransform: "uppercase" },
  sectionLine: { flex: 1, height: 1, backgroundColor: "#F3F4F6" },
  navItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
  navIcon: { width: 26 },
  navLabel: { flex: 1, fontSize: 14, fontWeight: "500", color: "#111827" },
  adminBadge: { backgroundColor: "#EEF2FF", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  adminBadgeText: { fontSize: 10, color: "#1E0977", fontWeight: "700" },
});
