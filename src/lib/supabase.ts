
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    console.error('Missing VITE_SUPABASE_URL in environment variables.');
    throw new Error('Supabase URL is required.');
}

if (!supabaseAnonKey) {
    console.error('Missing VITE_SUPABASE_ANON_KEY in environment variables.');
    throw new Error('Supabase Anon Key is required.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
