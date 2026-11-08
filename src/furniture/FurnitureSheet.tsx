import { useEffect, useMemo } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, radius, space, type } from '@/ui/theme';
import { CATALOG, sizeLabel, type FurnitureKind } from './catalog';

type Props = {
  visible: boolean;
  onPick: (id: FurnitureKind) => void;
  onClose: () => void;
};

/**
 * Каталог по кнопке «+». Панель, а не модальное окно: комната должна
 * оставаться видимой, иначе непонятно, куда ты эту мебель ставишь.
 */
export function FurnitureSheet({ visible, onPick, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const slide = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  // pointerEvents снимаем, чтобы скрытая панель не ловила касания сцены.
  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.sheet,
        { paddingBottom: insets.bottom + space.md },
        {
          opacity: slide,
          transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [240, 0] }) }],
        },
      ]}
    >
      <View style={styles.head}>
        <Text style={styles.title}>Что поставим</Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.close}>×</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {CATALOG.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onPick(item.id)}
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
          >
            <Text style={styles.chipLabel}>{item.label}</Text>
            <Text style={styles.chipSize}>{sizeLabel(item.size)}</Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: color.surface,
    borderTopWidth: 1,
    borderTopColor: color.line,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    paddingHorizontal: space.md,
    paddingTop: space.md,
    gap: space.md,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...type.label, color: color.text, fontSize: 15 },
  close: { color: color.textDim, fontSize: 26, lineHeight: 26 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.sm,
    backgroundColor: color.surfaceHigh,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    gap: 2,
  },
  chipPressed: { opacity: 0.5 },
  chipLabel: { ...type.body, fontSize: 14, fontWeight: '600', color: color.text },
  chipSize: { ...type.mono, color: color.textDim },
});
