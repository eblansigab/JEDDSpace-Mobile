import CalendarView from "@/components/CalendarView";
import MenuDropdown from "@/components/menuDropdown";
import { ViewNumberOfDocuments } from "@/components/ViewNumberOfDocuments";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function DashboardCard({
  icon,
  title,
  subtitle,
  actionLabel,
  onPress,
  accent = "#1E0977",
  children,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onPress?: () => void;
  accent?: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconBadge, { backgroundColor: accent + "18" }]}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        <View style={styles.cardTitles}>
          <Text style={styles.cardTitle}>{title}</Text>
          {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
        </View>
        {actionLabel && onPress && (
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: accent }]}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionBtnText, { color: accent }]}>{actionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
      {children && <View style={styles.cardBody}>{children}</View>}
    </View>
  );
}

export default function Index() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  return (
    <View style={styles.container}>
      <MenuDropdown />

      {/* Greeting banner */}
      <View style={styles.banner}>
        <View>
          <Text style={styles.greeting}>Good morning 👋</Text>
          <Text style={styles.greetingName}>Welcome back!</Text>
        </View>
        <View style={styles.bannerAvatar}>
          <Text style={styles.bannerAvatarText}>JC</Text>
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section label */}
        <Text style={styles.sectionLabel}>Overview</Text>

        {/* Email */}
        <DashboardCard
          icon="✉️"
          title="Emails"
          subtitle="You have __ unread messages"
          actionLabel="View"
          onPress={() => router.push("/email")}
          accent="#1E0977"
        />

        {/* Documents */}
        <DashboardCard
          icon="📄"
          title="Documents"
          accent="#0891B2"
        >
          <ViewNumberOfDocuments />
        </DashboardCard>

        {/* Announcements */}
        <DashboardCard
          icon="📢"
          title="Announcements"
          subtitle="View the latest from your company"
          actionLabel="View"
          onPress={() => router.push("/announcements")}
          accent="#D97706"
        />

        {/* AI Assistant */}
        <DashboardCard
          icon="🤖"
          title="AI Assistant"
          subtitle="Ask questions about jobs, employees, and documents"
          actionLabel="Chat"
          onPress={() => router.push("/ai-assistant")}
          accent="#0C21C1"
        />

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerLabel}>Schedule</Text>
          <View style={styles.divider} />
        </View>

        {/* Calendar */}
        <DashboardCard
          icon="🗓️"
          title="Calendar"
          accent="#059669"
        >
          <CalendarView />
        </DashboardCard>

        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    backgroundColor: "#F9FAFB",
    gap: 12,
  },

  // Banner
  banner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1E0977",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 13,
    color: "#C7D2FE",
    fontWeight: "500",
  },
  greetingName: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "700",
    marginTop: 2,
  },
  bannerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  bannerAvatarText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  // Scroll
  scrollContent: {
    gap: 10,
    paddingBottom: 32,
  },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: -2,
  },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 20,
  },
  cardTitles: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
  actionBtn: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  cardBody: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12,
  },

  // Divider
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 2,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});
