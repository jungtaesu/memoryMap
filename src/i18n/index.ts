import { getLocales } from "expo-localization";
import { I18n } from "i18n-js";

// 1) 번역 데이터 정의
const en = {
  tab_map: "Map",
  tab_list: "List",
  tab_settings: "Settings",
  
  settings_title: "Settings",
  settings_lang: "Language",
  settings_version: "Version",
  settings_pref: "PREFERENCES",
  settings_appinfo: "APP INFO",

  map_search_placeholder: "Search places...",
  map_search_fail: "Place not found.",
  map_export: "Export",
  map_import: "Import",
  map_clear: "Clear",
  map_clear_confirm_title: "Initialize Pins",
  map_clear_confirm_msg: "Are you sure you want to delete all pins?",
  map_empty_toast: "Long press the map to create a pin.",
  
  pin_delete_confirm_title: "Delete Pin",
  pin_delete_confirm_msg: "Are you sure you want to delete this memory?",
  pin_memory: "Memory",
  pin_memo: "Memo",
  pin_add_photo: "Add Photo",
  pin_save: "Save",
  pin_cancel: "Cancel",
  pin_delete: "Delete",
  pin_main_photo: "Main",
  pin_extra_features: "More",
  pin_same_day_photos: "View Same Day Photos",
  pin_share_main_photo: "Share Main Photo",

  lang_ko: "Korean",
  lang_en: "English",
  lang_ja: "Japanese",
  lang_zh: "Chinese",
};

const ko = {
  tab_map: "지도",
  tab_list: "목록",
  tab_settings: "설정",

  settings_title: "설정",
  settings_lang: "언어",
  settings_version: "버전",
  settings_pref: "기본 설정",
  settings_appinfo: "앱 정보",

  map_search_placeholder: "장소 검색...",
  map_search_fail: "장소를 찾을 수 없습니다.",
  map_export: "내보내기",
  map_import: "가져오기",
  map_clear: "초기화",
  map_clear_confirm_title: "초기화",
  map_clear_confirm_msg: "모든 핀을 삭제하시겠습니까?",
  map_empty_toast: "지도를 길게 누르면 핀이 생성됩니다.",

  pin_delete_confirm_title: "추억 삭제",
  pin_delete_confirm_msg: "정말 이 추억을 삭제하시겠습니까?",
  pin_memory: "추억",
  pin_memo: "메모",
  pin_add_photo: "사진 추가",
  pin_save: "저장",
  pin_cancel: "취소",
  pin_delete: "삭제",
  pin_main_photo: "대표",
  pin_extra_features: "추가 기능",
  pin_same_day_photos: "같은 날 사진 더보기",
  pin_share_main_photo: "대표 사진 공유",

  lang_ko: "한국어",
  lang_en: "영어",
  lang_ja: "일본어",
  lang_zh: "중국어",
};

const ja = {
  tab_map: "地図",
  tab_list: "リスト",
  tab_settings: "設定",

  settings_title: "設定",
  settings_lang: "言語",
  settings_version: "バージョン",
  settings_pref: "環境設定",
  settings_appinfo: "アプリ情報",

  map_search_placeholder: "場所を検索...",
  map_search_fail: "場所が見つかりませんでした。",
  map_export: "エクスポート",
  map_import: "インポート",
  map_clear: "クリア",
  map_clear_confirm_title: "初期化",
  map_clear_confirm_msg: "すべてのピンを削除してもよろしいですか？",
  map_empty_toast: "地図を長押しするとピンが作成されます。",

  pin_delete_confirm_title: "削除確認",
  pin_delete_confirm_msg: "本当に削除してもよろしいですか？",
  pin_memory: "思い出",
  pin_memo: "メモ",
  pin_add_photo: "写真を追加",
  pin_save: "保存",
  pin_cancel: "キャンセル",
  pin_delete: "削除",
  pin_main_photo: "代表",
  pin_extra_features: "追加機能",
  pin_same_day_photos: "同じ日の写真を見る",
  pin_share_main_photo: "代表写真を共有",

  lang_ko: "韓国語",
  lang_en: "英語",
  lang_ja: "日本語",
  lang_zh: "中国語",
};

const zh = {
  tab_map: "地图",
  tab_list: "列表",
  tab_settings: "设置",

  settings_title: "设置",
  settings_lang: "语言",
  settings_version: "版本",
  settings_pref: "偏好设置",
  settings_appinfo: "应用信息",

  map_search_placeholder: "搜索地点...",
  map_search_fail: "未找到该地点。",
  map_export: "导出",
  map_import: "导入",
  map_clear: "清除",
  map_clear_confirm_title: "初始化",
  map_clear_confirm_msg: "确定要删除所有引脚吗？",
  map_empty_toast: "长按地图即可创建引脚。",

  pin_delete_confirm_title: "删除确认",
  pin_delete_confirm_msg: "确定要删除这条记忆吗？",
  pin_memory: "记忆",
  pin_memo: "备忘",
  pin_add_photo: "添加照片",
  pin_save: "保存",
  pin_cancel: "取消",
  pin_delete: "删除",
  pin_main_photo: "封面",
  pin_extra_features: "更多功能",
  pin_same_day_photos: "查看同天照片",
  pin_share_main_photo: "分享封面照片",
  
  lang_ko: "韩语",
  lang_en: "英语",
  lang_ja: "日语",
  lang_zh: "中文",
};

// 2) i18n 인스턴스 생성
export const i18n = new I18n({
  en,
  ko,
  ja,
  zh, 
});

// 3) 초기 언어 설정 (시스템 언어 따라감)
// 앱 켤 때 한 번 실행됨
export const deviceLanguage = getLocales()[0]?.languageCode ?? "en";
i18n.locale = deviceLanguage;
i18n.enableFallback = true;
// 중국어 간체/번체 구분 없이 zh로 통일하려면 매핑 필요할 수 있음
// 여기선 간단히 zh로 처리
if (i18n.locale.startsWith("zh")) {
    i18n.locale = "zh";
}

// 4) 수도 좌표 데이터
export const Capitals = {
    ko: { lat: 37.5665, lng: 126.9780, delta: 0.08, name: "Seoul" },   // 서울
    ja: { lat: 35.6895, lng: 139.6917, delta: 0.1, name: "Tokyo" },    // 도쿄
    zh: { lat: 39.9042, lng: 116.4074, delta: 0.1, name: "Beijing" },  // 베이징
    en: { lat: 40.7128, lng: -74.0060, delta: 0.1, name: "New York" }, // 뉴욕 (영어권 대표)
    default: { lat: 37.5665, lng: 126.9780, delta: 0.08, name: "Seoul" }, // 기본값
};

export function getInitialRegion() {
    // 현재 i18n.locale에 맞는 수도 좌표 반환
    const langCode = i18n.locale.split("-")[0]; // ko-KR -> ko
    const capital = Capitals[langCode as keyof typeof Capitals] || Capitals.default;
    
    return {
        latitude: capital.lat,
        longitude: capital.lng,
        latitudeDelta: capital.delta,
        longitudeDelta: capital.delta,
    };
}
