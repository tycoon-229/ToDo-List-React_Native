import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Colors from '../constants/Colors';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  loading?: boolean;
}

export default function CustomButton({ title, onPress, variant = 'primary', loading = false }: CustomButtonProps) {
  const isOutline = variant === 'outline';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isOutline ? styles.buttonOutline : styles.buttonPrimary,
      ]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? Colors.primary : Colors.background} />
      ) : (
        <Text style={[styles.text, isOutline ? styles.textOutline : styles.textPrimary]}>
          {isOutline ? `[ ${title} ]` : `> ${title} _`} 
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 0, // Phong cách góc cạnh, không bo tròn
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5, // Phát sáng trên Android
  },
  buttonOutline: {
    backgroundColor: 'transparent',
  },
  text: {
    fontWeight: '900',
    fontSize: 16,
    fontFamily: 'monospace',
    textTransform: 'uppercase', // Chữ in hoa chuẩn Hacker
  },
  textPrimary: {
    color: Colors.background, // Chữ đen trên nền xanh lá
  },
  textOutline: {
    color: Colors.primary, // Chữ xanh lá
  },
});