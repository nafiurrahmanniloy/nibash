/**
 * (tabs)/booking.tsx — Booking screen (the guest's trips/requests).
 *
 * Phase-7 shell. The lifecycle labels below are read straight from the shared
 * `BOOKING_STATUSES` (the single source for the state machine in booking.schema),
 * proving web and mobile share one contract. The live list arrives when the bookings
 * feature repository is wired for mobile.
 */
import { StyleSheet, Text, View } from 'react-native';
import { BOOKING_STATUSES, type BookingStatusValue } from '@travela/shared/schemas';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { theme } from '@/theme/theme';

/** Friendly labels for the shared booking statuses (UI copy, not new contract). */
const STATUS_LABEL: Record<BookingStatusValue, string> = {
  requested: 'Requested',
  approved: 'Approved',
  declined: 'Declined',
  payment_pending: 'Payment pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function BookingScreen() {
  return (
    <ScreenScaffold
      title="Your bookings"
      subtitle="Track every stay from request to checkout."
    >
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No bookings yet</Text>
        <Text style={styles.emptyBody}>
          When you request a stay from Explore, it shows up here and moves through these
          stages:
        </Text>
      </View>

      <View
        style={styles.flow}
        accessibilityRole="summary"
        accessibilityLabel="Booking lifecycle stages"
      >
        {BOOKING_STATUSES.map((status) => (
          <View key={status} style={styles.stagePill}>
            <Text style={styles.stageLabel}>{STATUS_LABEL[status]}</Text>
          </View>
        ))}
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
  flow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space[2],
    marginTop: theme.space[3],
  },
  stagePill: {
    paddingHorizontal: theme.space[3],
    paddingVertical: theme.space[2],
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.surface.subtle,
    borderWidth: 1,
    borderColor: theme.color.border.brand,
  },
  stageLabel: {
    fontFamily: theme.font.family.body,
    fontSize: theme.font.size.sm,
    fontWeight: String(theme.font.weight.medium) as '500',
    color: theme.color.text.brand,
  },
});
