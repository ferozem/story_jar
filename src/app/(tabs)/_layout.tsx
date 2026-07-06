import { Tabs, usePathname } from 'expo-router';
import { Text, type ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { theme } from '@/constants/theme';

// expo-router v56 doesn't ship @react-navigation/native as an installable
// dependency (it's vendored internally), so getFocusedRouteNameFromRoute isn't
// reachable. usePathname() is the public, stable way to know which nested
// route is focused. ponytail: pathname string match, revisit if route names change.
const HIDE_TAB_BAR_ON = ['/', /^\/reader\//];

function SearchIcon({ color }: { color: ColorValue }) {
  const stroke = String(color);

  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={6.5} stroke={stroke} strokeWidth={2.2} />
      <Path d="M16 16L21 21" stroke={stroke} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

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
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <SearchIcon color={color} />,
        }}
      />
    </Tabs>
  );
}
