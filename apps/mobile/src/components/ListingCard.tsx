/**
 * ListingCard.tsx — mobile listing card (design.md §4.2 primitive), native form.
 *
 * Typed against the shared `ListingCardDTO` so web and mobile render the exact same
 * contract (it is the ONLY listing shape a client receives — never a raw DB row).
 * Anatomy mirrors web: image area (radius.md, 4:3), title (lg, 2-line clamp), area
 * (sm/secondary, 1-line), rating (amber star + value), price in text.price bold +
 * "/night" in sm/muted. Currency via the shared money formatter (BDT, ৳, Asia/Dhaka).
 *
 * Seven states (this is a Pressable, design.md §3):
 *  - default: surface.raised card, shadow.sm
 *  - hover:   N/A on touch; web parity handled on web
 *  - focus:   focus ring drawn when accessibility-focused (focus.color border)
 *  - active:  pressed → subtle.subtle tint (Pressable `pressed`)
 *  - disabled: `disabled` prop → muted text + reduced opacity, not focusable
 *  - loading: skeleton variant (see ListingCardSkeleton) keeps width, no CLS
 *  - error:   handled by the parent list (empty/error state), not the card
 */
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ListingCardDTO } from '@travela/shared/schemas';
import { formatBdt } from '@/lib/money';
import { theme } from '@/theme/theme';

interface ListingCardProps {
  listing: ListingCardDTO;
  onPress?: (slug: string) => void;
  disabled?: boolean;
}

export function ListingCard({ listing, onPress, disabled = false }: ListingCardProps) {
  const location = [listing.area, listing.district].filter(Boolean).join(', ');
  const rating = listing.ratingAverage;

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${listing.title}${location ? `, ${location}` : ''}`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => onPress?.(listing.slug)}
      style={({ pressed, focused }) => [
        styles.card,
        pressed && styles.cardPressed,
        focused && styles.cardFocused,
        disabled && styles.cardDisabled,
      ]}
    >
      {listing.coverImageUrl ? (
        <Image
          source={{ uri: listing.coverImageUrl }}
          style={styles.image}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={[styles.image, styles.imageEmpty]}>
          <Text style={styles.imageEmptyLabel}>No photo yet</Text>
        </View>
      )}

      <View style={styles.meta}>
        <View style={styles.titleRow}>
          <Text numberOfLines={2} style={styles.title}>
            {listing.title}
          </Text>
          {rating !== null ? (
            <Text style={styles.rating}>
              <Text style={styles.star}>★</Text> {rating.toFixed(1)}
            </Text>
          ) : null}
        </View>

        {location ? (
          <Text numberOfLines={1} style={styles.location}>
            {location}
          </Text>
        ) : null}

        <Text style={styles.priceRow}>
          <Text style={styles.price}>{formatBdt(listing.pricePerDay)}</Text>
          <Text style={styles.perNight}> /night</Text>
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.color.surface.raised,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border.default,
    overflow: 'hidden',
    shadowColor: theme.color.surface.brandHover,
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardPressed: {
    backgroundColor: theme.color.surface.subtle,
  },
  cardFocused: {
    borderColor: theme.color.border.focus,
    borderWidth: 2,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: theme.color.surface.subtle,
  },
  imageEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageEmptyLabel: {
    fontFamily: theme.font.family.body,
    fontSize: theme.font.size.sm,
    color: theme.color.text.muted,
  },
  meta: {
    padding: theme.space[4],
    gap: theme.space[1],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.space[2],
  },
  title: {
    flex: 1,
    fontFamily: theme.font.family.body,
    fontSize: theme.font.size.lg,
    lineHeight: theme.font.line.lg,
    fontWeight: String(theme.font.weight.semibold) as '600',
    color: theme.color.text.primary,
  },
  rating: {
    fontFamily: theme.font.family.body,
    fontSize: theme.font.size.sm,
    lineHeight: theme.font.line.lg,
    fontWeight: String(theme.font.weight.semibold) as '600',
    color: theme.color.text.primary,
  },
  star: {
    color: theme.color.action.accent,
  },
  location: {
    fontFamily: theme.font.family.body,
    fontSize: theme.font.size.sm,
    lineHeight: theme.font.line.sm,
    color: theme.color.text.secondary,
  },
  priceRow: {
    marginTop: theme.space[1],
  },
  price: {
    fontFamily: theme.font.family.display,
    fontSize: theme.font.size.base,
    fontWeight: String(theme.font.weight.bold) as '700',
    color: theme.color.text.price,
  },
  perNight: {
    fontFamily: theme.font.family.body,
    fontSize: theme.font.size.sm,
    color: theme.color.text.muted,
  },
});
