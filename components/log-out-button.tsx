import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text } from 'react-native';

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert('Logout failed', error.message);
        return;
      }
      // Either of these will work:
      router.replace('/(auth)');   // 👈 loads (auth)/index
      // router.dismissAll();      // 👈 alternative: pop everything back to root
    } catch (e: any) {
      Alert.alert('Logout error', e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
      onPress={handleLogout}
      disabled={loading}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>Log out</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#1D6C85',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  text: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
