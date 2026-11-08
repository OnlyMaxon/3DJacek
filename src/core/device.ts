import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * RoomPlan работает только там, где есть LiDAR. Точный ответ знает
 * нативный RoomCaptureSession.isSupported, но наружу пакет его не отдаёт.
 * Поэтому здесь эвристика для предполётного экрана, а последнее слово —
 * за нативной ошибкой сканирования (см. isUnsupportedError).
 */

// Машинные id устройств с LiDAR. Список заведомо отстанет от новых релизов —
// именно для этого ниже есть фоллбек по имени модели.
const LIDAR_MODELS = new Set([
  'iPhone13,3', 'iPhone13,4', // 12 Pro / Pro Max
  'iPhone14,2', 'iPhone14,3', // 13 Pro / Pro Max
  'iPhone15,2', 'iPhone15,3', // 14 Pro / Pro Max
  'iPhone16,1', 'iPhone16,2', // 15 Pro / Pro Max
  'iPhone17,1', 'iPhone17,2', // 16 Pro / Pro Max
  'iPhone18,1', 'iPhone18,2', // 17 Pro / Pro Max
]);

// iPad Pro с LiDAR — это 2020 год и новее, по семействам.
const LIDAR_IPAD_FAMILIES = ['iPad8,9', 'iPad8,10', 'iPad8,11', 'iPad8,12', 'iPad13,', 'iPad14,', 'iPad16,'];

export type Capability = 'ok' | 'no-lidar' | 'old-ios' | 'not-ios';

export function checkCapability(): Capability {
  if (Platform.OS !== 'ios') return 'not-ios';

  const major = parseInt(String(Platform.Version), 10);
  if (Number.isFinite(major) && major < 16) return 'old-ios';

  return hasLidar() ? 'ok' : 'no-lidar';
}

function hasLidar(): boolean {
  const id = Device.modelId ?? '';
  const name = Device.modelName ?? '';

  if (LIDAR_MODELS.has(id)) return true;
  if (LIDAR_IPAD_FAMILIES.some((f) => id.startsWith(f))) return true;

  // Фоллбек для устройств новее нашего списка: LiDAR ставят только в Pro-линейку.
  // Ложноположительный ответ не страшен — сканирование просто вернёт нативную ошибку.
  return /\bPro\b/.test(name) && !/iPhone(1[0-2]|[1-9]),/.test(id);
}

// Нативный слой отвечает текстом, а не кодом. Ловим именно отказ по устройству,
// чтобы не путать его с отменой или сбоем сессии.
export function isUnsupportedError(message: string | null | undefined): boolean {
  return !!message && /not supported/i.test(message);
}

export const deviceLabel = () => Device.modelName ?? 'это устройство';
