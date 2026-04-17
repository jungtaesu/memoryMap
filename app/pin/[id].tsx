import { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Image, Alert, Platform, Modal, FlatList, Dimensions, KeyboardAvoidingView, ScrollView, Keyboard, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePins } from "../../src/store/PinsStore";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import DateTimePicker from "@react-native-community/datetimepicker";
import ImageViewing from "react-native-image-viewing";
import { File, Directory, Paths } from "expo-file-system";
import { TestIds, useInterstitialAd } from 'react-native-google-mobile-ads';
import { i18n } from "../../src/i18n";

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
    const { getPin, updatePin, addPinPhoto, deletePinPhoto, deletePinById } = usePins();

    const pin = id ? getPin(id) : undefined;

    const [memo, setMemo] = useState("");
    const [photos, setPhotos] = useState<string[]>([]);
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    
    // 스크롤 및 인풋 위치 관리
    const scrollViewRef = useRef<ScrollView>(null);
    const [inputLayoutY, setInputLayoutY] = useState(0);

    useEffect(() => {
        const showSubscription = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => {
                setKeyboardVisible(true);
            }
        );
        const hideSubscription = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardVisible(false)
        );

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    // 키보드가 활성화되어 Spacer가 렌더링된 후, 인풋 위치로 스크롤 이동
    useEffect(() => {
        if (isKeyboardVisible && inputLayoutY > 0) {
            // 레이아웃 변경 시간을 충분히 고려하여 지연 실행
             setTimeout(() => {
                scrollViewRef.current?.scrollTo({ y: inputLayoutY, animated: true });
             }, 300);
        }
    }, [isKeyboardVisible, inputLayoutY]);

    useEffect(() => {
        setMemo(pin?.memo ?? "");
    }, [pin?.memo]);

    useEffect(() => {
        setPhotos(pin?.photos ?? []);
    }, [pin?.photos]);

    useEffect(() => {
        if (pin?.createdAt) {
            setDate(new Date(pin.createdAt));
        }
    }, [pin?.createdAt]);

    const { isLoaded, isClosed, load, show } = useInterstitialAd(TestIds.INTERSTITIAL, {
        requestNonPersonalizedAdsOnly: true,
    });

    useEffect(() => {
        load();
    }, [load]);

    // 광고가 닫혔을 때 실제 사진 추가 로직 실행
    useEffect(() => {
        if (isClosed) {
            runAddPhoto();
            load();
        }
    }, [isClosed]);

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

    const runAddPhoto = async () => {
        try {
            const stored = await pickAndStorePhoto(id!);
            if (!stored) return;
            await addPinPhoto(id!, stored);
        } catch (e) {
            Alert.alert(i18n.t("pin_add_photo"), "다시 시도해줘");
            console.log(e);
        }
    };

    const onAddPhoto = async () => {
        if (photos.length >= 3) {
            Alert.alert("알림", "사진은 최대 3장까지 추가할 수 있어요.");
            return;
        }

        // 사진이 1장 이상 있고, 광고가 준비되었다면 광고 노출
        if (photos.length > 0 && isLoaded) {
            show();
        } else {
            // 첫 번째 사진이거나 광고 로드 실패 시 바로 실행
            await runAddPhoto();
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

    const onDelete = () => {
        Alert.alert(
            i18n.t("pin_delete_confirm_title"),
            i18n.t("pin_delete_confirm_msg"),
            [
                { text: i18n.t("pin_cancel"), style: "cancel" },
                {
                    text: i18n.t("pin_delete"),
                    style: "destructive",
                    onPress: async () => {
                        await deletePinById(id!);
                        router.back();
                    }
                }
            ]
        );
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0} // 헤더 높이 등을 고려한 오프셋
        >
            <Stack.Screen
                options={{
                    headerRight: () => (
                        <TouchableOpacity onPress={onDelete} style={{ padding: 8 }}>
                            <Text style={{ color: "#ff3b30", fontSize: 16, fontWeight: "600" }}>{i18n.t("pin_delete")}</Text>
                        </TouchableOpacity>
                    ),
                }}
            />
            <ScrollView
                ref={scrollViewRef}
                style={{ flex: 1 }}
                contentContainerStyle={{
                    padding: 16,
                    paddingBottom: 150, // 키보드 공간 확보
                    gap: 12,
                    flexGrow: 1 // 내용이 적을 때도 화면 꽉 차게, 많으면 늘어나게
                }}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.title}>{i18n.t("pin_memory")}</Text>
                <Text style={styles.sub}>{pin.region1
                    ? `${pin.region1} ${pin.region2 ?? ""} ${pin.region3 ?? ""}`
                    : "Unknown Location"}</Text>

                <Pressable onPress={() => setShowDatePicker((prev) => !prev)}>
                    <Text style={styles.dateText}>
                        📅 {date.getFullYear()}/{date.getMonth() + 1}/{date.getDate()}
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
                    {/* Carousel UI */}
                    <FlatList
                        data={[...photos, ...(photos.length < 3 ? ["ADD_BUTTON"] : [])]}
                        horizontal
                        // pagingEnabled // 제거: 아이템 크기와 컨테이너 크기가 다르므로 snapToInterval 사용
                        snapToInterval={290} // item width(280) + marginRight(10)
                        snapToAlignment="start"
                        decelerationRate="fast"
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingRight: 20 }} // 마지막 아이템 여백 확보
                        keyExtractor={(item, index) => (item === "ADD_BUTTON" ? "add-btn" : item)}
                        renderItem={({ item, index }) => {
                            if (item === "ADD_BUTTON") {
                                return (
                                    <Pressable style={styles.carouselItem} onPress={onAddPhoto}>
                                        <View style={styles.addPhotoPlaceholder}>
                                            <Text style={{ fontSize: 32 }}>+</Text>
                                            <Text style={{ marginTop: 8 }}>{i18n.t("pin_add_photo")}</Text>
                                            <Text style={{ fontSize: 12, opacity: 0.5 }}>
                                                {photos.length}/3
                                            </Text>
                                        </View>
                                    </Pressable>
                                );
                            }

                            return (
                                <Pressable
                                    style={styles.carouselItem}
                                    onPress={() => {
                                        setCurrentImageIndex(index);
                                        setIsViewerOpen(true);
                                    }}
                                    onLongPress={() => {
                                        Alert.alert("Delete Photo", "Delete this photo?", [
                                            { text: i18n.t("pin_cancel"), style: "cancel" },
                                            {
                                                text: i18n.t("pin_delete"),
                                                style: "destructive",
                                                onPress: () => deletePinPhoto(id, item),
                                            },
                                        ]);
                                    }}
                                >
                                    <Image source={{ uri: item }} style={styles.carouselImage} />
                                    <View style={styles.pageIndicator}>
                                        <Text style={styles.pageIndicatorText}>
                                            {index + 1}/{photos.length}
                                        </Text>
                                    </View>
                                </Pressable>
                            );
                        }}
                    />
                </View>

                <View 
                    style={styles.card} 
                    onLayout={(event) => {
                        // 인풋 카드의 Y 위치를 저장해둠
                        setInputLayoutY(event.nativeEvent.layout.y);
                    }}
                >
                    <Text style={styles.label}>{i18n.t("pin_memo")}</Text>
                    <TextInput
                        value={memo}
                        onChangeText={setMemo}
                        placeholder="..."
                        multiline
                        style={styles.input}
                    />
                </View>

                <Pressable style={styles.saveBtn} onPress={saveMemo}>
                    <Text style={styles.saveText}>{i18n.t("pin_save")}</Text>
                </Pressable>
                
                {/* 스크롤 여유 공간 확보용 Spacer - 키보드가 활성화되었을 때만 표시 */}
                {isKeyboardVisible && <View style={{ height: Dimensions.get("window").height * 0.3 }} />}
            </ScrollView>

            {/* 이미지 뷰어 (줌/스와이프 지원) */}
            <ImageViewing
                images={photos.map((uri) => ({ uri }))}
                imageIndex={currentImageIndex}
                visible={isViewerOpen}
                onRequestClose={() => setIsViewerOpen(false)}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, gap: 12 },
    title: { fontSize: 22, fontWeight: "700", marginTop: 10 },
    sub: { opacity: 0.6 },
    dateText: { fontSize: 16, fontWeight: "600", marginTop: 4, color: "#007AFF" },

    card: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 10 },
    label: { fontWeight: "600" },

    carouselItem: {
        width: 280,
        height: 220,
        marginRight: 10,
        borderRadius: 12,
        overflow: "hidden",
        position: "relative",
        backgroundColor: "#f0f0f0",
    },
    carouselImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    addPhotoPlaceholder: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#e0e0e0",
    },
    pageIndicator: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    pageIndicatorText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },

    input: {
        minHeight: 120,
        textAlignVertical: "top",
        padding: 10,
        // borderWidth: 1,
        borderRadius: 12,
    },

    saveBtn: {
        // marginTop: "auto", // 제거: 스크롤 뷰 안에서 흐름대로 배치
        backgroundColor: "black",
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: "center",
    },
    saveText: { color: "white", fontWeight: "700", fontSize: 16 },
});
