import { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import MapView, { Marker, LongPressEvent } from "react-native-maps";
import { useRouter } from "expo-router";
import { usePins, Pin } from "../src/store/PinsStore";

function makeId() {
  // MVP용: 충분히 유니크한 ID
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function Home() {
  const router = useRouter();
  const { pins, addPin, clearPins } = usePins();

  const initialRegion = useMemo(
    () => ({
      latitude: 37.5665,
      longitude: 126.978,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    }),
    []
  );

  const onLongPress = (e: LongPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;

    const newPin: Pin = {
      id: makeId(),
      lat: latitude,
      lng: longitude,
      createdAt: Date.now(),
    };

    addPin(newPin);
  };

  const goDetail = (id: string) => {
    router.push(`/pin/${id}`);
  };

   return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={initialRegion} onLongPress={onLongPress}>
        {pins.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.lat, longitude: p.lng }}
            onPress={() => goDetail(p.id)}
          />
        ))}
      </MapView>

      <View style={styles.hud}>
        <Text style={styles.hudText}>Pins: {pins.length}</Text>

        <Pressable style={styles.clearBtn} onPress={clearPins}>
          <Text>Clear</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  hud: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  hudText: { fontSize: 16, fontWeight: "600" },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
});