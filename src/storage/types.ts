export type Vec3 = { x: number; y: number; z: number };

export type SurfaceKind = 'wall' | 'window' | 'door' | 'opening' | 'floor';

export type Confidence = 'low' | 'medium' | 'high';

/** Плоский элемент комнаты. Позиция — центр, поворот — только вокруг Y. */
export type Surface = {
  id: string;
  kind: SurfaceKind;
  size: Vec3;
  position: Vec3;
  rotationY: number;
  confidence: Confidence;
};

/** Мебель, которую RoomPlan распознал сам. Показываем, но не даём трогать. */
export type Detected = {
  id: string;
  category: string;
  size: Vec3;
  position: Vec3;
  rotationY: number;
};

/**
 * Нормализованная комната: метры, Y вверх, начало координат — центр пола.
 * version нужен, чтобы пережить смену формата без потери старых сканов.
 */
export type RoomModel = {
  version: 1;
  bounds: { width: number; depth: number; height: number };
  surfaces: Surface[];
  detected: Detected[];
};

/** То, что пользователь поставил сам. y всегда 0 — мебель стоит на полу. */
export type PlacedItem = {
  id: string;
  catalogId: string;
  position: Vec3;
  rotationY: number;
};

/** Строка в index.json — без тяжёлой геометрии, чтобы список открывался мгновенно. */
export type ScanSummary = {
  id: string;
  name: string;
  createdAt: string;
  area: number; // м², для подписи в списке
  itemCount: number;
};

export type ScanRecord = ScanSummary & {
  room: RoomModel;
  items: PlacedItem[];
  usdzPath: string | null;
};
