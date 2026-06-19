/**
 * TabBarIcon.tsx — the five bottom-nav glyphs (design.md §4.6).
 *
 * Dependency-light: instead of pulling an icon font, each tab uses a compact text
 * glyph that swaps between an outline form (inactive) and a filled form (active),
 * satisfying "active item = filled icon" without color being the only affordance
 * (design.md §6.6 / §4.6). Color comes from semantic tokens via `theme` — never a
 * raw hex. The glyph is marked decorative (importantForAccessibility="no") because
 * the tab's own label provides the accessible name.
 *
 * States handled by the parent <Tabs.Screen>: default / focus (active route) /
 * pressed (Tabs button) — this component only renders the default/active visual.
 */
import { Text } from 'react-native';
import { theme } from '@/theme/theme';

export type TabName = 'explore' | 'booking' | 'inbox' | 'alerts' | 'profile';

/** [inactive outline, active filled] glyph pair per tab. */
const GLYPHS: Record<TabName, readonly [string, string]> = {
  explore: ['⌕', '⌖'],
  booking: ['▢', '▣'],
  inbox: ['✉', '✉'],
  alerts: ['◌', '●'],
  profile: ['○', '◉'],
};

interface TabBarIconProps {
  name: TabName;
  focused: boolean;
}

export function TabBarIcon({ name, focused }: TabBarIconProps) {
  const [outline, filled] = GLYPHS[name];
  return (
    <Text
      importantForAccessibility="no"
      accessibilityElementsHidden
      style={{
        fontSize: theme.font.size.lg,
        lineHeight: theme.font.line.lg,
        color: focused ? theme.color.text.brand : theme.color.text.muted,
      }}
    >
      {focused ? filled : outline}
    </Text>
  );
}
