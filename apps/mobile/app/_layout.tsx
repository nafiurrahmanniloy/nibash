/**
 * _layout.tsx — root navigator (expo-router Stack).
 *
 * Wraps the app in SafeAreaProvider and sets the brand status-bar style. The single
 * child route is the (tabs) group, which owns the bottom-nav UX. Header is hidden at
 * the root because each tab screen renders its own heading (design.md headings).
 */
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from '@/theme/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={theme.color.surface.base} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.color.surface.base },
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}
