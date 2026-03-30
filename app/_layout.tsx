import { Stack } from "expo-router";
import { PinsProvider } from "../src/store/PinsStore";
import { LanguageProvider } from "../src/store/LanguageStore";
import { AuthProvider } from "../src/store/AuthStore";

export default function RootLayout() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <PinsProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="pin/[id]" options={{ title: "" }} />
          </Stack>
        </PinsProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
