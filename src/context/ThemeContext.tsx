import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Colors, Theme, ThemeColors } from "@/constants/theme";

type ThemeContextValue = {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = "@jeddsmobile_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored === "dark" || stored === "light") {
          if (isMounted) setThemeState(stored);
        }
      } catch {
        // ignore storage errors
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const setTheme = async (next: Theme) => {
    setThemeState(next);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  };

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  const colors = Colors[theme];

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: "light",
      colors: Colors.light,
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return ctx;
}
