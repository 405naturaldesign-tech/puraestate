// Supabase client configuration for PuraEstate tRPC server
// Uses @supabase/supabase-js for database access
// Uses @supabase/ssr for Next.js server-side rendering

import { createClient } from '@supabase/supabase-js';

// These env vars come from the Supabase dashboard:
// Settings → API → Project API keys
const supabaseUrl = process.env.SUPABASE_URL || 'https://cepnaljvkcperoecaxzu.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_PUBLISHABLE_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || '';

// Public client (RLS-scoped) — for user-facing queries
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

// Admin client (bypasses RLS) — for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Health check — verify the connection
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('_tables').select('*').limit(1);
    if (error && error.code !== 'PGRST116') {
      // PGRST116 means the table doesn't exist, which is expected
      // if there are no tables yet. That's not a connection error.
      return { connected: false, error: error.message };
    }
    return { connected: true, tables: data };
  } catch (e: any) {
    return { connected: false, error: e.message };
  }
}

// Get all tables in the database
export async function listTables() {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema, table_type')
      .eq('table_schema', 'public');
    
    if (error) throw error;
    return { tables: data, error: null };
  } catch (e: any) {
    return { tables: null, error: e.message };
  }
}