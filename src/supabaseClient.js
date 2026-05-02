import { createClient } from '@supabase/supabase-js';

// Estas variables las configuraremos en el archivo .env más adelante
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);