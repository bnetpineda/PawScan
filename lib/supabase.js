import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vttfvbjzniikthjecxah.supabase.co"; // Replace this
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dGZ2Ymp6bmlpa3RoamVjeGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3OTk5NjUsImV4cCI6MjA2NDM3NTk2NX0.vcAhUz3qEi6J_2j-2qm_IzArQeSEBfvO5Sc55TTZtXo"; // Replace this

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

