import { Stack } from "expo-router";
import { PinsProvider } from "../src/store/PinsStore";
import { LanguageProvider } from "../src/store/LanguageStore";

export default function RootLayout() {
  return (
    <LanguageProvider>
      <PinsProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="same-day-photos" options={{ title: "같은 날 사진" }} />
        </Stack>
      </PinsProvider>
    </LanguageProvider>
  );
}
