import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../services/supabase';
import CustomButton from '../components/CustomButton';
import GlitchText from '../components/GlitchText';
import Colors from '../constants/Colors';

export default function RegisterScreen() {
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
      <GlitchText text="REGISTER" />
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>NEW_EMAIL //:</Text>
        <TextInput style={styles.input} placeholder="user@matrix.com" placeholderTextColor={Colors.textLight} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>NEW_PASSWORD //:</Text>
        <TextInput style={styles.input} placeholder="********" placeholderTextColor={Colors.textLight} value={password} onChangeText={setPassword} secureTextEntry />
      </View>

      <CustomButton title="CREATE_ENTITY" onPress={handleSignUp} loading={loading} />
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Đã có tài khoản?</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>[ QUAY LẠI LOGIN ]</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: Colors.background },
  inputGroup: { marginBottom: 20 },
  label: { color: Colors.primary, fontFamily: 'monospace', fontSize: 14, marginBottom: 5 },
  input: { backgroundColor: Colors.surface, color: Colors.white, padding: 15, borderWidth: 1, borderColor: Colors.border, fontFamily: 'monospace' },
  footer: { marginTop: 20, alignItems: 'center' },
  footerText: { color: Colors.textLight, fontFamily: 'monospace', marginBottom: 10 },
  link: { color: Colors.primary, fontFamily: 'monospace', fontWeight: 'bold' }
});