import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemedSafeAreaView } from '@/components/themed-safe-area'; // keep as named if your component exports named
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth changes and set initial session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <ThemeProvider value={theme}>
      <SafeAreaProvider>
        <ThemedSafeAreaView>
          {loading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator />
            </View>
          ) : session ? (
            // Signed in -> show your app
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
          ) : (
            // Signed out -> show auth
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)/index" />
            </Stack>
          )}

          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </ThemedSafeAreaView>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
