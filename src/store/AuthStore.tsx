import React, { createContext, useState, useEffect, useContext } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
// Kakao login import will be added later when configured
// import { login as kakaoLogin } from '@react-native-seoul/kakao-login';

type AuthContextType = {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithKakao: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithKakao: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  // Firebase Auth 상태 리스너
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((userState) => {
      setUser(userState);
      setLoading(false);
    });
    return subscriber; // unsubscribe on unmount
  }, []);

  // 구글 로그인 설정 (Web Client ID는 Firebase Console에서 확인 필요)
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '358297836207-srnucuosr1sps73o95cq7r159qc6c6hk.apps.googleusercontent.com',
      iosClientId: '358297836207-38b6djo97g4ojv5d85akspgl26udoutl.apps.googleusercontent.com',
    });
  }, []);

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const { data } = await GoogleSignin.signIn();
      const idToken = data?.idToken;
      
      if (!idToken) throw new Error("Google Sign-In failed: No idToken");

      // Firebase 자격 증명 생성
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      
      // Firebase 로그인
      await auth().signInWithCredential(googleCredential);
    } catch (error) {
      console.error(error);
      // Alert.alert("로그인 실패", "구글 로그인 중 문제가 발생했습니다.");
    }
  };

  const signInWithKakao = async () => {
    // TODO: 카카오 로그인 로직 구현 및 Firebase Custom Auth 연동
    console.warn("Kakao login not implemented yet");
  };

  const signOut = async () => {
    try {
      await auth().signOut();
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // 이미 로그아웃 상태일 수 있음
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithKakao, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
