import CalendarView from "@/components/CalendarView";
import MenuDropdown from "@/components/menuDropdown";
import { ViewNumberOfDocuments } from "@/components/ViewNumberOfDocuments";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

type CalendarEvent = {
  title: string;
  start: string;
  end?: string;
  color?: string;
};

function DashboardCard({
  icon,
  title,
  subtitle,
  actionLabel,
  onPress,
  accent = "#1E0977",
  children,
}: {
  icon: IconName;
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
        <View style={[styles.iconBadge, { backgroundColor: `${accent}18` }]}>
          <Ionicons name={icon} color={accent} size={22} />
        </View>
        <View style={styles.cardTitles}>
          <Text style={styles.cardTitle}>{title}</Text>
          {subtitle ? (
            <Text style={styles.cardSubtitle}>{subtitle}</Text>
          ) : null}
        </View>
        {actionLabel && onPress ? (
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: accent }]}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionBtnText, { color: accent }]}>
              {actionLabel}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {children ? <View style={styles.cardBody}>{children}</View> : null}
    </View>
  );
}

export default function Index() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [greetingName, setGreetingName] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]); // ← new

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user?.id || !isMounted) return;

        const { data } = await supabase
          .from("employee")
          .select("first_name")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (data?.first_name && isMounted) {
          setGreetingName(data.first_name);
        }
      } catch (err) {
        console.error("[MobileAI] Profile load error:", err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // ← new: mirrors web version's loadCalendarEvents
  useEffect(() => {
    async function loadCalendarEvents() {
      try {
        const [
          { data: announcements },
          { data: leaves },
          { data: businessTrips },
          { data: jobs },
          { data: contracts },
        ] = await Promise.all([
          supabase.from("announcement").select("title, created_at"),
          supabase.from("leaveform").select("start_date, end_date"),
          supabase
            .from("businessform")
            .select("location, start_duration, end_duration"),
          supabase.from("job").select("destination, start_date, end_date"),
          supabase
            .from("contracts")
            .select("contract_title, start_date, end_date"),
        ]);

        const events: CalendarEvent[] = [
          ...(announcements || []).map((item) => ({
            title: `📢 ${item.title}`,
            start: item.created_at,
            color: "#D97706",
          })),
          ...(leaves || []).map((item) => ({
            title: `🏖 Leave`,
            start: item.start_date,
            end: item.end_date,
            color: "#059669",
          })),
          ...(businessTrips || []).map((item) => ({
            title: `🧳 ${item.location}`,
            start: item.start_duration,
            end: item.end_duration,
            color: "#0891B2",
          })),
          ...(jobs || []).map((item) => ({
            title: `💼 ${item.destination}`,
            start: item.start_date,
            end: item.end_date,
            color: "#1E0977",
          })),
          ...(contracts || []).map((item) => ({
            title: `📄 ${item.contract_title}`,
            start: item.start_date,
            end: item.end_date,
            color: "#7C3AED",
          })),
        ].filter((e) => e.start); // filter out any events with null start dates

        setCalendarEvents(events);
      } catch (err) {
        console.error("[MobileAI] Calendar load error:", err);
      }
    }

    loadCalendarEvents();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  return (
    <View style={styles.container}>
      <MenuDropdown />
      <View style={styles.banner}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.greetingName}>
            {greetingName ? `Welcome back, ${greetingName}.` : "Welcome back."}
          </Text>
        </View>
        <View style={styles.bannerAvatar}>
          <Text style={styles.bannerAvatarText}>
            {greetingName ? greetingName[0].toUpperCase() : "JS"}
          </Text>
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Overview</Text>

        <DashboardCard
          icon="mail-outline"
          title="Messages"
          subtitle="Review your internal messages"
          actionLabel="View"
          onPress={() => router.push("/email")}
          accent="#1E0977"
        />

        <DashboardCard
          icon="document-text-outline"
          title="Documents"
          accent="#0891B2"
        >
          <ViewNumberOfDocuments />
        </DashboardCard>

        <DashboardCard
          icon="megaphone-outline"
          title="Announcements"
          subtitle="View the latest from your company"
          actionLabel="View"
          onPress={() => router.push("/announcements")}
          accent="#D97706"
        />

        <DashboardCard
          icon="sparkles-outline"
          title="AI Assistant"
          subtitle="Ask about jobs, employees, contracts, and documents"
          actionLabel="Chat"
          onPress={() => router.push("/ai-assistant")}
          accent="#0C21C1"
        />

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerLabel}>Schedule</Text>
          <View style={styles.divider} />
        </View>

        {/* ← pass events down to CalendarView */}
        <DashboardCard
          icon="calendar-outline"
          title="Calendar"
          accent="#059669"
        >
          <CalendarView events={calendarEvents} />
        </DashboardCard>
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
  banner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1E0977",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  greeting: { fontSize: 13, color: "#C7D2FE", fontWeight: "500" },
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
  bannerAvatarText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  scrollContent: { gap: 10, paddingBottom: 32 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    marginBottom: -2,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitles: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  cardSubtitle: { fontSize: 12, color: "#6B7280" },
  actionBtn: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionBtnText: { fontSize: 12, fontWeight: "700" },
  cardBody: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 2,
  },
  divider: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
  },
});
