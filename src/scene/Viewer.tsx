import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type * as THREE from 'three';

import type { PlacedItem, RoomModel, Vec3 } from '@/storage/types';
import { color } from '@/ui/theme';
import { ViewerControls } from './controls';
import { PlacedFurniture } from './PlacedFurniture';
import { RoomMesh } from './RoomMesh';

type Props = {
  room: RoomModel;
  items: PlacedItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, position: Vec3) => void;
};

/**
 * Вьюер комнаты. Жесты обрабатываем сами, а не через pointer-события r3f:
 * нужно решить «орбита или перетаскивание» в момент касания, а для этого
 * хватает одного рейкаста — зато поведение предсказуемое и не зависит от
 * порядка срабатывания двух разных систем событий.
 *
 *   палец по пустому месту  → вращаем камеру
 *   палец по предмету       → тащим его по полу
 *   два пальца              → зум
 *   тап по пустому месту    → снять выделение
 *
 * Вся логика взаимодействия — в ViewerControls. Здесь только проводка.
 */
export function Viewer({ room, items, selectedId, onSelect, onMove }: Props) {
  const controls = useMemo(() => new ViewerControls(), []);

  useEffect(() => controls.setItems(items), [controls, items]);
  useEffect(() => controls.frame(room), [controls, room]);

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .runOnJS(true)
      .onBegin((e) => {
        const grabbed = controls.beginTouch(e.x, e.y);
        if (grabbed) onSelect(grabbed);
      })
      .onUpdate((e) => controls.moveTouch(e.x, e.y, e.translationX, e.translationY))
      .onFinalize(() => {
        // В стор пишем один раз за жест — на нём же срабатывает автосейв.
        const moved = controls.endTouch();
        if (moved) onMove(moved.id, moved.position);
      });

    const tap = Gesture.Tap()
      .runOnJS(true)
      .onEnd((e, success) => {
        if (success) onSelect(controls.pick(e.x, e.y));
      });

    const pinch = Gesture.Pinch()
      .runOnJS(true)
      .onBegin(() => controls.beginPinch())
      .onUpdate((e) => controls.pinchTo(e.scale));

    return Gesture.Simultaneous(Gesture.Race(tap, pan), pinch);
  }, [controls, onSelect, onMove]);

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.fill}>
        <Canvas
          style={styles.fill}
          camera={{ fov: 55, near: 0.05, far: 200 }}
          gl={{ antialias: true }}
          onCreated={(state) => state.gl.setClearColor(color.bg)}
        >
          <CameraRig controls={controls} />
          {/* мягкий свет без теней: тени на боксах только добавили бы шума */}
          <ambientLight intensity={1.6} />
          <directionalLight position={[3, 8, 5]} intensity={1.4} />
          <directionalLight position={[-4, 3, -4]} intensity={0.5} />

          <RoomMesh room={room} />
          {items.map((item) => (
            <PlacedFurniture
              key={item.id}
              item={item}
              selected={item.id === selectedId}
              controls={controls}
            />
          ))}
        </Canvas>
      </View>
    </GestureDetector>
  );
}

/** Отдаёт камеру и размер холста в контроллер и каждый кадр применяет орбиту. */
function CameraRig({ controls }: { controls: ViewerControls }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  useEffect(() => {
    controls.attach(camera as THREE.PerspectiveCamera, size.width, size.height);
  }, [controls, camera, size.width, size.height]);

  useFrame(() => controls.apply());

  return null;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
