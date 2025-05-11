import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Better put your these secret keys in .env file
export const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL || "",
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
    {
        //@ts-ignore line
        localStorage: AsyncStorage as any,
        detectSessionInUrl: false, // Prevents Supabase from evaluating window.location.href, breaking mobile
    }
);
