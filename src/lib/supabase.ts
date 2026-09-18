import { createClient } from '@supabase/supabase-js';

const env = ((import.meta as any).env || {}) as Record<string, string | undefined>;
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase Client] SUPABASE_URL or SUPABASE_ANON_KEY is missing from client environment. Supabase features may be limited.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
