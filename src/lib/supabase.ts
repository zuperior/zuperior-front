import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Check if Supabase credentials are configured
if (!supabaseUrl || supabaseUrl === "https://your-project.supabase.co") {
  console.warn("⚠️ Supabase URL not configured. Please update NEXT_PUBLIC_SUPABASE_URL in .env.local");
}

if (!supabaseAnonKey || supabaseAnonKey === "your-supabase-anon-key") {
  console.warn("⚠️ Supabase API key not configured. Please update NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
}

// Create Supabase client with fallback for development
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);
