import { ThemedSafeAreaView } from '@/components/themed-safe-area';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = { anchor: '(tabs)' };

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider value={theme}>
      <SafeAreaProvider>
        <ThemedSafeAreaView /* edges={['top','left','right','bottom']} if you want bottom too */>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
        </ThemedSafeAreaView>

        {/* Make the OS status bar match the theme (Android needs the bg colour) */}
        <StatusBar
          style={colorScheme === 'dark' ? 'light' : 'dark'}
          backgroundColor={theme.colors.background}
        />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
