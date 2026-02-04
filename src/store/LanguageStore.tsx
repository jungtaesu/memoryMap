import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { i18n } from '../i18n'; // 기존 i18n 설정

type LanguageContextType = {
  locale: string;
  changeLanguage: (lang: string) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  changeLanguage: async () => {},
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocale] = useState(i18n.locale);

  useEffect(() => {
    // 앱 시작 시 저장된 언어 불러오기
    (async () => {
      try {
        const savedLocale = await AsyncStorage.getItem('user-language');
        if (savedLocale) {
          i18n.locale = savedLocale;
          setLocale(savedLocale);
        } else {
          // 저장된 게 없으면 디바이스 언어 사용 (i18n 초기화 로직이 이미 수행되었지만 확실히 동기화)
          const deviceLang = getLocales()[0]?.languageCode ?? "en";
          // zh 처리 등은 i18n/index.ts에서 이미 했다고 가정, 혹은 여기서 재처리
          // 여기선 단순화
        }
      } catch (e) {
        console.log("Failed to load language", e);
      }
    })();
  }, []);

  const changeLanguage = async (lang: string) => {
    i18n.locale = lang;     // i18n 라이브러리 언어 변경
    setLocale(lang);        // React 상태 변경 -> 리렌더링 유발
    await AsyncStorage.setItem('user-language', lang); // 저장
  };

  return (
    <LanguageContext.Provider value={{ locale, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
