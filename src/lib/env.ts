// EXPO_PUBLIC_* values are inlined into the bundle at build time, so only
// public values belong here. Use the anon / publishable key, never the
// service role key.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '';

export const env = {
  supabaseUrl,
  supabaseKey,
  isConfigured: Boolean(supabaseUrl && supabaseKey),
};
