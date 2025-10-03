// app/(auth)/index.tsx
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@react-navigation/native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, TextInput } from 'react-native';

export default function LoginScreen() {
  const { colors, dark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, gap: 20, padding: 20, justifyContent: 'center', alignItems: 'center' },
        logo: {
          width: 220,
          height: 80,
          resizeMode: 'contain',
          marginBottom: 24,
        },
        input: {
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
          color: colors.text,
          borderColor: dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
          backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          width: '100%',
        },
        divider: { textAlign: 'center', opacity: 0.8 },
      }),
    [colors, dark]
  );

  async function onSignIn() {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return Alert.alert('Sign in failed', error.message);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Sign in error', e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function onSignUp() {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) return Alert.alert('Sign up failed', error.message);
      Alert.alert('Check your inbox', 'We sent you a verification email.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <Image
        source={
          dark
            ? require('@/assets/images/project-sparkes-logo-dark.png')
            : require('@/assets/images/project-sparkes-logo-light.png')
        }
        style={styles.logo}
      />

      <TextInput
        placeholder="Email"
        placeholderTextColor={dark ? '#A0A0A0' : '#6B7280'}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor={dark ? '#A0A0A0' : '#6B7280'}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      {loading ? (
        <ActivityIndicator />
      ) : (
        <>
          <Button title="Sign in" onPress={onSignIn} />
          <ThemedText style={styles.divider}>or</ThemedText>
          <Button title="Create account" onPress={onSignUp} />
        </>
      )}
    </ThemedView>
  );
}
