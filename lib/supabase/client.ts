import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined');
}

export const supabase = createClient<Database['public']>(supabaseUrl, supabaseAnonKey);

// Server-side client with service role key (for server components / API routes)
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return supabase;
  }
  return createClient<Database['public']>(supabaseUrl, serviceRoleKey);
}

export type { SupabaseClient } from '@supabase/supabase-js';
