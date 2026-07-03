import ApprovalGuard from "@/components/ApprovalGuard";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <ApprovalGuard>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: "#1E0977" },
          headerShadowVisible: false,
          headerTintColor: "#fff",
          tabBarStyle: { backgroundColor: "#1E0977" },
          tabBarActiveBackgroundColor: "#0C21C1",
          tabBarActiveTintColor: "#fff",
          tabBarInactiveTintColor: "rgba(255 255 255 / .75)",
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "grid" : "grid-outline"} color={color} size={24} />
            ),
          }}
        />
        <Tabs.Screen name="documents" options={{ title: "Documents", href: null }} />
        <Tabs.Screen name="email" options={{ title: "Messages", href: null }} />
        <Tabs.Screen name="contracts" options={{ title: "Contracts", href: null }} />
        <Tabs.Screen name="announcements" options={{ title: "Announcements", href: null }} />
        <Tabs.Screen name="business-form" options={{ title: "Official Business Form", href: null }} />
        <Tabs.Screen name="leave-form" options={{ title: "Leave Form", href: null }} />
        <Tabs.Screen name="ai-assistant" options={{ title: "AI", href: null }} />
        <Tabs.Screen name="awaiting-approval" options={{ title: "Awaiting Approval", href: null }} />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "person-circle" : "person-circle-outline"} color={color} size={24} />
            ),
          }}
        />
      </Tabs>
    </ApprovalGuard>
  );
}
