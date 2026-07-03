import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Subukang basahin mula sa .env, kung wala ay gamitin ang aktwal na string strings
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'your-actual-anon-key-here';

// Siguraduhing hindi na ito blangko o placeholder lang ang nakalagay
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-id')) {
  throw new Error(
    'Missing Supabase Environment Variables. Paki-check kung tama ang iyong .env file at may EXPO_PUBLIC_ prefix.'
  );
}

const customStorage = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } else {
      await AsyncStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    } else {
      await AsyncStorage.removeItem(key);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Force clear storage on demand
export const clearSupabaseSession = async () => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('auth'))) {
            keysToRemove.push(key);
          }
        }

        keysToRemove.forEach((key) => {
          localStorage.removeItem(key);
        });

        if (typeof sessionStorage !== 'undefined') {
          const sessionKeys: string[] = [];
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('auth'))) {
              sessionKeys.push(key);
            }
          }
          sessionKeys.forEach((key) => sessionStorage.removeItem(key));
        }
      }
    } else {
      const keys = await AsyncStorage.getAllKeys();
      const authKeys = keys.filter((key) =>
        key.includes('supabase') || key.includes('sb-') || key.includes('auth')
      );
      if (authKeys.length > 0) {
        await AsyncStorage.multiRemove(authKeys);
      }
    }
  } catch (error) {
    console.error("Error clearing session storage:", error);
  }
};
