import { useMemo, useState, useEffect, Fragment, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Image, Platform, Alert, TextInput, Keyboard } from "react-native";
import MapView, { Marker, LongPressEvent, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from "react-native-maps";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePins, Pin } from "../../src/store/PinsStore";
import { reverseGeocodeGoogle, getCoordinatesFromAddress } from "../../src/services/geocode";
import { exportToZip, importFromZip } from "../../src/services/backup";
import * as Location from "expo-location";
import { i18n, getInitialRegion } from "../../src/i18n";

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
  
  const mapRef = useRef<MapView>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Permission to access location was denied
        return;
      }

      setLocationPermission(true);
      const location = await Location.getCurrentPositionAsync({});
      if(location && mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        });
      }
    })();
  }, []);

  const initialRegion = useMemo(
    () => getInitialRegion(),
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
    } else {
      // API Key가 없을 경우(개발/테스트 중) Expo 기본 기능으로 대체
      Location.reverseGeocodeAsync({ latitude, longitude })
        .then((results) => {
          if (results.length > 0) {
            const first = results[0];
            updatePin(newPin.id, {
              region1: first.region || first.adminArea || undefined,
              region2: first.city || first.subregion || undefined,
              region3: first.district || first.name || undefined,
              formattedAddress: `${first.region || ''} ${first.city || ''} ${first.name || ''}`.trim(),
            }).catch(console.log);
          }
        })
        .catch(console.log);
    }
  };

  const goDetail = (id: string) => {
    router.push(`/pin/${id}`);
  };

  const handleSearch = async () => {
    if(!searchText.trim()) return;
    
    Keyboard.dismiss();
    const result = await getCoordinatesFromAddress(searchText, GOOGLE_KEY);
    
    if (result && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: result.latitude,
        longitude: result.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      setIsSearchVisible(false);
      setSearchText("");
    } else {
      Alert.alert(i18n.t("map_search_fail"), i18n.t("map_search_placeholder"));
    }
  };

  const handleClearPins = () => {
    Alert.alert(
      i18n.t("map_clear_confirm_title"),
      i18n.t("map_clear_confirm_msg"),
      [
        { text: i18n.t("pin_cancel"), style: "cancel" },
        {
          text: i18n.t("pin_delete"),
          style: "destructive",
          onPress: () => clearPins(),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Map fill */}
      <View style={styles.mapContainer}>
        <MapView 
          ref={mapRef}
          style={styles.map} 
          initialRegion={initialRegion} 
          onLongPress={onLongPress}
          showsUserLocation={locationPermission}
          showsMyLocationButton={locationPermission}
          showsPointsOfInterest={false} 
          showsTraffic={false}
          showsIndoors={false}
          customMapStyle={simpleMapStyle} 
          mapType={Platform.OS === "ios" ? "mutedStandard" : "standard"}
          onPress={() => {
              if (isSearchVisible) {
                  Keyboard.dismiss();
                  setIsSearchVisible(false);
              }
          }}
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

      {!isSearchVisible && (
        <View style={styles.hud}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable style={styles.btn} onPress={exportToZip}>
              <Text style={styles.btnText}>{i18n.t("map_export")}</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={() => importFromZip(reloadPins)}>
              <Text style={styles.btnText}>{i18n.t("map_import")}</Text>
            </Pressable>
          </View>

          <Text style={styles.hudText}>{pins.length} Pins</Text>

          <Pressable style={styles.btn} onPress={handleClearPins}>
            <Text style={styles.btnText}>{i18n.t("map_clear")}</Text>
          </Pressable>
        </View>
      )}

      {/* Empty Pins Guide */}
      {pins.length === 0 && !isSearchVisible && (
        <View style={styles.emptyGuide}>
          <Text style={styles.emptyGuideText}>{i18n.t("map_empty_toast")}</Text>
        </View>
      )}

      {/* Floating Search Button */}
      {!isSearchVisible && (
        <Pressable 
          style={styles.searchBtn} 
          onPress={() => setIsSearchVisible(true)}
        >
          <Text style={{ fontSize: 24 }}>🔍</Text>
        </Pressable>
      )}

      {/* Search Input Box */}
      {isSearchVisible && (
          <View style={[styles.searchContainer, { top: 60 }]}>
              <TextInput 
                  style={styles.searchInput}
                  placeholder={i18n.t("map_search_placeholder")}
                  value={searchText}
                  onChangeText={setSearchText}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                  autoFocus
              />
              <Pressable style={styles.searchConfirmBtn} onPress={handleSearch}>
                  <Text style={{fontSize: 20}}>🔍</Text>
              </Pressable>
          </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  searchBtn: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyGuide: {
    position: "absolute",
    bottom: 90,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyGuideText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  searchContainer: {
      position: "absolute",
      right: 20,
      left: 20,
      height: 50,
      backgroundColor: "white",
      borderRadius: 25,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 15,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
  },
  searchInput: {
      flex: 1,
      height: "100%",
      fontSize: 16,
      marginLeft: 4,
  },
  searchConfirmBtn: {
      padding: 5,
  },
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
