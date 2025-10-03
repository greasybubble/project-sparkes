import { ExpoConfig } from 'expo/config';

export default (): ExpoConfig => ({
  name: 'project-sparkes',
  slug: 'project-sparkes',
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
  // …rest
});
