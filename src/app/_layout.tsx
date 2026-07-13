import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppDataProvider } from '@/state/AppData';
import { ContentProvider } from '@/state/ContentProvider';

export default function RootLayout() {
  return (
    <ContentProvider>
      <AppDataProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </AppDataProvider>
    </ContentProvider>
  );
}
