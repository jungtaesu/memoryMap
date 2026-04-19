import { useLocalSearchParams, Stack } from "expo-router";
import { View, Text, FlatList, Image, Pressable, StyleSheet, Dimensions } from "react-native";
import { useState } from "react";
import ImageViewing from "react-native-image-viewing";

export default function SameDayPhotos() {
    const { photos: photosParam, date } = useLocalSearchParams<{ photos: string; date: string }>();
    const photos = photosParam ? JSON.parse(photosParam) : [];
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const screenWidth = Dimensions.get('window').width;
    const itemSize = (screenWidth - 40) / 3; // 3열 그리드, 여백 고려

    if (photos.length === 0) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ title: "같은 날 사진" }} />
                <Text style={styles.emptyText}>해당 날짜에 사진이 없습니다.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: "같은 날 사진" }} />
            <FlatList
                data={photos}
                keyExtractor={(item, index) => index.toString()}
                numColumns={3}
                contentContainerStyle={styles.grid}
                renderItem={({ item, index }) => (
                    <Pressable
                        style={[styles.gridItem, { width: itemSize, height: itemSize }]}
                        onPress={() => {
                            setCurrentImageIndex(index);
                            setIsViewerOpen(true);
                        }}
                    >
                        <Image source={{ uri: item.uri }} style={styles.image} />
                    </Pressable>
                )}
            />
            <ImageViewing
                images={photos.map((p: any) => ({ uri: p.uri }))}
                imageIndex={currentImageIndex}
                visible={isViewerOpen}
                onRequestClose={() => setIsViewerOpen(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16 },
    grid: { padding: 10 },
    gridItem: {
        margin: 5,
        borderRadius: 8,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
});