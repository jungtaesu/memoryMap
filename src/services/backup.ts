import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import JSZip from "jszip";
import { Alert } from "react-native";
import {
  fetchPins,
  fetchAllPhotos,
  deleteAllPins,
  deleteAllPhotos,
  insertPin,
  insertPhoto,
  PinRow,
} from "../db/db";

// 백업 데이터 스키마
type ExportPinPhoto = {
  id: number;
  filename: string;
  createdAt: number;
};

type ExportPin = {
  id: string;
  lat: number;
  lng: number;
  createdAt: number;
  memo?: string;
  region1?: string;
  region2?: string;
  region3?: string;
  formattedAddress?: string;
  photos: ExportPinPhoto[];
};

type ExportV1 = {
  version: 1;
  exportedAt: number;
  pins: ExportPin[];
};

function assertExportV1(data: any): asserts data is ExportV1 {
  if (!data || data.version !== 1 || !Array.isArray(data.pins)) {
    throw new Error("올바르지 않은 백업 파일 형식입니다 (Version mismatch or invalid structure)");
  }
}

// Helper: 파일 경로에서 파일명만 추출
function getFilename(uri: string): string {
  return uri.split("/").pop() ?? `unknown-${Date.now()}.jpg`;
}

// Export 기능
export async function exportToZip() {
  try {
    // 1. DB 데이터 조회
    const pins = await fetchPins();
    const photos = await fetchAllPhotos();

    // 2. Export 데이터 구조 생성
    const exportPins: ExportPin[] = pins.map((p) => {
      // 해당 핀의 사진들 찾기
      const pinPhotos = photos
        .filter((ph) => ph.pinId === p.id)
        .map((ph) => ({
          id: ph.id,
          filename: getFilename(ph.uri), 
          createdAt: ph.createdAt,
        }));

      return {
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        createdAt: p.createdAt,
        memo: p.memo ?? undefined,
        region1: p.region1 ?? undefined,
        region2: p.region2 ?? undefined,
        region3: p.region3 ?? undefined,
        formattedAddress: p.formattedAddress ?? undefined,
        photos: pinPhotos,
      };
    });

    const exportData: ExportV1 = {
      version: 1,
      exportedAt: Date.now(),
      pins: exportPins,
    };

    // 3. ZIP 객체 생성 (메모리 상에서 작업)
    const zip = new JSZip();

    // data.json 추가
    zip.file("data.json", JSON.stringify(exportData, null, 2));

    // photos 폴더 생성
    const photosFolder = zip.folder("photos");
    if (!photosFolder) throw new Error("ZIP 폴더 생성 실패");

    // 4. 사진 파일들을 ZIP에 추가
    for (const ph of photos) {
      const srcUri = ph.uri;
      const filename = getFilename(srcUri);
      
      const fileInfo = await FileSystem.getInfoAsync(srcUri);
      if (fileInfo.exists) {
        // 파일을 base64로 읽어서 ZIP에 추가
        const fileContent = await FileSystem.readAsStringAsync(srcUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        photosFolder.file(filename, fileContent, { base64: true });
      } else {
        console.warn(`[Export] Photo file not found: ${srcUri}`);
      }
    }

    // 5. ZIP 파일 생성 (base64)
    const zipBase64 = await zip.generateAsync({ type: "base64" });

    // 6. 파일 시스템에 쓰기
    const filename = `memory-map-backup-${Date.now()}.zip`;
    const zipFileUri = FileSystem.cacheDirectory + filename; // JSZip은 기본 경로 문자열 사용이 편함

    await FileSystem.writeAsStringAsync(zipFileUri, zipBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 7. 공유하기
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(zipFileUri);
    } else {
      Alert.alert("알림", "공유 기능을 사용할 수 없는 기기입니다.");
    }
  } catch (e: any) {
    console.error(e);
    Alert.alert("백업 실패", e.message || "알 수 없는 오류가 발생했습니다.");
  }
}

// Import 기능
export async function importFromZip(reloadCallback: () => void) {
  try {
    // 1. 파일 선택
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/zip", "application/octet-stream", "application/x-zip-compressed"],
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const fileUri = result.assets[0].uri;

    // 2. ZIP 파일 읽기 (base64)
    const zipBase64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 3. JSZip 로드
    const loadedZip = await JSZip.loadAsync(zipBase64, { base64: true });

    // 4. data.json 읽기 & 검증
    const jsonFile = loadedZip.file("data.json");
    if (!jsonFile) {
      throw new Error("백업 파일 내에 data.json이 없습니다.");
    }
    
    const jsonStr = await jsonFile.async("string");
    const importData = JSON.parse(jsonStr);
    assertExportV1(importData);

    // 5. 복구 진행 의사 묻기
    Alert.alert(
      "복구 확인",
      `총 ${importData.pins.length}개의 추억을 복구합니다.\n주의: 현재 앱에 있는 모든 데이터가 삭제되고 백업 데이터로 덮어씌워집니다. 진행하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "복구 시작",
          style: "destructive",
          onPress: async () => {
            try {
              await performRestore(importData, loadedZip, reloadCallback);
            } catch (restoreErr: any) {
              Alert.alert("복구 중 오류", restoreErr.message);
            }
          },
        },
      ]
    );
  } catch (e: any) {
    console.error(e);
    Alert.alert("가져오기 실패", e.message);
  }
}

async function performRestore(data: ExportV1, loadedZip: JSZip, reloadCallback: () => void) {
  // 1. DB 초기화
  await deleteAllPhotos();
  await deleteAllPins();

  // 2. 앱 내 영구 저장소 사진 폴더 준비
  const appPhotosDir = FileSystem.documentDirectory + "photos/";
  const dirInfo = await FileSystem.getInfoAsync(appPhotosDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(appPhotosDir, { intermediates: true });
  }

  // 3. 데이터 복원 Loop
  const photosFolder = loadedZip.folder("photos");

  for (const p of data.pins) {
    // 핀 복원
    const pinRow: PinRow = {
      id: p.id,
      lat: p.lat,
      lng: p.lng,
      createdAt: p.createdAt,
      memo: p.memo ?? null,
      photoUri: null, // deprecated
      region1: p.region1 ?? null,
      region2: p.region2 ?? null,
      region3: p.region3 ?? null,
      formattedAddress: p.formattedAddress ?? null,
    };
    await insertPin(pinRow);

    // 사진 복원
    if (p.photos && p.photos.length > 0 && photosFolder) {
      for (const ph of p.photos) {
        // ZIP 내 파일 찾기
        const zipFile = photosFolder.file(ph.filename);
        if (zipFile) {
          // base64로 추출해서 저장
          const b64 = await zipFile.async("base64");
          const destFileUri = appPhotosDir + ph.filename;
          
          await FileSystem.writeAsStringAsync(destFileUri, b64, {
             encoding: FileSystem.EncodingType.Base64,
          });

          // DB 연결
          await insertPhoto(p.id, destFileUri, ph.createdAt);
        }
      }
    }
  }

  // 4. 완료 알림 및 새로고침
  Alert.alert("완료", "데이터 복구가 완료되었습니다.");
  reloadCallback();
}
