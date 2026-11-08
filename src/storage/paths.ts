import { Directory, File, Paths } from 'expo-file-system';

// Раскладка на диске. Всё в Documents — это то, что система не вычищает
// и что попадает в бэкап устройства.
//
// <Documents>/index.json          список сканов без геометрии
// <Documents>/scans/<id>/room.json    нормализованная модель
//                       scene.json    расставленная мебель
//                       raw.json      сырой CapturedRoom
//                       room.usdz     экспорт Apple

export const FILE = {
  room: 'room.json',
  scene: 'scene.json',
  raw: 'raw.json',
  usdz: 'room.usdz',
} as const;

export const scansDir = () => new Directory(Paths.document, 'scans');

export const indexFile = () => new File(Paths.document, 'index.json');

export const scanDir = (id: string) => new Directory(scansDir(), id);

export const scanFile = (id: string, name: string) => new File(scanDir(id), name);
