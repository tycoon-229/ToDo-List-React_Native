import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// THAY THẾ BẰNG URL VÀ KEY CỦA BẠN TRONG SUPABASE
const supabaseUrl = 'https://dpvufjwxxzvmtmjmugrn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdnVmand4eHp2bXRtam11Z3JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4NjY0NjcsImV4cCI6MjEwNzQ0MjQ2N30.H_RWhqOaz3jUIrEQBI6WQZ6YLyE-00gdXjdZ36RVK0c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});