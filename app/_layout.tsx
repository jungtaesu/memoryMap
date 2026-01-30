import { Stack } from "expo-router";
import { PinsProvider } from "../src/store/PinsStore";

export default function RootLayout() {
  return (
    <PinsProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: "MemoryMap" }} />
        <Stack.Screen name="pin/[id]" options={{ title: "Pin" }} />
      </Stack>
    </PinsProvider>
  );
}
