import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../services/supabase';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from '../hooks/useTranslation';
import { ColorPalette } from '../constants/Colors';
import CustomButton from '../components/CustomButton';
import GlitchText from '../components/GlitchText';

export default function RegisterScreen() {
  const colors = useThemeColors();
  const t = useTranslation();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('SYSTEM_ERROR', 'Không được bỏ trống dữ liệu.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    
    if (error) {
      Alert.alert('CREATE_FAILED', error.message);
    } else {
      Alert.alert('ENTITY_CREATED', 'Đã khởi tạo. Hãy kiểm tra Email để kích hoạt tài khoản.', [
        { text: 'ACKNOWLEDGE', onPress: () => router.back() }
      ]);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <GlitchText text={t.register} />
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>NEW_{t.email}</Text>
        <TextInput 
          style={styles.input} 
          placeholder="user@matrix.com" 
          placeholderTextColor={colors.textLight} 
          value={email} 
          onChangeText={setEmail} 
          autoCapitalize="none" 
          keyboardType="email-address" 
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>NEW_{t.password}</Text>
        <TextInput 
          style={styles.input} 
          placeholder="********" 
          placeholderTextColor={colors.textLight} 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry 
        />
      </View>

      <CustomButton title="CREATE_ENTITY" onPress={handleSignUp} loading={loading} />
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>{t.hasAccount}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>{t.backToLogin}</Text>
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