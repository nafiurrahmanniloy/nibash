/**
 * ScreenScaffold.tsx — shared screen shell for the tab screens.
 *
 * Provides the cream page surface (surface.base), safe-area insets, a display H1
 * (font.display, used with restraint per design.md §2.3) + optional subtitle, and a
 * scrollable body. Every value comes from the `theme` token bridge — no raw hex, no
 * one-off spacing. `accessibilityRole="header"` exposes the page title as a landmark.
 */
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/theme/theme';

interface ScreenScaffoldProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function ScreenScaffold({ title, subtitle, children }: ScreenScaffoldProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={styles.body}>{children}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.color.surface.base,
  },
  content: {
    paddingHorizontal: theme.space[4],
    paddingTop: theme.space[5],
    paddingBottom: theme.space[7],
    gap: theme.space[2],
  },
  title: {
    fontFamily: theme.font.family.display,
    fontSize: theme.font.size['2xl'],
    lineHeight: theme.font.line['2xl'],
    fontWeight: String(theme.font.weight.bold) as '700',
    color: theme.color.text.primary,
  },
  subtitle: {
    fontFamily: theme.font.family.body,
    fontSize: theme.font.size.base,
    lineHeight: theme.font.line.base,
    color: theme.color.text.secondary,
  },
  body: {
    marginTop: theme.space[4],
    gap: theme.space[3],
  },
});
