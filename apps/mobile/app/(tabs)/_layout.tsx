/**
 * (tabs)/_layout.tsx — bottom-nav navigator (design.md §4.6).
 *
 * Five tabs mirroring the web bottom nav: Explore / Booking / Inbox / Alerts /
 * Profile. Active item uses text.brand + filled glyph + label; inactive uses
 * text.muted (color is never the sole signal — the glyph also changes form).
 * `accessibilityRole="tab"` + the active `tabBarAccessibilityLabel` and expo-router's
 * focused state give the web's `aria-current="page"` equivalent. Targets are ≥44px
 * (design.md §6.4) via the tab bar height + item padding.
 */
import { Tabs } from 'expo-router';
import { TabBarIcon, type TabName } from '@/components/TabBarIcon';
import { theme } from '@/theme/theme';

const TABS: ReadonlyArray<{ name: string; title: string; icon: TabName }> = [
  { name: 'index', title: 'Explore', icon: 'explore' },
  { name: 'booking', title: 'Booking', icon: 'booking' },
  { name: 'inbox', title: 'Inbox', icon: 'inbox' },
  { name: 'alerts', title: 'Alerts', icon: 'alerts' },
  { name: 'profile', title: 'Profile', icon: 'profile' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.color.text.brand,
        tabBarInactiveTintColor: theme.color.text.muted,
        tabBarStyle: {
          backgroundColor: theme.color.surface.raised,
          borderTopColor: theme.color.border.default,
          borderTopWidth: 1,
          height: 64,
          paddingTop: theme.space[2],
          paddingBottom: theme.space[2],
        },
        tabBarLabelStyle: {
          fontFamily: theme.font.family.body,
          fontSize: theme.font.size.xs,
          fontWeight: String(theme.font.weight.medium) as '500',
        },
        tabBarItemStyle: {
          minHeight: theme.hitTarget,
          justifyContent: 'center',
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarAccessibilityLabel: tab.title,
            tabBarIcon: ({ focused }) => <TabBarIcon name={tab.icon} focused={focused} />,
          }}
        />
      ))}
    </Tabs>
  );
}
