import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../services/supabase';
import { useAppDispatch } from '../store/hooks';
import { setSession } from '../features/authSlice';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from '../hooks/useTranslation';
import { ColorPalette } from '../constants/Colors';
import CustomButton from '../components/CustomButton';
import GlitchText from '../components/GlitchText';

export default function LoginScreen() {
  const colors = useThemeColors();
  const t = useTranslation();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('SYSTEM_ERROR', 'Yêu cầu nhập Email và Mật khẩu.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      Alert.alert('ACCESS_DENIED', error.message);
    } else if (data.session?.user) {
      Alert.alert('SYSTEM_ONLINE', 'Xác thực thành công. Đang tải dữ liệu...');
      
      dispatch(setSession({
        id: data.session.user.id,
        email: data.session.user.email || '',
      }));
      
      setTimeout(() => {
        router.replace('/' as any);
      }, 100); 
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <GlitchText text={t.login} />
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t.email}</Text>
        <TextInput
          style={styles.input}
          placeholder="sys.admin@cyborg.net"
          placeholderTextColor={colors.textLight}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t.password}</Text>
        <TextInput
          style={styles.input}
          placeholder="********"
          placeholderTextColor={colors.textLight}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <CustomButton title="INITIALIZE" onPress={handleSignIn} loading={loading} />
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>{t.noAccount}</Text>
        <TouchableOpacity onPress={() => router.push('/register' as any)}>
          <Text style={styles.link}>{t.registerNow}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (colors: ColorPalette) => StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: colors.background },
  inputGroup: { marginBottom: 20 },
  label: { color: colors.primary, fontFamily: 'monospace', fontSize: 14, marginBottom: 5 },
  input: { backgroundColor: colors.inputBg, color: colors.white, padding: 15, borderWidth: 1, borderColor: colors.border, fontFamily: 'monospace' },
  footer: { marginTop: 20, alignItems: 'center' },
  footerText: { color: colors.textLight, fontFamily: 'monospace', marginBottom: 10 },
  link: { color: colors.primary, fontFamily: 'monospace', fontWeight: 'bold' }
});