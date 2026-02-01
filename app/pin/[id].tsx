import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Image, Alert, Platform, Modal } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePins } from "../../src/store/PinsStore";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import DateTimePicker from "@react-native-community/datetimepicker";
import { File, Directory, Paths } from "expo-file-system";

async function pickAndStorePhoto(pinId: string) {
  // 1) 갤러리에서 선택
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
    allowsEditing: false,
  });

  if (result.canceled) return null;

  const uri = result.assets[0]?.uri;
  if (!uri) return null;

  // 2) 리사이즈 (표현용)
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1280 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );

  // 3) 앱 폴더로 복사(영구 보관용)
  const photosDir = new Directory(Paths.document, "photos");
  if (!photosDir.exists) {
    photosDir.create();
  }

  const filename = `${pinId}-${Date.now()}.jpg`;
  const destFile = new File(photosDir, filename);
  const sourceFile = new File(manipulated.uri);
  
  sourceFile.copy(destFile);

  return destFile.uri; // 이 경로를 pin에 저장
}

export default function PinDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPin, updatePin } = usePins();

  const pin = id ? getPin(id) : undefined;

  const [memo, setMemo] = useState("");
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    setMemo(pin?.memo ?? "");
    setPhotoUri(pin?.photoUri);
    if (pin?.createdAt) {
      setDate(new Date(pin.createdAt));
    }
  }, [pin?.memo, pin?.photoUri, pin?.createdAt]);

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

  const onAddPhoto = async () => {
    try {
      const stored = await pickAndStorePhoto(id);
      if (!stored) return;

      setPhotoUri(stored);
      updatePin(id, { photoUri: stored });
    } catch (e) {
      Alert.alert("사진 추가 실패", "다시 시도해줘");
      console.log(e);
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const saveMemo = () => {
    updatePin(id, { memo, createdAt: date.getTime() });
    router.back();
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Text style={styles.title}>추억 내용</Text>
      <Text style={styles.sub}>{pin.region1
    ? `${pin.region1} ${pin.region2 ?? ""} ${pin.region3 ?? ""}`
    : "위치 기록"}</Text>

      <Pressable onPress={() => setShowDatePicker((prev) => !prev)}>
        <Text style={styles.dateText}>
          📅 {date.getFullYear()}년 {date.getMonth() + 1}월 {date.getDate()}일
        </Text>
      </Pressable>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}

      <View style={styles.card}>
        {/* <Text style={styles.label}>Photo</Text> */}

        {photoUri ? (
          <Pressable onPress={() => setIsViewerOpen(true)}>
            <Image source={{ uri: photoUri }} style={styles.photo} />
          </Pressable>
        ) : (
          <Text style={{ opacity: 0.6 }}>아직 사진이 없어요</Text>
        )}

        <Pressable style={styles.photoBtn} onPress={onAddPhoto}>
          <Text style={{ color: "white", fontWeight: "700" }}>
            {photoUri ? "Change Photo" : "Add Photo"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>내용</Text>
        <TextInput
          value={memo}
          onChangeText={setMemo}
          placeholder="여기서 어떤 기억이었는지 한 줄만…"
          multiline
          style={styles.input}
        />
      </View>

      <Pressable style={styles.saveBtn} onPress={saveMemo}>
        <Text style={styles.saveText}>Save</Text>
      </Pressable>

      <Modal
        visible={isViewerOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsViewerOpen(false)}
      >
        <View style={styles.viewerContainer}>
          <Pressable
            style={[styles.viewerClose, { top: insets.top + 20 }]}
            onPress={() => setIsViewerOpen(false)}
          >
            <Text style={styles.viewerCloseText}>닫기</Text>
          </Pressable>

          <Image
            source={{ uri: photoUri }}
            style={styles.viewerImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: "700", marginTop: 10 },
  sub: { opacity: 0.6 },
  dateText: { fontSize: 16, fontWeight: "600", marginTop: 4, color: "#007AFF" },

  card: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 10 },
  label: { fontWeight: "600" },

  photo: { width: "100%", height: 220, borderRadius: 12, backgroundColor: "#eee" },
  photoBtn: {
    backgroundColor: "black",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  input: {
    minHeight: 120,
    textAlignVertical: "top",
    padding: 10,
    // borderWidth: 1,
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

  viewerContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerImage: {
    width: "100%",
    height: "100%",
  },
  viewerClose: {
    position: "absolute",
    right: 16,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  viewerCloseText: { color: "white", fontWeight: "700" },
});
