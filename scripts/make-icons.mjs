// Рендерит логотип в PNG для иконки приложения и splash.
// Запускать после правки логотипа: npm run icons
//
// Пути те же, что в src/ui/Logo.tsx — геометрия дублируется сознательно:
// тянуть сюда react-native-svg ради сборочного скрипта дороже, чем держать
// две копии одного пути из шести команд.
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ASSETS = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');

const CUBE = 'M50 8 L86 28 L86 72 L50 92 L14 72 L14 28 Z';
const TOP = 'M14 28 L50 48 L86 28 M50 48 L50 8';
const VASE =
  'M42.6 57.1 L57.4 57.1 C57.4 61.2 53.7 62.8 53.7 65.3 C53.7 67.7 63.9 69.4 63.9 75.1 C63.9 80 59.4 82.5 54.1 82.5 L45.9 82.5 C40.6 82.5 36.1 80 36.1 75.1 C36.1 69.4 46.3 67.7 46.3 65.3 C46.3 62.8 42.6 61.2 42.6 57.1 Z';

// scale сжимает логотип внутрь квадрата: иконка без воздуха по краям выглядит дёшево.
const svg = ({ background, ink, scale }) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  ${background ? `<rect width="100" height="100" fill="${background}"/>` : ''}
  <g transform="translate(50 50) scale(${scale}) translate(-50 -50)">
    <path d="${CUBE}" fill="none" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
    <path d="${TOP}" fill="none" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
    <path d="${VASE}" fill="${ink}"/>
  </g>
</svg>`;

const render = (name, { size, ...opts }) => {
  const png = new Resvg(svg(opts), {
    fitTo: { mode: 'width', value: size },
    background: 'rgba(0,0,0,0)',
  })
    .render()
    .asPng();

  writeFileSync(join(ASSETS, name), png);
  console.log(`${name}  ${size}×${size}`);
};

mkdirSync(ASSETS, { recursive: true });

// Иконка: непрозрачная, Apple не принимает альфу в App Store.
render('icon.png', { size: 1024, background: '#000000', ink: '#FFFFFF', scale: 0.74 });
// Splash: прозрачный фон, чёрный даёт сам плагин.
render('splash-icon.png', { size: 512, background: null, ink: '#FFFFFF', scale: 1 });
