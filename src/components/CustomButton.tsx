import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { ColorPalette } from '../constants/Colors';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  loading?: boolean;
}

export default function CustomButton({ title, onPress, variant = 'primary', loading = false }: CustomButtonProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const isOutline = variant === 'outline';
  const isDark = colors.background === '#0D0D0D';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isDark ? styles.buttonDark : styles.buttonLight,
        isOutline && (isDark ? styles.buttonOutlineDark : styles.buttonOutlineLight),
      ]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={isDark ? colors.primary : '#000000'} />
      ) : (
        <Text style={[
          styles.text, 
          isOutline 
            ? (isDark ? styles.textOutlineDark : styles.textOutlineLight)
            : (isDark ? styles.textDark : styles.textLight)
        ]}>
          {isOutline ? `[ ${title} ]` : `> ${title} _`} 
        </Text>
      )}
    </TouchableOpacity>
  );
}

const getStyles = (colors: ColorPalette) => StyleSheet.create({
  button: {
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 0,
  },
  buttonDark: {
    backgroundColor: '#0D0D0D',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  buttonLight: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonOutlineDark: {
    backgroundColor: 'transparent',
    borderColor: colors.primary,
  },
  buttonOutlineLight: {
    backgroundColor: 'transparent',
    borderColor: colors.primary,
  },
  text: {
    fontWeight: '900',
    fontSize: 16,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
  textDark: {
    color: colors.primary,
  },
  textLight: {
    color: '#000000',
  },
  textOutlineDark: {
    color: colors.primary,
  },
  textOutlineLight: {
    color: '#000000',
  },
});