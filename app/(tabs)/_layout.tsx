import { Tabs } from "expo-router";
import { Platform, Text } from "react-native";
import { i18n } from "../../src/i18n";
import { useLanguage } from "../../src/store/LanguageStore";

export default function TabLayout() {
  const { locale } = useLanguage(); // 언어 상태 구독 (변경 시 리렌더링됨)

  return (
    <Tabs
      key={locale} // key가 바뀌면 탭 전체가 다시 그려져서 번역이 즉시 반영됨
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          ...Platform.select({
            ios: {
              shadowOpacity: 0.1,
            },
            android: {
              elevation: 4,
            },
          }),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: i18n.t("tab_map"),
          tabBarLabel: i18n.t("tab_map"),
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>🗺️</Text>,
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: i18n.t("tab_list"),
          tabBarLabel: i18n.t("tab_list"),
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>📋</Text>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: i18n.t("tab_settings"),
          tabBarLabel: i18n.t("tab_settings"),
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>⚙️</Text>,
        }}
      />
    </Tabs>
  );
}
