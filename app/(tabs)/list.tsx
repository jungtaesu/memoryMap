import { useMemo } from "react";
import { View, Text, SectionList, Pressable, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePins, Pin } from "../../src/store/PinsStore";
import { i18n } from "../../src/i18n";

export default function PinList() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { pins } = usePins();

  // 지역별 그룹화 로직
  const sections = useMemo(() => {
    const grouped: Record<string, Pin[]> = {};
    const others: Pin[] = [];

    pins.forEach((pin) => {
      if (pin.region1) {
        if (!grouped[pin.region1]) {
          grouped[pin.region1] = [];
        }
        grouped[pin.region1].push(pin);
      } else {
        others.push(pin);
      }
    });

    // 1. 지역명이 있는 그룹들을 가나다순 정렬
    const sortedRegions = Object.keys(grouped).sort();

    // 2. 섹션 배열 생성
    const result = sortedRegions.map((region) => ({
      title: region,
      data: grouped[region].sort((a, b) => b.createdAt - a.createdAt), // 그룹 내 최신순
    }));

    // 3. 지역명 없는 핀들은 '기타' 그룹으로 맨 뒤에 추가 (데이터가 있을 경우만)
    if (others.length > 0) {
      result.push({
        title: "Others",
        data: others.sort((a, b) => b.createdAt - a.createdAt),
      });
    }

    return result;
  }, [pins]);

  const goDetail = (id: string) => {
    router.push(`/pin/${id}`);
  };

  const renderItem = ({ item }: { item: Pin }) => {
    const hasPhoto = item.photos && item.photos.length > 0;
    const dateStr = item.createdAt 
        ? new Date(item.createdAt).toLocaleDateString() 
        : "";

    return (
      <Pressable style={styles.item} onPress={() => goDetail(item.id)}>
        <View style={styles.thumbnail}>
          {hasPhoto ? (
            <Image source={{ uri: item.photos![0] }} style={styles.thumbImage} />
          ) : (
            <Text style={{ fontSize: 20 }}>📍</Text>
          )}
        </View>

        <View style={styles.info}>
            <Text style={styles.region}>
                {item.region1 
                    ? `${item.region1} ${item.region2 ?? ""} ${item.region3 ?? ""}` 
                    : "위치 기록 없음"}
            </Text>
            {item.formattedAddress && (
                <Text style={styles.addr} numberOfLines={1}>{item.formattedAddress}</Text>
            )}
            
            <View style={styles.metaRow}>
                <Text style={styles.date}>{dateStr}</Text>
                {item.memo ? <Text style={styles.memoIndicator}>📝</Text> : null}
            </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.headerTitle}>{i18n.t("tab_list")} ({pins.length})</Text>
      
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionHeaderTitle}>{title}</Text>
          </View>
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 12 }}
        stickySectionHeadersEnabled={false} // 스크롤 시 헤더가 상단에 붙지 않게 (취향에 따라 true 가능)
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>저장된 핀이 없습니다.</Text>
            <Text style={styles.emptySub}>지도에서 길게 눌러 핀을 추가해보세요.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      paddingHorizontal: 16,
      paddingVertical: 12,
  },
  sectionHeaderContainer: {
    marginTop: 12,
    marginBottom: 6,
    paddingVertical: 4,
    // borderBottomWidth: 1,
    // borderBottomColor: "#eee",
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  item: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
    gap: 12,
    // shadow
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  info: {
      flex: 1,
      gap: 4
  },
  region: {
      fontSize: 16,
      fontWeight: "600",
  },
  addr: {
      fontSize: 12,
      color: "#666",
  },
  metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 2
  },
  date: {
      fontSize: 12,
      color: "#999",
  },
  memoIndicator: {
      fontSize: 12
  },
  empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 100,
      opacity: 0.5
  },
  emptyText: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 8
  },
  emptySub: {
      fontSize: 14
  }
});
