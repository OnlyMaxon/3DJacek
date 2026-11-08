// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*'],
  },
  {
    // react-three-fiber рендерит объекты three.js как JSX-элементы, и правило
    // про «неизвестные пропсы» видит в geometry/intensity/args ошибку DOM.
    // Для сцены оно нерелевантно — типы всё равно проверяет tsc.
    files: ['src/scene/**/*.tsx'],
    rules: { 'react/no-unknown-property': 'off' },
  },
]);
