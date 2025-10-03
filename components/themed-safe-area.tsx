// components/themed-safe-area.tsx
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: Readonly<Edge[]>;
};

/**
 * Fills the notch/status-bar area with the current theme background.
 * Default edges are top + sides; add "bottom" if you want it there too.
 */
export function ThemedSafeAreaView({ children, style, edges = ['top', 'left', 'right'] }: Props) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.background }, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}
