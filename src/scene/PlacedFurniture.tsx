import { useEffect, useRef } from 'react';
import type * as THREE from 'three';

import { buildParts } from '@/furniture/primitives';
import { catalogItem } from '@/furniture/catalog';
import type { PlacedItem } from '@/storage/types';
import { scene as palette } from '@/ui/theme';
import type { ViewerControls } from './controls';
import { EdgedBox } from './EdgedBox';

type Props = {
  item: PlacedItem;
  selected: boolean;
  controls: ViewerControls;
};

/**
 * Один расставленный предмет. Группа регистрируется в controls — по ней
 * работает попадание пальцем и живое перетаскивание без ререндера.
 *
 * Выделение — инверсия: чёрная заливка, белые рёбра. На чёрном фоне это
 * заметнее любой обводки.
 */
export function PlacedFurniture({ item, selected, controls }: Props) {
  const group = useRef<THREE.Group>(null);
  const spec = catalogItem(item.catalogId);
  const parts = buildParts(spec);

  useEffect(() => {
    controls.register(item.id, group.current);
    return () => controls.register(item.id, null);
  }, [controls, item.id]);

  return (
    <group
      ref={group}
      position={[item.position.x, item.position.y, item.position.z]}
      rotation={[0, item.rotationY, 0]}
    >
      {parts.map((part, i) => (
        <EdgedBox
          key={i}
          size={part.size}
          position={part.position}
          fill={selected ? palette.selected : palette.furniture}
          edge={selected ? palette.selectedEdge : palette.furnitureEdge}
          shaded={!selected}
        />
      ))}
    </group>
  );
}
