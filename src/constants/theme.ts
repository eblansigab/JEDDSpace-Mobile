export const Colors = {
  light: {
    background: "#F9FAFB",
    surface: "#ffffff",
    border: "#E5E7EB",
    text: "#111827",
    textSecondary: "#6B7280",
    textMuted: "#9CA3AF",
    primary: "#1E0977",
    primaryLight: "#EEF2FF",
    tabBar: "#1E0977",
    tabBarActive: "#0C21C1",
    tabBarInactive: "rgba(255 255 255 / .75)",
    danger: "#EF4444",
    success: "#22C55E",
    warning: "#F59E0B",
    overlay: "rgba(0,0,0,0.4)",
    sheet: "#ffffff",
  },
  dark: {
    background: "#0F172A",
    surface: "#1E293B",
    border: "#334155",
    text: "#F8FAFC",
    textSecondary: "#94A3B8",
    textMuted: "#64748B",
    primary: "#818CF8",
    primaryLight: "#1E1B4B",
    tabBar: "#0F172A",
    tabBarActive: "#1E293B",
    tabBarInactive: "rgba(255 255 255 / .6)",
    danger: "#F87171",
    success: "#4ADE80",
    warning: "#FBBF24",
    overlay: "rgba(0,0,0,0.6)",
    sheet: "#1E293B",
  },
} as const;

export type Theme = keyof typeof Colors.light;

export type ThemeColors = typeof Colors.light;
