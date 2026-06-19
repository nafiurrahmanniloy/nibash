/**
 * (tabs)/index.tsx — Explore screen (mirrors web home / search discovery).
 *
 * Phase-7 shell: renders a real listings list using the shared `ListingCardDTO`
 * contract (the same shape web/search returns). Data here is a typed placeholder
 * array — the live fetch lands when the search feature's repository/service is wired
 * for mobile (it must come through a repository, never Supabase in a screen). The
 * empty state (no listings) is handled explicitly per design.md §5.
 */
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ListingCardDTO } from '@travela/shared/schemas';
import { ListingCard } from '@/components/ListingCard';
import { theme } from '@/theme/theme';

/**
 * Typed placeholder listings — conform to the shared DTO so swapping in the real
 * repository response is a drop-in. Cover images are left null to exercise the
 * card's empty-image branch without bundling assets.
 */
const PLACEHOLDER_LISTINGS: ReadonlyArray<ListingCardDTO> = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    slug: 'gulshan-garden-loft',
    title: 'Garden Loft in the heart of Gulshan',
    placeType: 'entire',
    category: 'apartment',
    division: 'Dhaka',
    district: 'Dhaka',
    area: 'Gulshan',
    pricePerDay: 7500,
    ratingAverage: 4.8,
    reviewCount: 32,
    coverImageUrl: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    slug: 'coxs-bazar-sea-villa',
    title: "Sea-facing villa steps from Cox's Bazar beach",
    placeType: 'entire',
    category: 'villa',
    division: 'Chattogram',
    district: "Cox's Bazar",
    area: 'Kolatoli',
    pricePerDay: 14500,
    ratingAverage: 4.9,
    reviewCount: 18,
    coverImageUrl: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    slug: 'sylhet-tea-studio',
    title: 'Cosy studio overlooking the Sylhet tea gardens',
    placeType: 'private',
    category: 'studio',
    division: 'Sylhet',
    district: 'Sylhet',
    area: 'Lakkatura',
    pricePerDay: 4200,
    ratingAverage: null,
    reviewCount: 0,
    coverImageUrl: null,
  },
];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      <FlatList
        data={PLACEHOLDER_LISTINGS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ListingCard listing={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              Explore stays
            </Text>
            <Text style={styles.subtitle}>
              Hand-picked homes across Bangladesh — request to book, pay securely, stay
              well.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No stays yet</Text>
            <Text style={styles.emptyBody}>
              New listings appear here as hosts publish them.
            </Text>
          </View>
        }
      />
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
  },
  header: {
    marginBottom: theme.space[5],
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
  separator: {
    height: theme.space[4],
  },
  empty: {
    marginTop: theme.space[6],
    alignItems: 'center',
    gap: theme.space[2],
  },
  emptyTitle: {
    fontFamily: theme.font.family.body,
    fontSize: theme.font.size.lg,
    fontWeight: String(theme.font.weight.semibold) as '600',
    color: theme.color.text.primary,
  },
  emptyBody: {
    fontFamily: theme.font.family.body,
    fontSize: theme.font.size.sm,
    color: theme.color.text.secondary,
    textAlign: 'center',
  },
});
