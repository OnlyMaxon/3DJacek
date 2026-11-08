import type { ExpoConfig } from 'expo/config';

// Единственный источник конфига — app.json удалён. Здесь можно читать env и ветвиться.
// Нативные папки ios/ не коммитим: их генерит prebuild на стороне EAS.
const config: ExpoConfig = {
  name: 'Jacek 3D',
  slug: 'jacek-3d',
  // Аккаунт-владелец на EAS. Для организации обязателен, иначе CLI ищет проект
  // под личным аккаунтом и каждый раз предлагает создать новый.
  owner: 'onlymaxons-team',
  version: '1.0.0',
  scheme: 'jacek3d', // нужен expo-router для диплинков
  orientation: 'portrait',
  userInterfaceStyle: 'dark', // тема одна — чёрная
  platforms: ['ios'], // Android не поддерживаем осознанно
  icon: './assets/icon.png',
  assetBundlePatterns: ['**/*'],

  ios: {
    bundleIdentifier: 'com.jacek.room3d',
    buildNumber: '1',
    supportsTablet: false, // iPhone-first; iPad Pro — когда понадобится
    infoPlist: {
      // Текст видит пользователь в системном алерте. Шаблонные формулировки Apple режет на ревью.
      NSCameraUsageDescription:
        'Камера нужна, чтобы снять геометрию комнаты. Видео и фото не сохраняются и никуда не отправляются.',
      // Без этого флага App Store Connect спрашивает про экспортное шифрование на каждом билде.
      ITSAppUsesNonExemptEncryption: false,
    },
    // Манифест приватности. Данные не собираем, но Apple требует объявить
    // "required reason" API — их использует expo-file-system.
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyCollectedDataTypes: [],
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
          NSPrivacyAccessedAPITypeReasons: ['C617.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace',
          NSPrivacyAccessedAPITypeReasons: ['E174.1'],
        },
      ],
    },
  },

  plugins: [
    'expo-router',
    'expo-asset',
    [
      'expo-roomplan',
      {
        cameraPermissionText:
          'Камера нужна, чтобы снять геометрию комнаты. Видео и фото не сохраняются и никуда не отправляются.',
      },
    ],
    [
      'expo-build-properties',
      {
        // RoomPlan требует 16.0, сам SDK 58 — 16.4. Берём то, что выше.
        ios: { deploymentTarget: '16.4' },
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 160,
        backgroundColor: '#000000',
        resizeMode: 'contain',
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
  },

  // Динамический конфиг EAS сам дописать не может — projectId проставляем руками.
  // Он связывает локальный проект с expo.dev/accounts/onlymaxons-team/projects/jacek-3d.
  extra: {
    eas: {
      projectId: '5803e3a9-07e1-46c2-ae91-6b2b391e9eed',
    },
  },
};

export default config;
