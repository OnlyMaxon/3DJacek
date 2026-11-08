import { File } from 'expo-file-system';
import { ExpoRoomplan, ExportType, ScanStatus } from 'expo-roomplan';
import { useCallback, useEffect, useState } from 'react';

import { isUnsupportedError } from '@/core/device';
import { createScan, ensureStorage, listScans } from '@/storage/scans-repo';
import type { ScanRecord } from '@/storage/types';
import type { RawCapturedRoom } from './captured-room';
import { parseCapturedRoom } from './parse';

export type ScannerState =
  | 'idle'
  | 'scanning' // открыт нативный UI Apple, событий оттуда не приходит
  | 'saving' // модалка закрылась, разбираем и пишем на диск
  | 'done'
  | 'canceled'
  | 'unsupported'
  | 'error';

/** Полезная нагрузка единственного события нативного модуля. */
type DismissEvent = {
  status?: ScanStatus;
  scanUrl?: string | null;
  jsonUrl?: string | null;
  errorMessage?: string | null;
};

/**
 * Обёртка над expo-roomplan: превращает «нативная модалка закрылась»
 * в готовую запись на диске.
 *
 * Подписываемся на нативное событие напрямую, а не через useRoomPlan из пакета:
 * тот держит собственную копию состояния и сыплет console.log на каждый скан.
 *
 * Прогресса сканирования нет и быть не может — пока Apple показывает свой UI,
 * мы о происходящем не знаем ничего. Событие приходит ровно одно, на закрытии.
 */
export function useScanner() {
  const [state, setState] = useState<ScannerState>('idle');
  const [record, setRecord] = useState<ScanRecord | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    const sub = ExpoRoomplan.addListener?.('onDismissEvent', (event: DismissEvent) => {
      if (event.status === ScanStatus.Canceled) {
        setState('canceled');
        return;
      }

      if (event.status === ScanStatus.Error || !event.jsonUrl) {
        setProblem(event.errorMessage ?? 'Сканирование не удалось');
        setState(isUnsupportedError(event.errorMessage) ? 'unsupported' : 'error');
        return;
      }

      setState('saving');
      try {
        setRecord(persist(event.jsonUrl, event.scanUrl ?? null));
        setState('done');
      } catch (e) {
        setProblem(e instanceof Error ? e.message : 'Не удалось разобрать скан');
        setState('error');
      }
    });

    return () => sub?.remove();
  }, []);

  const start = useCallback(async () => {
    setProblem(null);
    setRecord(null);
    setState('scanning');

    try {
      // Имя уникальное: оно же имя файла в temp-каталоге.
      // sendFileLoc — без него нативный слой покажет share sheet вместо путей.
      await ExpoRoomplan.startCapture(`room-${Date.now()}`, ExportType.Parametric, true);
    } catch (e) {
      setProblem(e instanceof Error ? e.message : 'Не удалось открыть камеру');
      setState('error');
    }
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setProblem(null);
    setRecord(null);
  }, []);

  return { start, reset, state, record, problem };
}

// Файлы из temp забираем сразу: система чистит этот каталог когда захочет.
function persist(jsonUri: string, usdzUri: string | null): ScanRecord {
  ensureStorage();

  const raw = JSON.parse(new File(jsonUri).textSync()) as RawCapturedRoom;
  const room = parseCapturedRoom(raw);

  return createScan({
    name: `Комната ${listScans().length + 1}`,
    room,
    raw,
    usdzUri,
  });
}
