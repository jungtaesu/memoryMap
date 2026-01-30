import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "MemoryMap" }} />
      <Stack.Screen name="pin/[id]" options={{ title: "Pin" }} />
    </Stack>
  );
}
