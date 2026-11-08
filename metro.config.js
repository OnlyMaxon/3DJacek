const { getDefaultConfig } = require('expo/metro-config');
const { existsSync } = require('node:fs');
const path = require('node:path');

const config = getDefaultConfig(__dirname);

/**
 * three 0.187 в CJS-сборке первым делом зовёт process.emitWarning — в React Native
 * такой функции нет, и приложение падает на импорте сцены.
 *
 * @react-three/fiber подключает three через require(), поэтому Metro по условию
 * "require" в exports берёт именно three.cjs. Отправляем всех на ESM-сборку: она
 * без Node-специфики, и заодно это гарантирует один экземпляр three на приложение
 * (две копии ломают instanceof внутри самой библиотеки).
 *
 * Путь задаём файлом, а не именем модуля: подпуть ./build/* в exports у three
 * не объявлен, и обычное разрешение его отвергнет.
 */
const threeEsm = path.resolve(__dirname, 'node_modules/three/build/three.module.js');

if (existsSync(threeEsm)) {
  const defaultResolve = config.resolver.resolveRequest;

  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === 'three') {
      return { type: 'sourceFile', filePath: threeEsm };
    }
    return (defaultResolve ?? context.resolveRequest)(context, moduleName, platform);
  };
} else {
  console.warn('metro.config.js: three.module.js не найден, оставляем разрешение по умолчанию');
}

module.exports = config;
