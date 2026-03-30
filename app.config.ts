import { ExpoConfig, ConfigContext } from 'expo/config';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "MemoryMap",
  slug: "MemoryMap",
  version: "1.0.0",
  scheme: "memorymap",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: false,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  ios: {
    bundleIdentifier: "com.memorymap",
    supportsTablet: true,
    googleServicesFile: "./GoogleService-Info.plist",
    config: {
      googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    },
    infoPlist: {
      NSLocationWhenInUseUsageDescription: "This app uses your location to show where you are on the map.",
      UIBackgroundModes: ["location", "fetch"],
    }
  },
  android: {
    package: "com.memorymap",
    googleServicesFile: "./google-services.json",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    edgeToEdgeEnabled: true,
    // 현재 코드에서는 갤러리만 사용하므로, 구글 플레이 정책 문제를 피하기 위해 카메라 권한을 명시적으로 차단합니다.
    blockedPermissions: ["android.permission.CAMERA", "android.permission.RECORD_AUDIO"],
    permissions: [
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
      "com.google.android.gms.permission.AD_ID"
    ],
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      }
    }
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  plugins: [
    "./plugins/withAndroidKotlinFix.js",
    [
      "expo-build-properties",
      {
        "ios": {
          "useFrameworks": "static"
        }
      }
    ],
    "expo-router",
    "expo-sqlite",
    "@react-native-community/datetimepicker",
    [
      "react-native-google-mobile-ads",
      {
        "androidAppId": "ca-app-pub-3940256099942544~3347511713",
        "iosAppId": "ca-app-pub-3940256099942544~1458002511"
      }
    ],
    "@react-native-firebase/app",
    [
      "@react-native-seoul/kakao-login",
      {
        "kakaoAppKey": process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY ?? "YOUR_KAKAO_NATIVE_APP_KEY"
      }
    ],
    "expo-localization"
  ],
  extra: {
    eas: {
      projectId: "b4a46495-5b12-425c-870e-aba14e9a758d"
    }
  }
});
