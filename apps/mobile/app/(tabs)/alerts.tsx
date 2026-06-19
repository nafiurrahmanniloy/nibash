/**
 * (tabs)/alerts.tsx — Alerts screen (notifications).
 *
 * Phase-7 shell. Push (Expo Push / FCM) + in-app notifications (BUILD-PLAN Phase 4)
 * land later through the notifications feature; this renders the empty state now.
 */
import { StyleSheet, Text, View } from 'react-native';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { theme } from '@/theme/theme';

export default function AlertsScreen() {
  return (
    <ScreenScaffold
      title="Alerts"
      subtitle="Booking updates, host replies, and reminders."
    >
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>You're all caught up</Text>
        <Text style={styles.emptyBody}>
          We'll let you know when a host approves a request or a stay needs your
          attention.
        </Text>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  empty: {
    gap: theme.space[1],
  },
  emptyTitle: {
    fontFamily: theme.font.family.body,
    fontSize: theme.font.size.lg,
    fontWeight: String(theme.font.weight.semibold) as '600',
    color: theme.color.text.primary,
  },
  emptyBody: {
    fontFamily: theme.font.family.body,
    fontSize: theme.font.size.base,
    lineHeight: theme.font.line.base,
    color: theme.color.text.secondary,
  },
});
