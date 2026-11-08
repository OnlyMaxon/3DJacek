import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

import type { Vec3 } from '@/storage/types';

type Props = {
  size: Vec3;
  position: Vec3;
  rotationY?: number;
  fill?: string;
  fillOpacity?: number;
  edge?: string;
  edgeOpacity?: number;
  /** стены — basic (плоская заливка), мебель — lambert (с подсветкой объёма) */
  shaded?: boolean;
};

/**
 * Бокс с подчёркнутыми рёбрами — базовый кирпич всей сцены.
 * Заливка и рёбра рисуются отдельно: именно их разный контраст и даёт
 * тот самый «white-box» вид вместо серой каши.
 */
export function EdgedBox({
  size,
  position,
  rotationY = 0,
  fill,
  fillOpacity = 1,
  edge,
  edgeOpacity = 1,
  shaded = false,
}: Props) {
  const geometry = useMemo(() => new THREE.BoxGeometry(size.x, size.y, size.z), [size.x, size.y, size.z]);
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

  // Геометрию создали руками — r3f её сам не освободит.
  useEffect(() => () => {
    geometry.dispose();
    edges.dispose();
  }, [geometry, edges]);

  return (
    <group position={[position.x, position.y, position.z]} rotation={[0, rotationY, 0]}>
      {fill && fillOpacity > 0 && (
        <mesh geometry={geometry}>
          {shaded ? (
            <meshLambertMaterial color={fill} transparent={fillOpacity < 1} opacity={fillOpacity} />
          ) : (
            <meshBasicMaterial
              color={fill}
              transparent={fillOpacity < 1}
              opacity={fillOpacity}
              depthWrite={fillOpacity >= 1}
              side={THREE.DoubleSide}
            />
          )}
        </mesh>
      )}
      {edge && (
        <lineSegments geometry={edges}>
          <lineBasicMaterial color={edge} transparent={edgeOpacity < 1} opacity={edgeOpacity} />
        </lineSegments>
      )}
    </group>
  );
}
