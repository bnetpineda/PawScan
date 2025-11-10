import AsyncStorage from "@react-native-async-storage/async-storage";
import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,  // ✅ keeps session alive
    persistSession: true,    // ✅ restores session from storage
    detectSessionInUrl: false, // ✅ needed for mobile apps
  },
});
