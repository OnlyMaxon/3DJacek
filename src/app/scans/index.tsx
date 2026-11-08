import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { deleteScan, listScans } from '@/storage/scans-repo';
import type { ScanSummary } from '@/storage/types';
import { color, radius, space, type } from '@/ui/theme';

export default function ScansList() {
  const insets = useSafeAreaInsets();
  const [scans, setScans] = useState<ScanSummary[]>([]);

  // Перечитываем при возврате: во вьюере могли добавить мебель или удалить скан.
  useFocusEffect(useCallback(() => setScans(listScans()), []));

  const confirmDelete = (scan: ScanSummary) =>
    Alert.alert('Удалить комнату?', `«${scan.name}» и вся расставленная мебель исчезнут.`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          deleteScan(scan.id);
          setScans(listScans());
        },
      },
    ]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.md }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Назад</Text>
        </Pressable>
        <Text style={styles.title}>Мои комнаты</Text>
      </View>

      <FlatList
        data={scans}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + space.lg, paddingHorizontal: space.lg }}
        ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
        ListEmptyComponent={<Text style={styles.empty}>Пока ничего не снято.</Text>}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/scans/${item.id}`)}
            onLongPress={() => confirmDelete(item)}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              {item.area} м² · {formatDate(item.createdAt)}
              {item.itemCount > 0 ? ` · мебели: ${item.itemCount}` : ''}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: space.lg, paddingBottom: space.lg, gap: space.sm },
  back: { ...type.label, color: color.textDim },
  title: { ...type.title, color: color.text },
  row: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.xs,
  },
  rowPressed: { opacity: 0.6 },
  name: { ...type.body, fontSize: 17, fontWeight: '600', color: color.text },
  meta: { ...type.mono, color: color.textDim },
  empty: { ...type.body, color: color.textDim, textAlign: 'center', marginTop: space.xl },
});
