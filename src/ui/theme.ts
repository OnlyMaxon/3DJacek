// Чёрно-белая система целиком. Акцентного цвета нет: активное состояние — просто белый.
export const color = {
  bg: '#000000',
  surface: '#0E0E0E',
  surfaceHigh: '#1A1A1A',
  line: '#2A2A2A',
  lineBright: '#4A4A4A',
  textDim: '#8A8A8A',
  text: '#FFFFFF',
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 } as const;

export const radius = { sm: 8, md: 14, pill: 999 } as const;

export const type = {
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  body: { fontSize: 15, fontWeight: '400' },
  label: { fontSize: 13, fontWeight: '600', letterSpacing: 0.3 },
  // габариты и цифры — моноширинным, чтобы не прыгали при изменении
  mono: { fontSize: 12, fontFamily: 'Menlo', letterSpacing: -0.2 },
} as const;

// Палитра самой 3D-сцены. Отдельно от UI: здесь важны альфа и контраст рёбер.
export const scene = {
  floor: '#0A0A0A',
  grid: '#242424',
  wallFill: '#FFFFFF',
  wallOpacity: 0.05,
  wallEdge: '#6E6E6E',
  openingEdge: '#FFFFFF',
  furniture: '#F2F2F2',
  furnitureEdge: '#000000',
  selected: '#000000',
  selectedEdge: '#FFFFFF',
} as const;
