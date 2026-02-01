
import { createClient } from '@supabase/supabase-js';

// Substitua estas variáveis pelas suas credenciais do Supabase
// Recomenda-se o uso de variáveis de ambiente (.env) em um ambiente real
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sua-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sua-chave-anonima';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
