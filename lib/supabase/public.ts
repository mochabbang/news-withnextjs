import { createClient, SupabaseClient } from '@supabase/supabase-js';

let publicClient: SupabaseClient | null = null;

export function getSupabasePublic(): SupabaseClient {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
        throw new Error('Supabase public environment variables are not configured');
    }

    if (!publicClient) {
        publicClient = createClient(supabaseUrl, anonKey);
    }

    return publicClient;
}
