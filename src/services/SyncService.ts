import firestore from '@react-native-firebase/firestore';
import { PinRow, fetchPins, insertPin, fetchAllPhotos } from '../db/db';
import { compressImage } from '../utils/image';
// import { FileSystem } from 'react-native-file-access'; // *Check note below
import * as ExpoFileSystem from 'expo-file-system';

// Firestore Collection Names
const COLLECTION_USERS = 'users';
const COLLECTION_PINS = 'pins';

/**
 * 로컬 SQLite 데이터와 Remote Firestore 데이터를 동기화하는 핵심 로직
 */
export async function syncData(userId: string) {
  try {
    console.log(`[Sync] Starting sync for user: ${userId}`);
    
    // 1. 로컬 데이터 가져오기
    const localPins = await fetchPins();
    
    // 2. Firestore 배치(Batch) 생성 - 한 번에 여러 쓰기 작업 수행 (비용 절약 & 원자성)
    const batch = firestore().batch();
    const userRef = firestore().collection(COLLECTION_USERS).doc(userId);
    const pinsCollectionRef = userRef.collection(COLLECTION_PINS);

    // 3. 로컬 -> 클라우드 업로드 전략 (단순화된 버전: 로컬 데이터를 우선시)
    // 실제로는 lastUpdatedAt 타임스탬프를 비교해야 하지만, 초기 버전은 "내 폰의 데이터를 백업한다"는 느낌으로 구현
    
    for (const pin of localPins) {
      const pinDocRef = pinsCollectionRef.doc(pin.id);
      
      // Firestore에 저장할 데이터 객체 구성
      const pinData = {
        id: pin.id,
        lat: pin.lat,
        lng: pin.lng,
        createdAt: pin.createdAt,
        memo: pin.memo || null,
        region1: pin.region1 || null,
        region2: pin.region2 || null,
        region3: pin.region3 || null,
        formattedAddress: pin.formattedAddress || null,
        updatedAt: firestore.FieldValue.serverTimestamp(), // 서버 시간 기록
      };

      batch.set(pinDocRef, pinData, { merge: true }); // merge: true -> 기존 데이터 살리면서 덮어쓰기
    }

    // 4. 배치 실행 (네트워크 요청 최소화)
    await batch.commit();
    console.log(`[Sync] Successfully synced ${localPins.length} pins to Cloud.`);
    
    // 5. 사진 동기화는 별도 프로세스로 진행 (Storage 대역폭 관리)
    // 사진은 용량이 크므로 Batch로 하지 않고 개별 업로드하되, 이미 있는 건 건너뛰는 로직 필요
    
  } catch (error) {
    console.error("[Sync] Error syncing data:", error);
    throw error;
  }
}

/**
 * 클라우드 -> 로컬 다운로드
 * (다른 기기에서 로그인 했을 때 최초 1회 실행용)
 */
export async function restoreFromCloud(userId: string) {
    // 구현 예정: Firestore에서 데이터를 읽어서 SQLite insertPin 호출
}
