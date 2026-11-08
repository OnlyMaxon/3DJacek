# Jacek 3D

Снимаешь комнату телефоном — получаешь её 3D-модель. Ставишь внутрь мебель и смотришь, встанет ли.
Без регистрации, без сервера, всё лежит в памяти телефона.

iOS только. Android не планируется.

## Что нужно

- **iPhone 12 Pro или новее** (либо iPad Pro 2020+) — сканирование работает на LiDAR, без него никак.
  В симуляторе не запустится.
- iOS 16.4+
- Аккаунты Expo и Apple Developer, подключённые к EAS
- Mac не нужен: сборка идёт в облаке

## Начать

```bash
npm install
npx eas-cli login
npx eas-cli build --profile development --platform ios   # dev client, ставится на телефон один раз
npx expo start --dev-client
```

Expo Go не подойдёт — в нём нет нативного RoomPlan.

## В TestFlight

```bash
npx eas-cli build --profile production --platform ios
npx eas-cli submit --platform ios --latest
```

Первый `submit` сам заведёт App ID, провиженинг и ключи в твоём Apple-аккаунте.
Bundle `com.jacek.room3d` — меняется одной строкой в [app.config.ts](app.config.ts).

## Команды

```bash
npm run typecheck   # tsc --noEmit
npx eslint .        # линт
npx expo-doctor     # проверка зависимостей и конфига
npm run icons       # перегенерить иконку и splash из логотипа
```

## Где что лежит

Экраны в `src/app/` (файловый роутинг), остальное — по слоям: `scan`, `storage`, `scene`,
`furniture`, `store`, `ui`. Почему именно так и какие были развилки — в
[architecture.md](architecture.md).
