import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { checkCapability } from '@/core/device';
import { useScanner } from '@/scan/useScanner';
import { listScans } from '@/storage/scans-repo';
import { Button } from '@/ui/Button';
import { Logo } from '@/ui/Logo';
import { color, space, type } from '@/ui/theme';

/**
 * Первый экран. Регистрации нет, аккаунта нет — одна кнопка, которая открывает
 * камеру. Автостарт сканирования на запуске не делаем сознательно: Apple режет
 * на ревью запрос камеры без объяснения, и из нативной модалки некуда вернуться
 * к сохранённым сканам. Если автостарт всё же нужен — вызвать start() в useEffect.
 */
export default function Home() {
  const insets = useSafeAreaInsets();
  const { start, reset, state, record, problem } = useScanner();
  const [count, setCount] = useState(0);

  // Гейт по устройству: без LiDAR сканировать нечем, честно говорим об этом.
  useEffect(() => {
    const capability = checkCapability();
    if (capability !== 'ok') router.replace(`/unsupported?reason=${capability}`);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setCount(listScans().length);
      reset();
    }, [reset]),
  );

  // Скан готов и лежит на диске — сразу открываем его во вьюере.
  useEffect(() => {
    if (state === 'done' && record) router.push(`/scans/${record.id}`);
    if (state === 'unsupported') router.replace('/unsupported?reason=native');
  }, [state, record]);

  const busy = state === 'scanning' || state === 'saving';

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.lg }]}>
      <View style={styles.hero}>
        <Logo size={120} />
        <Text style={styles.title}>Jacek 3D</Text>
        <Text style={styles.lead}>
          Обойди комнату с телефоном — получишь её объёмную модель. Потом поставишь внутрь мебель и
          посмотришь, встанет ли.
        </Text>
      </View>

      <View style={styles.actions}>
        {state === 'error' && <Text style={styles.problem}>{problem}</Text>}
        {state === 'canceled' && <Text style={styles.hint}>Сканирование отменено</Text>}

        <Button
          label={state === 'saving' ? 'Собираем модель' : 'Снять комнату'}
          onPress={start}
          busy={busy}
        />

        {count > 0 && (
          <Button
            label={`Мои комнаты · ${count}`}
            variant="ghost"
            onPress={() => router.push('/scans')}
          />
        )}

        <Text style={styles.footnote}>
          Снимай небольшое помещение целиком, не торопясь. Всё остаётся в памяти телефона.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'space-between', paddingHorizontal: space.lg },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: space.md },
  title: { ...type.title, color: color.text, marginTop: space.sm },
  lead: { ...type.body, color: color.textDim, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  actions: { gap: space.sm },
  problem: { ...type.body, color: color.text, textAlign: 'center', marginBottom: space.xs },
  hint: { ...type.body, color: color.textDim, textAlign: 'center', marginBottom: space.xs },
  footnote: {
    ...type.body,
    fontSize: 13,
    color: color.textDim,
    textAlign: 'center',
    marginTop: space.sm,
    lineHeight: 18,
  },
});
