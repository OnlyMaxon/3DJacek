import type { Vec3 } from '@/storage/types';

export type FurnitureKind = 'chair' | 'table' | 'sofa' | 'wardrobe' | 'nightstand' | 'lamp' | 'bed';

export type CatalogItem = {
  id: FurnitureKind;
  label: string;
  /** габариты в метрах: ширина × высота × глубина */
  size: Vec3;
};

/**
 * Каталог намеренно короткий и захардкоженный. Бесплатных API с мебелью нет,
 * а для вопроса «встанет ли тут стул» нужны честные габариты, а не текстуры.
 * Размеры — средние по рынку, не выдуманные.
 */
export const CATALOG: CatalogItem[] = [
  { id: 'chair', label: 'Стул', size: { x: 0.45, y: 0.9, z: 0.45 } },
  { id: 'table', label: 'Стол', size: { x: 1.2, y: 0.75, z: 0.8 } },
  { id: 'sofa', label: 'Диван', size: { x: 1.9, y: 0.8, z: 0.9 } },
  { id: 'bed', label: 'Кровать', size: { x: 1.6, y: 0.55, z: 2.0 } },
  { id: 'wardrobe', label: 'Шкаф', size: { x: 1.0, y: 2.0, z: 0.6 } },
  { id: 'nightstand', label: 'Тумба', size: { x: 0.45, y: 0.55, z: 0.4 } },
  { id: 'lamp', label: 'Лампа', size: { x: 0.3, y: 1.6, z: 0.3 } },
];

const INDEX = new Map(CATALOG.map((i) => [i.id, i]));

export function catalogItem(id: string): CatalogItem {
  // Неизвестный id может прийти только из старого scene.json — отдаём стул,
  // чтобы скан открылся, а не упал.
  return INDEX.get(id as FurnitureKind) ?? CATALOG[0];
}

export const sizeLabel = (s: Vec3) =>
  `${Math.round(s.x * 100)}×${Math.round(s.z * 100)}×${Math.round(s.y * 100)} см`;
