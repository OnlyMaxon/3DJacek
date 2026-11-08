import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { deviceLabel } from '@/core/device';
import { listScans } from '@/storage/scans-repo';
import { Button } from '@/ui/Button';
import { Logo } from '@/ui/Logo';
import { color, space, type } from '@/ui/theme';

const REASONS: Record<string, string> = {
  'no-lidar': `Сканирование использует LiDAR, а в ${deviceLabel()} его нет. Нужен iPhone 12 Pro или новее — либо iPad Pro 2020 и новее.`,
  'old-ios': 'Нужна iOS 16 или новее — на ней появился RoomPlan.',
  'not-ios': 'Приложение работает только на iPhone и iPad.',
  native: 'Система отказала в сканировании: на этом устройстве RoomPlan недоступен.',
};

/**
 * Тупик, но честный. Лучше объяснить на входе, чем падать посреди скана.
 * Сохранённые сканы при этом открываются — вьюер LiDAR не требует.
 */
export default function Unsupported() {
  const insets = useSafeAreaInsets();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const hasScans = listScans().length > 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.lg }]}>
      <View style={styles.hero}>
        <Logo size={96} stroke={color.textDim} fill={color.textDim} />
        <Text style={styles.title}>Сканирование недоступно</Text>
        <Text style={styles.lead}>{REASONS[reason ?? ''] ?? REASONS['no-lidar']}</Text>
      </View>

      <View style={styles.actions}>
        {hasScans && (
          <Button label="Открыть сохранённые комнаты" onPress={() => router.push('/scans')} />
        )}
        <Button label="Назад" variant="ghost" onPress={() => router.replace('/')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'space-between', paddingHorizontal: space.lg },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: space.md },
  title: { ...type.title, fontSize: 24, color: color.text, marginTop: space.sm, textAlign: 'center' },
  lead: { ...type.body, color: color.textDim, textAlign: 'center', lineHeight: 22, maxWidth: 320 },
  actions: { gap: space.sm },
});
