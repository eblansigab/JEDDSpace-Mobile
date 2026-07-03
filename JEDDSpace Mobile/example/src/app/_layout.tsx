import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '../components/animated-icon';
import AppTabs from '../components/app-tabs';
//import { Header } from '@react-navigation/elements';
export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      
      <AppTabs />
    </ThemeProvider>
  );
}
//<Header title={require("@/assets/images/icon.png")} />