import * as THREE from 'three';

import type { PlacedItem, RoomModel, Vec3 } from '@/storage/types';

/** Что вернуть в стор, когда палец отпустили. */
export type DragResult = { id: string; position: Vec3 };

/**
 * Камера, попадания пальцем и перетаскивание мебели — всё в одном классе.
 *
 * Не React-состояние: орбита пересчитывается каждый кадр, а драг обновляется
 * десятки раз в секунду. Гонять это через setState значит ронять fps на ровном
 * месте. Компонент только пробрасывает сюда жесты и один раз забирает результат.
 */
export class ViewerControls {
  private camera: THREE.PerspectiveCamera | null = null;
  private size = { width: 1, height: 1 };

  // орбита в сферических координатах вокруг target
  private azimuth = Math.PI * 0.25;
  private phi = Math.PI * 0.34; // угол от вертикали
  private distance = 6;
  private target = new THREE.Vector3();
  private maxDistance = 40;
  private readonly minDistance = 0.8;

  private raycaster = new THREE.Raycaster();
  private floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private hitPoint = new THREE.Vector3();
  private pickables = new Map<string, THREE.Object3D>();

  // состояние текущего жеста
  private items: PlacedItem[] = [];
  private drag: { id: string; offset: Vec3; last: Vec3 } | null = null;
  private pan = { x: 0, y: 0 };
  private pinch = 1;

  // --- связь со сценой -------------------------------------------------

  /** Канвас зовёт это, когда создал камеру или сменился размер холста. */
  attach(camera: THREE.PerspectiveCamera, width: number, height: number): void {
    this.camera = camera;
    this.size = { width, height };
  }

  /** Поставить камеру так, чтобы комната целиком попала в кадр. */
  frame(room: RoomModel): void {
    const { width, depth, height } = room.bounds;
    this.target.set(0, height * 0.35, 0);
    this.distance = Math.max(2.5, Math.hypot(width, depth) * 1.1);
    this.maxDistance = this.distance * 4;
    this.azimuth = Math.PI * 0.25;
    this.phi = Math.PI * 0.34;
  }

  setItems(items: PlacedItem[]): void {
    this.items = items;
  }

  /** Группа предмета регистрируется при монтировании — по ней идёт рейкаст. */
  register(id: string, object: THREE.Object3D | null): void {
    if (!object) {
      this.pickables.delete(id);
      return;
    }
    object.userData.itemId = id;
    this.pickables.set(id, object);
  }

  /** Вызывается каждый кадр: сферические координаты → позиция камеры. */
  apply(): void {
    if (!this.camera) return;
    this.camera.position.setFromSphericalCoords(this.distance, this.phi, this.azimuth).add(this.target);
    this.camera.lookAt(this.target);
  }

  // --- жесты -----------------------------------------------------------

  /**
   * Касание началось. Решаем здесь и сразу: попали в предмет — тащим его,
   * не попали — крутим камеру. Возвращаем id, чтобы экран подсветил выделение.
   */
  beginTouch(x: number, y: number): string | null {
    this.pan = { x: 0, y: 0 };
    this.drag = null;

    const hitId = this.pick(x, y);
    const item = hitId ? this.items.find((i) => i.id === hitId) : undefined;
    const floor = item ? this.floorPoint(x, y) : null;
    if (!item || !floor) return null;

    // запоминаем смещение, иначе предмет прыгнет центром под палец
    this.drag = {
      id: item.id,
      offset: { x: item.position.x - floor.x, y: 0, z: item.position.z - floor.z },
      last: item.position,
    };
    return item.id;
  }

  moveTouch(x: number, y: number, translationX: number, translationY: number): void {
    if (this.drag) {
      const floor = this.floorPoint(x, y);
      if (!floor) return;

      this.drag.last = { x: floor.x + this.drag.offset.x, y: 0, z: floor.z + this.drag.offset.z };
      // двигаем объект напрямую, минуя React: коммит будет один, на отпускании
      this.pickables.get(this.drag.id)?.position.set(this.drag.last.x, 0, this.drag.last.z);
      return;
    }

    this.azimuth -= (translationX - this.pan.x) * 0.006;
    // не пускаем камеру ниже пола и строго в зенит: и то и другое ломает lookAt
    this.phi = clamp(this.phi - (translationY - this.pan.y) * 0.006, 0.1, Math.PI / 2 - 0.03);
    this.pan = { x: translationX, y: translationY };
  }

  /** Палец отпустили. null — камеру крутили, писать в стор нечего. */
  endTouch(): DragResult | null {
    const active = this.drag;
    this.drag = null;
    return active ? { id: active.id, position: active.last } : null;
  }

  beginPinch(): void {
    this.pinch = 1;
  }

  pinchTo(scale: number): void {
    this.distance = clamp(this.distance / (scale / this.pinch), this.minDistance, this.maxDistance);
    this.pinch = scale;
  }

  /** id предмета под пальцем или null. */
  pick(x: number, y: number): string | null {
    if (!this.camera || !this.pickables.size) return null;

    this.raycaster.setFromCamera(this.ndc(x, y), this.camera);
    const hits = this.raycaster.intersectObjects([...this.pickables.values()], true);

    for (const hit of hits) {
      // попали в конкретный бокс — поднимаемся до группы предмета
      for (let o: THREE.Object3D | null = hit.object; o; o = o.parent) {
        if (typeof o.userData.itemId === 'string') return o.userData.itemId;
      }
    }
    return null;
  }

  /** Точка на полу под пальцем. null — палец смотрит выше горизонта. */
  private floorPoint(x: number, y: number): Vec3 | null {
    if (!this.camera) return null;

    this.raycaster.setFromCamera(this.ndc(x, y), this.camera);
    const hit = this.raycaster.ray.intersectPlane(this.floor, this.hitPoint);

    return hit ? { x: hit.x, y: 0, z: hit.z } : null;
  }

  private ndc(x: number, y: number): THREE.Vector2 {
    return new THREE.Vector2((x / this.size.width) * 2 - 1, -(y / this.size.height) * 2 + 1);
  }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
