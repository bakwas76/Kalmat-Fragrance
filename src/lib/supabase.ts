// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// if (!supabaseUrl || !supabaseAnonKey) {
//   throw new Error('Missing Supabase environment variables. Check your .env file.');
// }

// export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
//   auth: {
//     persistSession: true,
//     autoRefreshToken: true,
//     detectSessionInUrl: true,
//   },
// });


import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://dwcckjvpzobpabielbsz.supabase.co";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3Y2NranZwem9icGFiaWVsYnN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMjk2MjEsImV4cCI6MjEwMDcwNTYyMX0.ikenSo4oHY9_V9h7WHlpnPLnJ2-kZD6cNARaazN5DHI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
