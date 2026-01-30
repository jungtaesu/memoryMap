import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { usePins } from "../../src/store/PinsStore";

export default function PinDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPin, updatePin } = usePins();

  const pin = id ? getPin(id) : undefined;

  const [memo, setMemo] = useState("");

  // 화면 진입 시 현재 memo로 초기화
  useEffect(() => {
    setMemo(pin?.memo ?? "");
  }, [pin?.memo]);

  if (!id) {
    return (
      <View style={styles.container}>
        <Text>Invalid pin id</Text>
      </View>
    );
  }

  if (!pin) {
    return (
      <View style={styles.container}>
        <Text>Pin not found</Text>
      </View>
    );
  }

  const save = () => {
    updatePin(id, { memo });
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pin Detail</Text>
      <Text style={styles.sub}>ID: {pin.id}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Memo</Text>
        <TextInput
          value={memo}
          onChangeText={setMemo}
          placeholder="여기서 어떤 기억이었는지 한 줄만…"
          multiline
          style={styles.input}
        />
      </View>

      <Pressable style={styles.saveBtn} onPress={save}>
        <Text style={styles.saveText}>Save</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: "700", marginTop: 10 },
  sub: { opacity: 0.6 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  label: { fontWeight: "600" },
  input: {
    minHeight: 120,
    textAlignVertical: "top",
    padding: 10,
    borderWidth: 1,
    borderRadius: 12,
  },
  saveBtn: {
    marginTop: "auto",
    backgroundColor: "black",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  saveText: { color: "white", fontWeight: "700", fontSize: 16 },
});
