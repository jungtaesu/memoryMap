import * as ImageManipulator from "expo-image-manipulator";

/**
 * 이미지를 압축하여 로컬 저장 및 향후 업로드를 위한 최적화된 URI를 반환합니다.
 * Firebase Storage 효율성 및 앱 성능을 위해 필수적입니다.
 * 
 * - Resize: 너비 1080px (비율 유지)
 * - Format: JPEG
 * - Compress: 0.7 (70% 퀄리티)
 */
export async function compressImage(uri: string): Promise<string> {
  try {
    // 이미지를 조작합니다.
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }], // 가로 1080px로 리사이징, 세로는 비율에 맞춰 자동 조절
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG } // 압축률 0.7, JPEG 포맷
    );
    return result.uri;
  } catch (error) {
    console.warn("[ImageUtils] Image compression failed, falling back to original:", error);
    // 압축 실패 시, 앱 동작이 멈추지 않도록 원본 URI를 반환합니다.
    return uri;
  }
}
