import type { Vec3 } from '@/storage/types';
import type { CatalogItem, FurnitureKind } from './catalog';

/** Один бокс модели. Начало координат — центр нижней грани предмета. */
export type Part = { size: Vec3; position: Vec3 };

/**
 * Мебель собирается из боксов. Не ради экономии — так и задумано:
 * белый бокс с чёрными рёбрами честно показывает занимаемый объём и
 * не притворяется фотореализмом, которого у нас всё равно нет.
 *
 * Все модели параметрические от габаритов каталога: поменял размер — модель
 * пересчиталась, править части руками не нужно.
 */
export function buildParts(item: CatalogItem): Part[] {
  return BUILDERS[item.id](item.size);
}

const box = (size: Vec3, position: Vec3): Part => ({ size, position });

const legs = (w: number, d: number, h: number, t: number): Part[] => {
  const x = w / 2 - t / 2 - 0.02;
  const z = d / 2 - t / 2 - 0.02;
  return [
    [x, z],
    [-x, z],
    [x, -z],
    [-x, -z],
  ].map(([lx, lz]) => box({ x: t, y: h, z: t }, { x: lx, y: h / 2, z: lz }));
};

const BUILDERS: Record<FurnitureKind, (s: Vec3) => Part[]> = {
  chair: ({ x: w, y: h, z: d }) => {
    const seatH = h * 0.5;
    const seatT = 0.06;
    return [
      ...legs(w, d, seatH - seatT, 0.045),
      box({ x: w, y: seatT, z: d }, { x: 0, y: seatH - seatT / 2, z: 0 }),
      // спинка прижата к задней кромке
      box({ x: w, y: h - seatH, z: 0.06 }, { x: 0, y: seatH + (h - seatH) / 2, z: -d / 2 + 0.03 }),
    ];
  },

  table: ({ x: w, y: h, z: d }) => {
    const topT = 0.05;
    return [
      ...legs(w, d, h - topT, 0.07),
      box({ x: w, y: topT, z: d }, { x: 0, y: h - topT / 2, z: 0 }),
    ];
  },

  sofa: ({ x: w, y: h, z: d }) => {
    const baseH = h * 0.42;
    const armW = 0.18;
    return [
      box({ x: w, y: baseH, z: d }, { x: 0, y: baseH / 2, z: 0 }),
      // подушки чуть уже корпуса — так читается посадочное место
      box({ x: w - armW * 2 - 0.04, y: 0.1, z: d - 0.22 }, { x: 0, y: baseH + 0.05, z: 0.06 }),
      box({ x: w, y: h - baseH, z: 0.2 }, { x: 0, y: baseH + (h - baseH) / 2, z: -d / 2 + 0.1 }),
      box({ x: armW, y: h - baseH - 0.12, z: d }, { x: (w - armW) / 2, y: baseH + (h - baseH - 0.12) / 2, z: 0 }),
      box({ x: armW, y: h - baseH - 0.12, z: d }, { x: -(w - armW) / 2, y: baseH + (h - baseH - 0.12) / 2, z: 0 }),
    ];
  },

  bed: ({ x: w, y: h, z: d }) => {
    const baseH = h * 0.55;
    return [
      box({ x: w, y: baseH, z: d }, { x: 0, y: baseH / 2, z: 0 }),
      box({ x: w - 0.06, y: h - baseH, z: d - 0.06 }, { x: 0, y: baseH + (h - baseH) / 2, z: 0 }),
      // спинка выше матраса — иначе кровать не отличить от подиума
      box({ x: w, y: h * 0.9, z: 0.08 }, { x: 0, y: (h * 0.9) / 2, z: -d / 2 - 0.04 }),
    ];
  },

  wardrobe: ({ x: w, y: h, z: d }) => {
    const half = w / 2 - 0.008; // зазор между створками даёт вертикальную линию
    return [
      box({ x: half, y: h, z: d }, { x: -(half / 2 + 0.008), y: h / 2, z: 0 }),
      box({ x: half, y: h, z: d }, { x: half / 2 + 0.008, y: h / 2, z: 0 }),
    ];
  },

  nightstand: ({ x: w, y: h, z: d }) => {
    const plinth = 0.06;
    const bodyH = h - plinth;
    return [
      box({ x: w - 0.08, y: plinth, z: d - 0.08 }, { x: 0, y: plinth / 2, z: 0 }),
      box({ x: w, y: bodyH / 2 - 0.006, z: d }, { x: 0, y: plinth + bodyH / 4, z: 0 }),
      box({ x: w, y: bodyH / 2 - 0.006, z: d }, { x: 0, y: plinth + (bodyH * 3) / 4, z: 0 }),
    ];
  },

  lamp: ({ x: w, y: h, z: d }) => {
    const shadeH = h * 0.17;
    return [
      box({ x: w, y: 0.03, z: d }, { x: 0, y: 0.015, z: 0 }),
      box({ x: 0.04, y: h - shadeH, z: 0.04 }, { x: 0, y: (h - shadeH) / 2, z: 0 }),
      box({ x: w * 0.9, y: shadeH, z: d * 0.9 }, { x: 0, y: h - shadeH / 2, z: 0 }),
    ];
  },
};
