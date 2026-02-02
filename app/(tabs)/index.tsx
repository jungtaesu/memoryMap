import { useMemo, useState, useEffect, Fragment } from "react";
import { View, Text, Pressable, StyleSheet, Image, Platform } from "react-native";
import MapView, { Marker, LongPressEvent, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from "react-native-maps";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePins, Pin } from "../../src/store/PinsStore";
import { reverseGeocodeGoogle } from "../../src/services/geocode";
import { exportToZip, importFromZip } from "../../src/services/backup";

const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

// POI(상점, 명소) 등을 숨기는 심플한 맵 스타일
const simpleMapStyle = [
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
  {
      featureType: "road",
      elementType: "labels.icon",
      stylers: [{ visibility: "off" }]
  }
];

function makeId() {
  // MVP용: 충분히 유니크한 ID
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function BadgeMarker({ pin, onPress }: { pin: Pin; onPress: () => void }) {
  const [tracks, setTracks] = useState(true);

  const hasPhoto = pin.photos && pin.photos.length > 0;
  const hasMemo = !!(pin.memo && pin.memo.trim().length > 0);
  const count = (hasPhoto ? 1 : 0) + (hasMemo ? 1 : 0);

  useEffect(() => {
    // 내용이나 상태가 바뀌면 다시 그리기 시작
    setTracks(true);
    // 안드로이드 렌더링 타이밍 문제를 위해 여유있게 대기 후 스냅샷 모드로 전환
    const timer = setTimeout(() => {
      setTracks(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [count]);

  if (count === 0) return null;

  return (
    <Marker
      key={`${pin.id}-${count}`}
      coordinate={{ latitude: pin.lat, longitude: pin.lng }}
      anchor={{ x: count < 2 ? 0.3 : 0.5, y: 1.9 }}
      onPress={onPress}
      tracksViewChanges={tracks}
      zIndex={5} 
    >
      {/* <View style={styles.markerContainer} collapsable={false}> */}
        <View style={styles.badge} collapsable={false}>
          {hasPhoto && (
            <Text
              style={[styles.badgeText, hasMemo && styles.badgeTextLeft]}
            >
              🖼️
            </Text>
          )}
          {hasMemo && <Text style={styles.badgeText}>✍️</Text>}
        </View>
      {/* </View> */}
    </Marker>
  );
}

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { pins, addPin, clearPins, isReady, updatePin, reloadPins } = usePins();

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
      photos: [],
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Map fill */}
      <View style={styles.mapContainer}>
        <MapView 
          style={styles.map} 
          initialRegion={initialRegion} 
          onLongPress={onLongPress}
          showsPointsOfInterest={false} 
          showsTraffic={false}
          showsIndoors={false}
          customMapStyle={simpleMapStyle} 
          mapType={Platform.OS === "ios" ? "mutedStandard" : "standard"}
        >
          {/* 1) 기본 핀 마커 */}
          {pins.map((p) => (
            <Marker
              key={`basic-${p.id}`}
              coordinate={{ latitude: p.lat, longitude: p.lng }}
              onPress={() => goDetail(p.id)}
            />
          ))}

          {/* 2) 배지 마커 (이모지) */}
          {pins.map((p) => (
            <BadgeMarker 
              key={`badge-${p.id}`} 
              pin={p} 
              onPress={() => goDetail(p.id)} 
            />
          ))}
        </MapView>
      </View>

      <View style={styles.hud}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable style={styles.btn} onPress={exportToZip}>
            <Text style={styles.btnText}>Export</Text>
          </Pressable>
          <Pressable style={styles.btn} onPress={() => importFromZip(reloadPins)}>
            <Text style={styles.btnText}>Import</Text>
          </Pressable>
        </View>

        <Text style={styles.hudText}>{pins.length} Pins</Text>

        <Pressable style={styles.btn} onPress={clearPins}>
          <Text style={styles.btnText}>Clear</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapContainer: { flex: 1 },
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
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  btnText: { fontSize: 13, fontWeight: "500" },
  badge: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 4,
    borderColor: "#ddd",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  badgeText: { 
    fontSize: 12, 
    lineHeight: 16,
    textAlignVertical: "center", 
    includeFontPadding: false, 
  },
  badgeTextLeft: { 
    marginRight: 0
  },
});
