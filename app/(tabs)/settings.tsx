import { View, Text, StyleSheet, Pressable, Alert, ActionSheetIOS, Platform, Modal, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { i18n } from "../../src/i18n";
import { useLanguage } from "../../src/store/LanguageStore";
import { useAuth } from "../../src/store/AuthStore";
import { syncData } from "../../src/services/SyncService";
import { useState } from "react";

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { locale, changeLanguage } = useLanguage();
  const { user, signInWithGoogle, signOut } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // ... existing code ...

  const handleSync = async () => {
    if (!user) return;
    try {
      setIsSyncing(true);
      await syncData(user.uid);
      Alert.alert("동기화 완료", "소중한 추억이 클라우드에 안전하게 보관되었습니다.");
    } catch (e: any) {
      Alert.alert("오류", e.message || "동기화 중 오류가 발생했습니다.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLoginPress = () => {
      // 지금은 구글만 연결
      signInWithGoogle();
  };

  const handleLanguagePress = () => {
    const options = ["한국어", "English", "日本語", "中文", i18n.t("pin_cancel")];
    const codes = ["ko", "en", "ja", "zh"];
    const cancelButtonIndex = 4;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          title: i18n.t("settings_lang"),
        },
        (buttonIndex) => {
          if (buttonIndex < 4) {
            changeLanguage(codes[buttonIndex]);
          }
        }
      );
    } else {
        setModalVisible(true);
    }
  };

  const changeLanguageAndClose = (lang: string) => {
      changeLanguage(lang);
      setModalVisible(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{i18n.t("settings_title")}</Text>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>계정 & 동기화 (Beta)</Text>
        
        {user ? (
           <>
              <View style={styles.item}>
                <Text style={styles.itemIcon}>👤</Text>
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>{user.email}</Text>
                  <Text style={styles.itemSubtitle}>로그인됨</Text>
                </View>
              </View>

              <Pressable style={styles.item} onPress={handleSync} disabled={isSyncing}>
                <Text style={styles.itemIcon}>☁️</Text>
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>지금 동기화</Text>
                  <Text style={styles.itemSubtitle}>
                      {isSyncing ? "동기화 진행 중..." : "수동으로 클라우드에 백업합니다"}
                  </Text>
                </View>
                {isSyncing && <ActivityIndicator size="small" />}
              </Pressable>

              <Pressable style={styles.item} onPress={signOut}>
                <Text style={styles.itemIcon}>🚪</Text>
                <View style={styles.itemContent}>
                  <Text style={[styles.itemTitle, { color: '#FF3B30' }]}>로그아웃</Text>
                </View>
              </Pressable>
           </>
        ) : (
            <>
             <Pressable style={styles.item} onPress={handleLoginPress}>
                <Text style={styles.itemIcon}>G</Text>
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>구글 계정으로 로그인</Text>
                  <Text style={styles.itemSubtitle}>로그인하여 데이터를 안전하게 보관하세요.</Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </Pressable>
            </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{i18n.t("settings_pref")}</Text>
        
        <Pressable style={styles.item} onPress={handleLanguagePress}>
          <Text style={styles.itemIcon}>🌐</Text>
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle}>{i18n.t("settings_lang")}</Text>
            <Text style={styles.itemSubtitle}>{i18n.t(`lang_${locale}` as any)}</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      </View>

       <View style={styles.section}>
        <Text style={styles.sectionTitle}>{i18n.t("settings_appinfo")}</Text>
        <View style={styles.item}>
          <Text style={styles.itemIcon}>ℹ️</Text>
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle}>{i18n.t("settings_version")}</Text>
            <Text style={styles.itemSubtitle}>1.0.0</Text>
          </View>
        </View>
      </View>

      <Modal
         animationType="fade"
         transparent={true}
         visible={modalVisible}
         onRequestClose={() => setModalVisible(false)}
       >
          <View style={styles.modalOverlay}>
             <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{i18n.t("settings_lang")}</Text>
                {[
                    { label: "한국어", value: "ko" },
                    { label: "English", value: "en" },
                    { label: "日本語", value: "ja" },
                    { label: "中文", value: "zh" },
                ].map((item) => (
                    <TouchableOpacity 
                        key={item.value} 
                        style={styles.modalItem} 
                        onPress={() => changeLanguageAndClose(item.value)}
                    >
                        <Text style={[styles.modalItemText, locale === item.value && styles.selectedItemText]}>{item.label}</Text>
                        {locale === item.value && <Text style={styles.checkMark}>✓</Text>}
                    </TouchableOpacity>
                ))}
                
                <TouchableOpacity 
                    style={[styles.modalItem, styles.cancelItem]} 
                    onPress={() => setModalVisible(false)}
                >
                    <Text style={styles.cancelText}>{i18n.t("pin_cancel")}</Text>
                </TouchableOpacity>
             </View>
          </View>
       </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7", // iOS system background color alike
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 14,
    width: '80%',
    paddingTop: 20,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
    color: '#000',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  modalItemText: {
    fontSize: 17,
    color: '#000',
  },
  selectedItemText: {
    fontWeight: '600',
    color: '#007AFF',
  },
  checkMark: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  cancelItem: {
    backgroundColor: '#F2F2F7',
  },
  cancelText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FF3B30',
    textAlign: 'center',
    width: '100%',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6E6E73",
    marginLeft: 20,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  item: {
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
  },
  itemIcon: {
    fontSize: 22,
    marginRight: 14,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: "400",
    color: "#000",
  },
  itemSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 2,
  },
  arrow: {
    fontSize: 18,
    color: "#C7C7CC",
    fontWeight: "600",
  },
});
