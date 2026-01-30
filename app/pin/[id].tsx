import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function PinDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 18 }}>Pin Detail: {id}</Text>
    </View>
  );
}
