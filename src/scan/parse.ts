import type { Confidence, Detected, RoomModel, Surface, SurfaceKind, Vec3 } from '@/storage/types';
import type { RawCapturedRoom, RawCategory, RawElement } from './captured-room';

/**
 * Сырой CapturedRoom → наша модель комнаты.
 *
 * Делаем здесь три вещи, которые дальше по приложению никого не касаются:
 *  1. матрицы 4×4 → позиция + поворот вокруг Y
 *  2. категории в двух разных кодировках → один строковый kind
 *  3. перенос начала координат: RoomPlan ставит ноль туда, где юзер начал
 *     сканировать, нам нужен центр пола — иначе камера смотрит мимо комнаты
 */
export function parseCapturedRoom(raw: RawCapturedRoom): RoomModel {
  const surfaces: Surface[] = [
    ...toSurfaces(raw.walls, 'wall'),
    ...toSurfaces(raw.windows, 'window'),
    ...toSurfaces(raw.doors, 'door'),
    ...toSurfaces(raw.openings, 'opening'),
    ...toSurfaces(raw.floors, 'floor'),
  ];

  const detected: Detected[] = (raw.objects ?? []).map((el, i) => {
    const { position, rotationY } = decodeTransform(el.transform);
    return {
      id: el.identifier ?? `object-${i}`,
      category: categoryName(el.category) ?? 'object',
      size: decodeSize(el.dimensions),
      position,
      rotationY,
    };
  });

  // Габариты считаем по стенам: окна и двери лежат в их плоскости и границ не меняют,
  // а распознанная мебель может торчать за стену и раздуть коробку.
  const walls = surfaces.filter((s) => s.kind === 'wall');
  const box = unionBox(walls.length ? walls : surfaces);

  // Сдвиг: центр по XZ в ноль, пол в y = 0.
  const shift: Vec3 = {
    x: -(box.min.x + box.max.x) / 2,
    y: -box.min.y,
    z: -(box.min.z + box.max.z) / 2,
  };

  return {
    version: 1,
    bounds: {
      width: round3(box.max.x - box.min.x),
      depth: round3(box.max.z - box.min.z),
      height: round3(box.max.y - box.min.y),
    },
    surfaces: surfaces.map((s) => ({ ...s, position: add(s.position, shift) })),
    detected: detected.map((d) => ({ ...d, position: add(d.position, shift) })),
  };
}

function toSurfaces(list: RawElement[] | undefined, kind: SurfaceKind): Surface[] {
  return (list ?? []).map((el, i) => {
    const { position, rotationY } = decodeTransform(el.transform);
    return {
      id: el.identifier ?? `${kind}-${i}`,
      kind,
      size: decodeSize(el.dimensions),
      position,
      rotationY,
      confidence: decodeConfidence(el.confidence),
    };
  });
}

/**
 * transform — simd_float4x4 в column-major, то есть столбцы идут подряд:
 * [0..3] — ось X, [4..7] — Y, [8..11] — Z, [12..14] — смещение.
 *
 * RoomPlan всегда держит элементы вертикально, поэтому из всей ориентации нам
 * нужен только угол вокруг Y. Для чистого Y-поворота m11 = cos, m31 = -sin,
 * где m11 = t[0], m31 = t[2]. Отсюда угол.
 */
function decodeTransform(t: number[] | undefined): { position: Vec3; rotationY: number } {
  if (!t || t.length < 16) return { position: { x: 0, y: 0, z: 0 }, rotationY: 0 };

  return {
    position: { x: t[12], y: t[13], z: t[14] },
    rotationY: Math.atan2(-t[2], t[0]),
  };
}

function decodeSize(d: number[] | undefined): Vec3 {
  // Стены и окна приезжают с нулевой толщиной — это плоскости. Рендерить нулевой
  // бокс нельзя, поэтому минимум 1 см даём здесь, а не в сцене.
  return {
    x: Math.max(d?.[0] ?? 0, 0.01),
    y: Math.max(d?.[1] ?? 0, 0.01),
    z: Math.max(d?.[2] ?? 0, 0.01),
  };
}

/** Понимает и "wall", и {"door":{"isOpen":false}}. */
function categoryName(c: RawCategory | undefined): string | null {
  if (typeof c === 'string') return c;
  if (c && typeof c === 'object') return Object.keys(c)[0] ?? null;
  return null;
}

function decodeConfidence(c: RawCategory | undefined): Confidence {
  const name = categoryName(c);
  return name === 'low' || name === 'medium' || name === 'high' ? name : 'medium';
}

type Box = { min: Vec3; max: Vec3 };

/**
 * AABB повёрнутого вокруг Y бокса. Точные восемь углов считать незачем:
 * при повороте только вокруг Y проекция на XZ раскладывается по двум слагаемым.
 */
function boxOf(s: Surface): Box {
  const cos = Math.abs(Math.cos(s.rotationY));
  const sin = Math.abs(Math.sin(s.rotationY));
  const hx = (s.size.x * cos + s.size.z * sin) / 2;
  const hz = (s.size.x * sin + s.size.z * cos) / 2;
  const hy = s.size.y / 2;

  return {
    min: { x: s.position.x - hx, y: s.position.y - hy, z: s.position.z - hz },
    max: { x: s.position.x + hx, y: s.position.y + hy, z: s.position.z + hz },
  };
}

function unionBox(list: Surface[]): Box {
  if (!list.length) {
    // Пустой скан — отдаём условную комнату 3×3×2.5, чтобы вьюер не делил на ноль.
    return { min: { x: -1.5, y: 0, z: -1.5 }, max: { x: 1.5, y: 2.5, z: 1.5 } };
  }

  return list.map(boxOf).reduce((a, b) => ({
    min: { x: Math.min(a.min.x, b.min.x), y: Math.min(a.min.y, b.min.y), z: Math.min(a.min.z, b.min.z) },
    max: { x: Math.max(a.max.x, b.max.x), y: Math.max(a.max.y, b.max.y), z: Math.max(a.max.z, b.max.z) },
  }));
}

const add = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });

const round3 = (n: number) => Math.round(n * 1000) / 1000;
