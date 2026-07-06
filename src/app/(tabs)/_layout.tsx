import { Tabs, usePathname } from 'expo-router';
import { Text } from 'react-native';
import { theme } from '@/constants/theme';

// expo-router v56 doesn't ship @react-navigation/native as an installable
// dependency (it's vendored internally), so getFocusedRouteNameFromRoute isn't
// reachable. usePathname() is the public, stable way to know which nested
// route is focused. ponytail: pathname string match, revisit if route names change.
const HIDE_TAB_BAR_ON = ['/', /^\/reader\//];

export default function TabsLayout() {
  const pathname = usePathname();
  const hideTabBar = HIDE_TAB_BAR_ON.some((p) =>
    typeof p === 'string' ? pathname === p : p.test(pathname),
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: hideTabBar ? { display: 'none' } : undefined,
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⌂</Text>,
        }}
      />
      <Tabs.Screen
        name="my-jar"
        options={{
          title: 'My Jar',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>♥</Text>,
        }}
      />
    </Tabs>
  );
}
