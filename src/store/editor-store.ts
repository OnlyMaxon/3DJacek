import { create } from 'zustand';

import { catalogItem, type FurnitureKind } from '@/furniture/catalog';
import type { PlacedItem, RoomModel, ScanRecord, Vec3 } from '@/storage/types';
import { newId } from '@/core/ids';

type EditorState = {
  scanId: string | null;
  room: RoomModel | null;
  items: PlacedItem[];
  selectedId: string | null;
  /** есть несохранённые правки — за автосейв отвечает экран, не стор */
  dirty: boolean;

  open: (record: ScanRecord) => void;
  close: () => void;
  select: (id: string | null) => void;
  add: (catalogId: FurnitureKind) => void;
  move: (id: string, position: Vec3) => void;
  rotate: (id: string, delta: number) => void;
  remove: (id: string) => void;
  markSaved: () => void;
};

/**
 * Состояние редактора сцены. Zustand, а не контекст: во время перетаскивания
 * мебели апдейты идут десятками в секунду, и ререндер всего дерева тут недопустим.
 *
 * Сам драг стор не трогает вообще — он двигает объект three.js напрямую и
 * пишет сюда один раз, когда палец отпустили.
 */
export const useEditor = create<EditorState>((set, get) => ({
  scanId: null,
  room: null,
  items: [],
  selectedId: null,
  dirty: false,

  open: (record) =>
    set({
      scanId: record.id,
      room: record.room,
      items: record.items,
      selectedId: null,
      dirty: false,
    }),

  close: () => set({ scanId: null, room: null, items: [], selectedId: null, dirty: false }),

  select: (id) => set({ selectedId: id }),

  add: (catalogId) => {
    const { room, items } = get();
    if (!room) return;

    const item: PlacedItem = {
      id: newId(),
      catalogId,
      position: freeSpot(room, items, catalogId),
      rotationY: 0,
    };

    set({ items: [...items, item], selectedId: item.id, dirty: true });
  },

  move: (id, position) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, position: clampToRoom(s.room, i, position) } : i)),
      dirty: true,
    })),

  rotate: (id, delta) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, rotationY: i.rotationY + delta } : i)),
      dirty: true,
    })),

  remove: (id) =>
    set((s) => ({
      items: s.items.filter((i) => i.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
      dirty: true,
    })),

  markSaved: () => set({ dirty: false }),
}));

/**
 * Новый предмет ставим в центр комнаты, но со смещением по спирали — иначе
 * пять стульев окажутся друг в друге и юзер решит, что кнопка не работает.
 */
function freeSpot(room: RoomModel, items: PlacedItem[], catalogId: FurnitureKind): Vec3 {
  const step = 0.5;
  const n = items.filter((i) => i.catalogId === catalogId).length;
  const angle = n * 2.4; // не кратно π — точки не повторяются
  const r = n === 0 ? 0 : step * Math.ceil(n / 4);

  return clampToRoom(room, { catalogId } as PlacedItem, {
    x: Math.cos(angle) * r,
    y: 0,
    z: Math.sin(angle) * r,
  });
}

/** Мебель не должна уезжать за стены: держим её габаритами внутри коробки. */
function clampToRoom(room: RoomModel | null, item: PlacedItem, p: Vec3): Vec3 {
  if (!room) return p;

  const { size } = catalogItem(item.catalogId);
  const limitX = Math.max(0, room.bounds.width / 2 - size.x / 2);
  const limitZ = Math.max(0, room.bounds.depth / 2 - size.z / 2);

  return {
    x: clamp(p.x, -limitX, limitX),
    y: 0, // мебель всегда на полу
    z: clamp(p.z, -limitZ, limitZ),
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
