/**
 * (tabs)/inbox.tsx — Inbox screen (guest ↔ host conversations).
 *
 * Phase-7 shell. Real-time messaging (Supabase Realtime, BUILD-PLAN Phase 4) is wired
 * through the messaging feature repository later; this renders the empty/idle state so
 * the tab is coherent today.
 */
import { StyleSheet, Text, View } from 'react-native';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { theme } from '@/theme/theme';

export default function InboxScreen() {
  return (
    <ScreenScaffold
      title="Inbox"
      subtitle="Message hosts about a stay, before and after you book."
    >
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No conversations yet</Text>
        <Text style={styles.emptyBody}>
          Start a chat from any listing and your conversations will appear here in real
          time.
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
