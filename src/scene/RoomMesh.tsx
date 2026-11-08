import { scene as palette } from '@/ui/theme';
import type { RoomModel, Surface } from '@/storage/types';
import { EdgedBox } from './EdgedBox';

/**
 * Геометрия комнаты. Рисуем ровно то, что знает RoomPlan, и ничего не додумываем:
 * стены почти прозрачные (иначе внутрь не видно), проёмы — яркими рёбрами без
 * заливки, распознанная мебель — тусклым контуром, чтобы отличалась от нашей.
 */
export function RoomMesh({ room }: { room: RoomModel }) {
  const { width, depth } = room.bounds;
  const span = Math.max(width, depth) + 1;

  return (
    <group>
      {/* пол: тёмная плита плюс сетка с шагом 50 см — она же линейка на глаз */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.004, 0]}>
        <planeGeometry args={[span, span]} />
        <meshBasicMaterial color={palette.floor} />
      </mesh>
      <gridHelper args={[span, Math.max(2, Math.round(span / 0.5)), palette.grid, palette.grid]} />

      {room.surfaces.map((s) => (
        <SurfacePart key={s.id} surface={s} />
      ))}

      {room.detected.map((d) => (
        <EdgedBox
          key={d.id}
          size={d.size}
          position={d.position}
          rotationY={d.rotationY}
          edge={palette.wallEdge}
          edgeOpacity={0.5}
        />
      ))}
    </group>
  );
}

function SurfacePart({ surface }: { surface: Surface }) {
  if (surface.kind === 'floor') return null; // свой пол уже нарисован выше

  // Проёмы лежат в плоскости стены. Заливка там только мешает — рисуем рамку.
  const opening = surface.kind !== 'wall';

  return (
    <EdgedBox
      size={opening ? surface.size : { ...surface.size, z: Math.max(surface.size.z, 0.04) }}
      position={surface.position}
      rotationY={surface.rotationY}
      fill={opening ? undefined : palette.wallFill}
      fillOpacity={palette.wallOpacity}
      edge={opening ? palette.openingEdge : palette.wallEdge}
      // низкая уверенность — тусклее: видно, где скан недокрутили
      edgeOpacity={surface.confidence === 'low' ? 0.35 : opening ? 0.9 : 0.6}
    />
  );
}
