import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";

export default function Home() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "600" }}>MemoryMap</Text>

      <Link href="/pin/1" asChild>
        <Pressable style={{ padding: 12, borderWidth: 1, borderRadius: 10 }}>
          <Text>Go to Pin #1</Text>
        </Pressable>
      </Link>
    </View>
  );
}
