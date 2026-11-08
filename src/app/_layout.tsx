import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ensureStorage } from '@/storage/scans-repo';
import { color } from '@/ui/theme';

export default function RootLayout() {
  // Первый запуск: каталога сканов ещё нет. Дешевле создать его здесь один раз,
  // чем проверять существование в каждом чтении.
  useEffect(() => {
    ensureStorage();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: color.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: color.bg },
            animation: 'fade',
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
