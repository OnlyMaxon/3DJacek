import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FurnitureSheet } from '@/furniture/FurnitureSheet';
import { catalogItem, type FurnitureKind } from '@/furniture/catalog';
import { Viewer } from '@/scene/Viewer';
import { readScan, saveItems } from '@/storage/scans-repo';
import { useEditor } from '@/store/editor-store';
import { IconButton } from '@/ui/Button';
import { color, radius, space, type } from '@/ui/theme';

const ROTATE_STEP = Math.PI / 12; // 15° — достаточно мелко, чтобы ровно поставить к стене

export default function ScanViewer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const { room, items, selectedId, open, close, select, add, move, rotate, remove, dirty, markSaved } =
    useEditor();

  const [sheet, setSheet] = useState(false);

  // Чтение синхронное, так что запись берём прямо в рендере — локальный стейт
  // под «загружается / не найдено» тут был бы лишней ступенькой.
  const record = useMemo(() => (id ? readScan(id) : null), [id]);

  useEffect(() => {
    if (record) open(record);
    return close;
  }, [record, open, close]);

  // Автосейв с задержкой: драг мебели заканчивается десятками правок подряд,
  // писать файл на каждую — незачем.
  useEffect(() => {
    if (!dirty || !id) return;
    const timer = setTimeout(() => {
      saveItems(id, items);
      markSaved();
    }, 400);
    return () => clearTimeout(timer);
  }, [dirty, items, id, markSaved]);

  if (!record) {
    return (
      <View style={styles.center}>
        <Text style={styles.note}>Эта комната больше не найдена.</Text>
        <Pressable onPress={() => router.replace('/')} hitSlop={12}>
          <Text style={styles.back}>На главный</Text>
        </Pressable>
      </View>
    );
  }

  if (!room) return <View style={styles.center} />;

  const selected = items.find((i) => i.id === selectedId) ?? null;

  const addItem = (catalogId: FurnitureKind) => {
    add(catalogId);
    setSheet(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.root}>
      <Viewer room={room} items={items} selectedId={selectedId} onSelect={select} onMove={move} />

      {/* шапка поверх сцены: габариты комнаты здесь полезнее названия */}
      <View style={[styles.top, { paddingTop: insets.top + space.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Назад</Text>
        </Pressable>
        <Text style={styles.dims}>
          {room.bounds.width.toFixed(2)} × {room.bounds.depth.toFixed(2)} м, высота{' '}
          {room.bounds.height.toFixed(2)} м
        </Text>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.md }]}>
        {selected ? (
          <View style={styles.selectionBar}>
            <Text style={styles.selectedLabel}>{catalogItem(selected.catalogId).label}</Text>
            <View style={styles.tools}>
              <IconButton glyph="⟲" onPress={() => rotate(selected.id, -ROTATE_STEP)} />
              <IconButton glyph="⟳" onPress={() => rotate(selected.id, ROTATE_STEP)} />
              <IconButton
                glyph="×"
                onPress={() => {
                  remove(selected.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
                }}
              />
            </View>
            <Text style={styles.hint}>Тащи пальцем, чтобы переставить</Text>
          </View>
        ) : (
          !sheet && (
            <View style={styles.addRow}>
              <IconButton glyph="+" onPress={() => setSheet(true)} />
            </View>
          )
        )}
      </View>

      <FurnitureSheet visible={sheet} onPick={addItem} onClose={() => setSheet(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  note: { ...type.body, color: color.textDim },
  back: { ...type.label, color: color.text },
  top: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    top: 0,
    gap: space.xs,
  },
  dims: { ...type.mono, color: color.textDim },
  bottom: { position: 'absolute', left: space.lg, right: space.lg, bottom: 0 },
  addRow: { alignItems: 'flex-end' },
  selectionBar: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.sm,
    alignItems: 'center',
  },
  selectedLabel: { ...type.label, color: color.text, fontSize: 15 },
  tools: { flexDirection: 'row', gap: space.sm },
  hint: { ...type.mono, color: color.textDim },
});
