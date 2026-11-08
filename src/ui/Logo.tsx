import Svg, { Path } from 'react-native-svg';

import { color } from './theme';

type Props = {
  size?: number;
  stroke?: string;
  fill?: string;
};

// Изометрический куб, внутри по центру ваза. Нижнее вертикальное ребро куба
// намеренно не рисуем — иначе оно режет вазу пополам.
// Тот же файл — источник иконки приложения (scripts/make-icons.mjs).
export function Logo({ size = 96, stroke = color.text, fill = color.text }: Props) {
  const w = size * 0.04; // толщина линий тянется за размером, иначе мелкий лого «залипает»

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* силуэт куба */}
      <Path
        d="M50 8 L86 28 L86 72 L50 92 L14 72 L14 28 Z"
        stroke={stroke}
        strokeWidth={w}
        strokeLinejoin="round"
        fill="none"
      />
      {/* три ребра верхней грани — дают прочтение «это куб, вид сверху-сбоку» */}
      <Path
        d="M14 28 L50 48 L86 28 M50 48 L50 8"
        stroke={stroke}
        strokeWidth={w}
        strokeLinejoin="round"
        fill="none"
      />
      {/* ваза: венчик, горло, плечи, плоское дно */}
      <Path
        d="M42.6 57.1 L57.4 57.1 C57.4 61.2 53.7 62.8 53.7 65.3 C53.7 67.7 63.9 69.4 63.9 75.1 C63.9 80 59.4 82.5 54.1 82.5 L45.9 82.5 C40.6 82.5 36.1 80 36.1 75.1 C36.1 69.4 46.3 67.7 46.3 65.3 C46.3 62.8 42.6 61.2 42.6 57.1 Z"
        fill={fill}
      />
    </Svg>
  );
}
