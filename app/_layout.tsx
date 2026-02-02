import { Stack } from "expo-router";
import { PinsProvider } from "../src/store/PinsStore";

export default function RootLayout() {
  return (
    <PinsProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="pin/[id]" options={{ title: "" }} />
      </Stack>
    </PinsProvider>
  );
}
