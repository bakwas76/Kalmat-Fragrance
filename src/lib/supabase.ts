import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qzndrmlvckbsziydgsnh.supabase.co';

const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6bmRybWx2Y2tic3ppeWRnc25oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NjI4NzcsImV4cCI6MjEwMTMzODg3N30.ggx0VDvby4EA51VY3esv29E6ORXBh6q6kXBWxfBZXcc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
