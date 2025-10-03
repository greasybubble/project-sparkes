import LoomPlayer from '@/components/loom-player';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

export default function CheckInScreen() {
  const today = new Date();
  const dateText = formatDate(today);

  return (
    
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <View style={styles.videoSection}>
          <LoomPlayer
            video="https://www.loom.com/share/29d768ff7de54899baf69c3810d43296?t=0"
            aspectRatio={16 / 9}
          />
        </View>
      }
    >
      <View style={styles.dateBar}>
              <ThemedText style={styles.dateText}>{dateText}</ThemedText>
      </View>

      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Check-In</ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes. Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({ ios: 'cmd + d', android: 'cmd + m', web: 'F12' })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <Link href="/modal">
          <Link.Trigger>
            <ThemedText type="subtitle">Step 2: Explore</ThemedText>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction title="Action" icon="cube" onPress={() => alert('Action pressed')} />
            <Link.MenuAction title="Share" icon="square.and.arrow.up" onPress={() => alert('Share pressed')} />
            <Link.Menu title="More" icon="ellipsis">
              <Link.MenuAction title="Delete" icon="trash" destructive onPress={() => alert('Delete pressed')} />
            </Link.Menu>
          </Link.Menu>
        </Link>

        <ThemedText>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          {`When you're ready, run `}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

function formatDate(d: Date) {
  const n = d.getDate();
  const ord =
    n % 10 === 1 && n % 100 !== 11 ? 'st' :
    n % 10 === 2 && n % 100 !== 12 ? 'nd' :
    n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th';
  const month = d.toLocaleString('en-GB', { month: 'long' });
  return `${n}${ord} ${month} ${d.getFullYear()}`;
}

const styles = StyleSheet.create({
  videoSection: { backgroundColor: '#000' },

  dateBar: {
    height: 32,
    backgroundColor: '#5590c7ff',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#00000040',
  },
  dateText: { color: '#fff', fontWeight: '600' },

  titleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stepContainer: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#00000020',
  },
});
