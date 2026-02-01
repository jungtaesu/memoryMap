import { useMemo, useState, Fragment } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import MapView, { Marker, LongPressEvent } from "react-native-maps";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePins, Pin } from "../src/store/PinsStore";
import { reverseGeocodeGoogle } from "../src/services/geocode";

const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

function makeId() {
  // MVP용: 충분히 유니크한 ID
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { pins, addPin, clearPins, isReady, updatePin } = usePins();

  const initialRegion = useMemo(
    () => ({
      latitude: 37.5665,
      longitude: 126.978,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    }),
    []
  );

  if (!isReady) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Loading…</Text>
      </View>
    );
  }

  const onLongPress = (e: LongPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;

    const newPin: Pin = {
      id: makeId(),
      lat: latitude,
      lng: longitude,
      createdAt: Date.now(),
    };

    addPin(newPin).catch(console.log);

    // 비동기 주소 업데이트
    if (GOOGLE_KEY) {
      reverseGeocodeGoogle(latitude, longitude, GOOGLE_KEY)
        .then((r) => {
          if (!r) return;
          updatePin(newPin.id, {
            region1: r.region1,
            region2: r.region2,
            region3: r.region3,
            formattedAddress: r.formattedAddress,
          }).catch(console.log);
        })
        .catch(console.log);
    }
  };

  const goDetail = (id: string) => {
    router.push(`/pin/${id}`);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <MapView style={styles.map} initialRegion={initialRegion} onLongPress={onLongPress}>
        {pins.map((p) => {
          const hasPhoto = !!p.photoUri;
          const hasMemo = !!(p.memo && p.memo.trim().length > 0);
          const badgeText =
            (hasPhoto ? "🖼️" : "") + (hasMemo ? "✍️" : "");

          return (
            <Fragment key={p.id}>
              {/* 1) 기본 핀 마커 (절대 커스텀하지 말기) */}
              <Marker
                coordinate={{ latitude: p.lat, longitude: p.lng }}
                onPress={() => goDetail(p.id)}
              />

              {/* 2) 배지 마커: 같은 좌표에 “위로” 올려서 표시 */}
              {(hasPhoto || hasMemo) && (
                <Marker
                  coordinate={{ latitude: p.lat, longitude: p.lng }}
                  // 1) anchor사용: y > 1 이면 좌표보다 '위'에 그려짐. 
                  // 핀 높이만큼(약 1.0~1.2 단위) 더 위로 올림. 
                  anchor={{ x: 0.5, y: 2.3 }} 
                  onPress={() => goDetail(p.id)}
                >
                  <View style={styles.badge}>
                    {hasPhoto && <Text style={styles.badgeText}>🖼️</Text>}
                    {hasMemo && <Text style={styles.badgeText}>✍️</Text>}
                  </View>
                </Marker>
              )}
            </Fragment>
          );
        })}
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
  badge: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#ddd",
    elevation: 2, // Android 그림자
    flexDirection: "row", // 가로 배치 명시
    alignItems: "center",
    gap: 4,
  },
  badgeText: { fontSize: 10 },
});