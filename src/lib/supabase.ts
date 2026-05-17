import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://nklctkztrdmypovpesqh.supabase.co';
const supabaseAnonKey = 'sb_publishable_AFqlZQPvy35fPzkC9KRfyQ_fmMgUDw0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});