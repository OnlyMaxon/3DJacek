import { Directory, File } from 'expo-file-system';

import { newId } from '@/core/ids';
import { FILE, indexFile, scanDir, scanFile, scansDir } from './paths';
import type { PlacedItem, RoomModel, ScanRecord, ScanSummary } from './types';

/**
 * Единственная точка доступа к сканам. Выше этого слоя про файлы никто не знает.
 * Сеть не используется вообще — всё лежит в Documents устройства.
 */

// Приложение могут убить в любой момент, поэтому пишем через .tmp и переименование:
// либо файл старый целиком, либо новый целиком, половинчатого состояния не бывает.
function writeJson(dir: Directory, name: string, data: unknown): void {
  if (!dir.exists) dir.create({ intermediates: true });

  const tmp = new File(dir, `${name}.tmp`);
  const target = new File(dir, name);

  if (tmp.exists) tmp.delete();
  tmp.create();
  tmp.write(JSON.stringify(data));

  if (target.exists) target.delete();
  tmp.move(target);
}

function readJson<T>(file: File): T | null {
  if (!file.exists) return null;
  try {
    return JSON.parse(file.textSync()) as T;
  } catch {
    // Битый файл не должен ронять весь список — просто считаем, что его нет.
    return null;
  }
}

export function listScans(): ScanSummary[] {
  const list = readJson<ScanSummary[]>(indexFile()) ?? [];
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function writeIndex(list: ScanSummary[]): void {
  const dir = indexFile().parentDirectory;
  writeJson(dir, 'index.json', list);
}

function patchIndex(id: string, patch: Partial<ScanSummary>): void {
  writeIndex(listScans().map((s) => (s.id === id ? { ...s, ...patch } : s)));
}

export function readScan(id: string): ScanRecord | null {
  const summary = listScans().find((s) => s.id === id);
  const room = readJson<RoomModel>(scanFile(id, FILE.room));
  if (!summary || !room) return null;

  const usdz = scanFile(id, FILE.usdz);

  return {
    ...summary,
    room,
    items: readJson<PlacedItem[]>(scanFile(id, FILE.scene)) ?? [],
    usdzPath: usdz.exists ? usdz.uri : null,
  };
}

type NewScan = {
  name: string;
  room: RoomModel;
  raw: unknown;
  /** usdz лежит во временном каталоге — забираем себе, пока он жив */
  usdzUri?: string | null;
};

export function createScan({ name, room, raw, usdzUri }: NewScan): ScanRecord {
  const id = newId();
  const dir = scanDir(id);
  dir.create({ intermediates: true });

  writeJson(dir, FILE.room, room);
  writeJson(dir, FILE.scene, []);
  writeJson(dir, FILE.raw, raw);

  // usdz нам сейчас не нужен для рендера, но это единственный переносимый
  // формат модели — пригодится для Quick Look и шаринга.
  let usdzPath: string | null = null;
  if (usdzUri) {
    try {
      const src = new File(usdzUri);
      if (src.exists) {
        src.copy(new File(dir, FILE.usdz));
        usdzPath = new File(dir, FILE.usdz).uri;
      }
    } catch {
      // Не смогли забрать usdz — скан всё равно рабочий, молчим.
    }
  }

  const summary: ScanSummary = {
    id,
    name,
    createdAt: new Date().toISOString(),
    area: round2(room.bounds.width * room.bounds.depth),
    itemCount: 0,
  };

  writeIndex([summary, ...listScans()]);

  return { ...summary, room, items: [], usdzPath };
}

export function saveItems(id: string, items: PlacedItem[]): void {
  writeJson(scanDir(id), FILE.scene, items);
  patchIndex(id, { itemCount: items.length });
}

export function renameScan(id: string, name: string): void {
  patchIndex(id, { name: name.trim() || 'Без названия' });
}

export function deleteScan(id: string): void {
  const dir = scanDir(id);
  if (dir.exists) dir.delete();
  writeIndex(listScans().filter((s) => s.id !== id));
}

// Первый запуск: каталога ещё нет. Вызываем до любого чтения.
export function ensureStorage(): void {
  const dir = scansDir();
  if (!dir.exists) dir.create({ intermediates: true });
}

const round2 = (n: number) => Math.round(n * 100) / 100;
