/**
 * (tabs)/profile.tsx — Profile screen (account + sign-in entry).
 *
 * Phase-7 shell. The signed-out state is shown now; the live profile (typed against
 * the shared `Profile` / `UserRole` contract) and Supabase auth land when the mobile
 * auth phase is wired through the auth feature repository.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { UserRole } from '@travela/shared/types';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { theme } from '@/theme/theme';

/** Roles surfaced in the UI come straight from the shared union (no redefining). */
const ROLE_BLURB: Record<UserRole, string> = {
  guest: 'Book stays across Bangladesh.',
  host: 'List your place and manage bookings.',
  admin: 'Moderate the marketplace.',
};

export default function ProfileScreen() {
  return (
    <ScreenScaffold
      title="Profile"
      subtitle="Sign in to manage your stays, messages, and account."
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Welcome to Travela</Text>
        <Text style={styles.cardBody}>{ROLE_BLURB.guest}</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign in to your account"
          style={({ pressed, focused }) => [
            styles.cta,
            pressed && styles.ctaPressed,
            focused && styles.ctaFocused,
          ]}
        >
          {({ pressed }) => (
            <Text style={[styles.ctaLabel, pressed && styles.ctaLabelPressed]}>
              Sign in
            </Text>
          )}
        </Pressable>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.color.surface.raised,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border.default,
    padding: theme.space[5],
    gap: theme.space[3],
  },
  cardTitle: {
    fontFamily: theme.font.family.body,
    fontSize: theme.font.size.lg,
    fontWeight: String(theme.font.weight.semibold) as '600',
    color: theme.color.text.primary,
  },
  cardBody: {
    fontFamily: theme.font.family.body,
    fontSize: theme.font.size.base,
    lineHeight: theme.font.line.base,
    color: theme.color.text.secondary,
  },
  // Primary button — design.md §4.1: surface.brand / text.inverse, pill, ≥44px target.
  cta: {
    marginTop: theme.space[2],
    minHeight: theme.hitTarget,
    paddingHorizontal: theme.space[5],
    paddingVertical: theme.space[3],
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.surface.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPressed: {
    backgroundColor: theme.color.surface.brandHover,
  },
  ctaFocused: {
    borderWidth: 2,
    borderColor: theme.color.border.focus,
  },
  ctaLabel: {
    fontFamily: theme.font.family.body,
    fontSize: theme.font.size.base,
    fontWeight: String(theme.font.weight.semibold) as '600',
    color: theme.color.text.inverse,
  },
  ctaLabelPressed: {
    color: theme.color.text.inverse,
  },
});
