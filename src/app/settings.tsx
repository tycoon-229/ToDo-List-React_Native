import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  Platform, 
  Image, 
  ActivityIndicator 
} from 'react-native';
import { router } from 'expo-router';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setProfile, clearSession } from '../features/authSlice';
import { setTheme, setLanguage, setTimezone } from '../features/settingsSlice';
import { supabase } from '../services/supabase';
import { uploadMediaToBucket } from '../services/storageService';
import GlitchText from '../components/GlitchText';
import { CYBER_DARK, CYBER_LIGHT, ColorPalette } from '../constants/Colors';
import { useTranslation } from '../hooks/useTranslation';

const TIMEZONE_OPTIONS = [
  'Asia/Ho_Chi_Minh',
  'UTC',
  'Asia/Tokyo',
  'America/New_York',
  'Europe/London'
];

export default function SettingsScreen() {
  const dispatch = useAppDispatch();
  const { user, profile } = useAppSelector(state => state.auth);
  const { theme, language, timezone } = useAppSelector(state => state.settings);

  const colors = theme === 'CYBER_DARK' ? CYBER_DARK : CYBER_LIGHT;
  const isDark = colors.background === '#0D0D0D';
  const styles = useMemo(() => getStyles(colors), [colors]);
  const isVi = language === 'VI';

  const [username, setUsername] = useState(profile.username || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [coverUrl, setCoverUrl] = useState(profile.cover_url);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [saveLoading, setSaveLoading] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const t = useTranslation();

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
      if (profile.cover_url) setCoverUrl(profile.cover_url);
    }
  }, [profile]);

  const triggerCoverPicker = () => {
    if (coverInputRef.current) {
      coverInputRef.current.click();
    } else if (Platform.OS === 'web' && typeof document !== 'undefined') {
      (document.getElementById('cover-file-input') as HTMLInputElement)?.click();
    }
  };

  const triggerAvatarPicker = () => {
    if (avatarInputRef.current) {
      avatarInputRef.current.click();
    } else if (Platform.OS === 'web' && typeof document !== 'undefined') {
      (document.getElementById('avatar-file-input') as HTMLInputElement)?.click();
    }
  };

  const handleAvatarFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarUrl(URL.createObjectURL(file));
  };

  const handleCoverFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverUrl(URL.createObjectURL(file));
  };

  const handleSaveAll = async () => {
    if (!user?.id) return;
    setSaveLoading(true);

    try {
      let finalAvatarUrl = avatarUrl;
      let finalCoverUrl = coverUrl;

      if (avatarFile) {
        finalAvatarUrl = await uploadMediaToBucket(avatarFile, user.id, 'avatar');
      }

      if (coverFile) {
        finalCoverUrl = await uploadMediaToBucket(coverFile, user.id, 'cover');
      }

      const updatePayload = {
        id: user.id,
        username: username.trim(),
        bio: bio.trim(),
        avatar_url: finalAvatarUrl,
        cover_url: finalCoverUrl,
        theme,
        language,
        timezone,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updatePayload);

      if (error) throw error;

      dispatch(setProfile({
        username: updatePayload.username,
        bio: updatePayload.bio,
        avatar_url: updatePayload.avatar_url,
        cover_url: updatePayload.cover_url,
      }));

      setAvatarUrl(finalAvatarUrl);
      setCoverUrl(finalCoverUrl);
      setAvatarFile(null);
      setCoverFile(null);

      const successMsg = isVi 
        ? 'Dữ liệu và hình ảnh đã được upload lên máy chủ thành công!' 
        : 'Media uploaded and profile synced successfully!';

      if (Platform.OS === 'web') window.alert(`SETTINGS_SYNCED: ${successMsg}`);
      else Alert.alert('SETTINGS_SYNCED', successMsg);

    } catch (err: any) {
      if (Platform.OS === 'web') window.alert(`SYS_ERR: ${err.message}`);
      else Alert.alert('SYS_ERR', err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    dispatch(clearSession());
    router.replace('/login' as any);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/' as any);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      contentContainerStyle={styles.scrollContent}
    >
      {Platform.OS === 'web' && (
        <>
          <input
            id="avatar-file-input"
            type="file"
            ref={avatarInputRef as any}
            style={{ display: 'none' }}
            accept="image/*,.gif"
            onChange={handleAvatarFileChange}
          />
          <input
            id="cover-file-input"
            type="file"
            ref={coverInputRef as any}
            style={{ display: 'none' }}
            accept="image/*,.gif"
            onChange={handleCoverFileChange}
          />
        </>
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={[styles.backLink, { color: colors.primary }]}>{'< SYS_HOME'}</Text>
        </TouchableOpacity>
        <GlitchText text={t.profile} fontSize={24} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.primary }]}>
          {isVi ? '1. DIỆN MẠO THẦN KINH (AVATAR & BANNER GIF) //' : '1. NEURAL_VISUALS (AVATAR & BANNER GIF) //'}
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.coverTouchable,
            { borderColor: coverFile ? colors.glitchCyan : colors.border }
          ]}
          onPress={triggerCoverPicker}
        >
          <Image 
            source={{ uri: coverUrl || 'https://media.giphy.com/media/3o7TKTDnUxE0g2fSE8/giphy.gif' }} 
            style={styles.coverImage} 
            resizeMode="cover"
          />
          <View style={styles.coverBadge}>
            <Text style={[styles.coverBadgeText, { color: coverFile ? colors.glitchCyan : colors.primary }]}>
              {coverFile 
                ? (isVi ? '[ BÌA MỚI CHỜ LƯU ● ]' : '[ COVER_STAGED ● ]') 
                : (isVi ? '[ ⟳ BẤM ĐỂ ĐỔI ẢNH BÌA ]' : '[ ⟳ CLICK_TO_CHANGE_COVER ]')}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.avatarRowContainer} pointerEvents="box-none">
          <TouchableOpacity 
            activeOpacity={0.85}
            style={[
              styles.avatarTouchable,
              { borderColor: avatarFile ? colors.glitchCyan : colors.primary }
            ]}
            onPress={triggerAvatarPicker}
          >
            <Image 
              source={{ uri: avatarUrl || 'https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif' }} 
              style={styles.avatarImage} 
              resizeMode="cover"
            />
            <View style={styles.avatarOverlayBadge}>
              <Text style={[styles.avatarBadgeText, { color: avatarFile ? colors.glitchCyan : colors.primary }]}>
                {avatarFile ? 'STAGED' : '⟳ EDIT'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.avatarMeta}>
            <View 
              style={[
                styles.nameHighlightWrapper, 
                { 
                  borderLeftColor: colors.primary,
                  borderColor: colors.border,
                  backgroundColor: isDark 
                    ? 'rgba(10, 10, 10, 0.8)' 
                    : 'rgba(255, 255, 255, 0.85)',
                }
              ]}
            >
              <Text 
                style={[
                  styles.avatarMetaName, 
                  { 
                    color: colors.white,
                    textShadowColor: isDark 
                      ? 'rgba(0, 0, 0, 0.95)' 
                      : 'rgba(255, 255, 255, 0.9)',
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 4,
                  }
                ]} 
                numberOfLines={1}
              >
                {username || user?.email?.split('@')[0] || 'Cyborg_User'}
              </Text>
            </View>

            <Text style={[styles.avatarMetaDesc, { color: (avatarFile || coverFile) ? colors.glitchCyan : colors.textLight }]}>
              {(avatarFile || coverFile)
                ? (isVi ? '● Đã chọn ảnh mới (Nhớ bấm nút Lưu bên dưới)' : '● Media staged (Commit to save)')
                : (isVi ? 'Bấm vào Avatar hoặc Bìa để đổi ảnh/GIF' : 'Click Avatar or Cover to change GIF')}
            </Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.textLight }]}>
            {isVi ? 'HOẶC DÁN TRỰC TIẾP URL AVATAR (GIF/PNG) //:' : 'OR PASTE DIRECT AVATAR URL //:'}
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.white, borderColor: colors.border }]}
            value={avatarUrl}
            onChangeText={(text) => {
              setAvatarUrl(text);
              setAvatarFile(null);
            }}
            placeholder="https://.../cyber.gif"
            placeholderTextColor={colors.textLight}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.textLight }]}>
            {isVi ? 'HOẶC DÁN TRỰC TIẾP URL ẢNH BÌA (GIF/PNG) //:' : 'OR PASTE DIRECT COVER URL //:'}
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.white, borderColor: colors.border }]}
            value={coverUrl}
            onChangeText={(text) => {
              setCoverUrl(text);
              setCoverFile(null);
            }}
            placeholder="https://.../banner.gif"
            placeholderTextColor={colors.textLight}
          />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.primary }]}>
          {isVi ? '2. THÔNG TIN ĐỊNH DANH (IDENTITY) //' : '2. OPERATIVE_IDENTITY //'}
        </Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.textLight }]}>
            {isVi ? 'TÊN HIỂN THỊ (CODENAME) //:' : 'CODENAME //:'}
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.white, borderColor: colors.border }]}
            value={username}
            onChangeText={setUsername}
            placeholder="Cyborg_User_01"
            placeholderTextColor={colors.textLight}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.textLight }]}>BIO //:</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.white, borderColor: colors.border, height: 70 }]}
            value={bio}
            onChangeText={setBio}
            placeholder="Mô tả danh tính hoặc nhiệm vụ..."
            placeholderTextColor={colors.textLight}
            multiline
          />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.primary }]}>
          {isVi ? '3. GIAO DIỆN HỆ THỐNG (THEME) //' : '3. SYSTEM_INTERFACE_THEME //'}
        </Text>

        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.themeOptionBtn, 
              theme === 'CYBER_DARK' && styles.themeOptionBtnActive
            ]}
            onPress={() => dispatch(setTheme('CYBER_DARK'))}
          >
            <Text style={[
              styles.themeOptionText, 
              theme === 'CYBER_DARK' ? (isDark ? styles.btnTextDarkActive : styles.btnTextLightActive) : { color: colors.white }
            ]}>
              [ CYBER_DARK ]
            </Text>
            <Text style={[styles.themeDesc, { color: theme === 'CYBER_DARK' ? (isDark ? colors.primary : '#000000') : colors.textLight }]}>
              {isVi ? 'Đen tuyền Neon' : 'Pure Dark & Neon'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.themeOptionBtn, 
              theme === 'CYBER_LIGHT' && styles.themeOptionBtnActive
            ]}
            onPress={() => dispatch(setTheme('CYBER_LIGHT'))}
          >
            <Text style={[
              styles.themeOptionText, 
              theme === 'CYBER_LIGHT' ? (isDark ? styles.btnTextDarkActive : styles.btnTextLightActive) : { color: colors.white }
            ]}>
              [ CYBER_LIGHT ]
            </Text>
            <Text style={[styles.themeDesc, { color: theme === 'CYBER_LIGHT' ? (isDark ? colors.primary : '#000000') : colors.textLight }]}>
              {isVi ? 'Xám sáng kim loại' : 'Light Chrome Metal'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.primary }]}>
          {isVi ? '4. BẢN ĐỊA HÓA (LOCALIZATION) //' : '4. LOCALE_AND_TIMEZONE //'}
        </Text>

        <Text style={[styles.inputLabel, { color: colors.textLight }]}>
          {isVi ? 'NGÔN NGỮ HỆ THỐNG //:' : 'INTERFACE_LANGUAGE //:'}
        </Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.localeBtn, 
              language === 'VI' && styles.localeBtnActive
            ]}
            onPress={() => dispatch(setLanguage('VI'))}
          >
            <Text style={[styles.localeBtnText, language === 'VI' ? (isDark ? styles.btnTextDarkActive : styles.btnTextLightActive) : { color: colors.white }]}>
              VI - TIẾNG VIỆT
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.localeBtn, 
              language === 'EN' && styles.localeBtnActive
            ]}
            onPress={() => dispatch(setLanguage('EN'))}
          >
            <Text style={[styles.localeBtnText, language === 'EN' ? (isDark ? styles.btnTextDarkActive : styles.btnTextLightActive) : { color: colors.white }]}>
              EN - ENGLISH
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.inputLabel, { color: colors.textLight, marginTop: 15 }]}>
          {isVi ? 'MÚI GIỜ KHU VỰC (TIMEZONE) //:' : 'REGION_TIMEZONE //:'}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 5 }}>
          {TIMEZONE_OPTIONS.map((tz) => (
            <TouchableOpacity
              key={tz}
              style={[
                styles.tzBtn, 
                timezone === tz && styles.tzBtnActive
              ]}
              onPress={() => dispatch(setTimezone(tz))}
            >
              <Text style={[
                styles.tzBtnText, 
                timezone === tz ? (isDark ? styles.btnTextDarkActive : styles.btnTextLightActive) : { color: colors.white }
              ]}>
                {tz}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* NÚT LƯU THEO QUY CHUẨN MỚI */}
      <TouchableOpacity 
        style={[styles.saveBtn, isDark ? styles.btnDark : styles.btnLight]}
        onPress={handleSaveAll}
        disabled={saveLoading}
      >
        {saveLoading ? (
          <ActivityIndicator color={isDark ? colors.primary : '#000000'} />
        ) : (
          <Text style={[styles.saveBtnText, isDark ? styles.btnTextDark : styles.btnTextLight]}>
            {isVi ? '> LƯU VÀ ĐỒNG BỘ TOÀN BỘ HỆ THỐNG _' : '> COMMIT_PROFILE_AND_SETTINGS _'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.logoutBtn, { borderColor: colors.danger }]}
        onPress={handleLogout}
      >
        <Text style={[styles.logoutBtnText, { color: colors.danger }]}>
          [ DISCONNECT_SESSION (LOGOUT) ]
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const getStyles = (colors: ColorPalette) => {
  const isDark = colors.background === '#0D0D0D';

  return StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 20, paddingTop: 50, paddingBottom: 60 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    backLink: { fontFamily: 'monospace', fontWeight: 'bold' },

    card: { borderWidth: 1, padding: 16, marginBottom: 20 },
    cardTitle: { fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold', marginBottom: 15 },

    coverTouchable: {
      height: 140,
      width: '100%',
      position: 'relative',
      backgroundColor: '#000',
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: colors.border,
      zIndex: 1,
    },
    coverImage: { width: '100%', height: '100%' },
    coverBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: 'rgba(0,0,0,0.85)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    coverBadgeText: { fontFamily: 'monospace', fontSize: 10, fontWeight: 'bold' },

    avatarRowContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: -35,
      marginBottom: 15,
      paddingHorizontal: 10,
      zIndex: 10,
    },
    avatarTouchable: {
      width: 76,
      height: 76,
      borderWidth: 2,
      borderColor: colors.primary,
      backgroundColor: '#000',
      overflow: 'hidden',
      position: 'relative',
    },
    avatarImage: { width: '100%', height: '100%' },
    avatarOverlayBadge: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.75)',
      alignItems: 'center',
      paddingVertical: 2,
    },
    avatarBadgeText: { fontFamily: 'monospace', fontSize: 9, fontWeight: 'bold' },

    avatarMeta: {
      marginLeft: 14,
      flex: 1,
      justifyContent: 'center',
    },
    nameHighlightWrapper: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      alignSelf: 'flex-start',
      marginBottom: 6,
      ...(Platform.OS === 'web' ? { 
        backdropFilter: 'blur(8px)', 
        WebkitBackdropFilter: 'blur(8px)' 
      } as any : {}),
    },
    avatarMetaName: {
      fontFamily: 'monospace',
      fontSize: 15,
      fontWeight: 'bold',
      letterSpacing: 0.5,
    },
    avatarMetaDesc: {
      fontFamily: 'monospace',
      fontSize: 11,
      lineHeight: 16,
    },

    inputGroup: { marginBottom: 14 },
    inputLabel: { fontFamily: 'monospace', fontSize: 11, marginBottom: 4 },
    input: { padding: 10, borderWidth: 1, fontFamily: 'monospace', fontSize: 12 },

    toggleRow: { flexDirection: 'row', justifyContent: 'space-between' },
    themeOptionBtn: {
      flex: 1,
      padding: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      marginHorizontal: 4,
      backgroundColor: isDark ? '#0D0D0D' : colors.surface,
    },
    themeOptionBtnActive: {
      backgroundColor: isDark ? '#0D0D0D' : colors.primary,
      borderColor: colors.primary,
      borderWidth: 2,
    },
    themeOptionText: { fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold' },
    themeDesc: { fontFamily: 'monospace', fontSize: 9, marginTop: 4 },

    localeBtn: {
      flex: 1,
      padding: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      marginHorizontal: 4,
      backgroundColor: isDark ? '#0D0D0D' : colors.surface,
    },
    localeBtnActive: {
      backgroundColor: isDark ? '#0D0D0D' : colors.primary,
      borderColor: colors.primary,
      borderWidth: 2,
    },
    localeBtnText: { fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' },

    tzBtn: { 
      paddingVertical: 8, 
      paddingHorizontal: 12, 
      borderWidth: 1.5, 
      borderColor: colors.border, 
      marginRight: 8, 
      alignItems: 'center',
      backgroundColor: isDark ? '#0D0D0D' : colors.surface,
    },
    tzBtnActive: {
      backgroundColor: isDark ? '#0D0D0D' : colors.primary,
      borderColor: colors.primary,
      borderWidth: 2,
    },
    tzBtnText: { fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' },

    saveBtn: { 
      padding: 14, 
      alignItems: 'center', 
      marginBottom: 15,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    btnDark: {
      backgroundColor: '#0D0D0D',
    },
    btnLight: {
      backgroundColor: colors.primary,
    },
    saveBtnText: { 
      fontFamily: 'monospace', 
      fontWeight: 'bold', 
      fontSize: 13 
    },
    btnTextDark: {
      color: colors.primary,
    },
    btnTextLight: {
      color: '#000000',
    },
    btnTextDarkActive: {
      color: colors.primary,
    },
    btnTextLightActive: {
      color: '#000000',
    },

    logoutBtn: { padding: 14, borderWidth: 1, alignItems: 'center', backgroundColor: 'rgba(255, 0, 60, 0.05)' },
    logoutBtnText: { fontFamily: 'monospace', fontWeight: 'bold', fontSize: 13 }
  });
};