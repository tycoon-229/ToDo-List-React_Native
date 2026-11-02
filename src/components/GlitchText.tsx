import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { ColorPalette } from '../constants/Colors';

interface GlitchTextProps {
  text: string;
  fontSize?: number;
}

export default function GlitchText({ text, fontSize = 40 }: GlitchTextProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [isGlitching, setIsGlitching] = useState(false);
  
  const [slice, setSlice] = useState({ y: 0, h: 0, x: 0 });
  const [cuts, setCuts] = useState([
    { top: 0, left: 0, width: 0, height: 0 },
    { bottom: 0, right: 0, width: 0, height: 0 }
  ]);

  useEffect(() => {
    const textHeight = fontSize * 1.2;
    let glitchTimeout: ReturnType<typeof setTimeout> | undefined;

    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        if (glitchTimeout) clearTimeout(glitchTimeout);

        setIsGlitching(true);
        setSlice({
          y: Math.random() * textHeight * 0.8,
          h: Math.random() * (fontSize * 0.4) + 2,
          x: (Math.random() - 0.5) * 20,
        });

        setCuts([
          {
            top: Math.random() * 5 - 2,
            left: Math.random() * 5 - 2,
            width: Math.random() * 15 + 5,
            height: Math.random() * 10 + 5,
          },
          {
            bottom: Math.random() * 5 - 2,
            right: Math.random() * 10 - 2,
            width: Math.random() * 20 + 5,
            height: Math.random() * 8 + 4,
          },
        ]);

        glitchTimeout = setTimeout(() => {
          setIsGlitching(false);
          glitchTimeout = undefined;
        }, Math.random() * 70 + 50);
      }
    }, 120);

    return () => {
      clearInterval(interval);
      if (glitchTimeout) clearTimeout(glitchTimeout);
    };
  }, [fontSize]);

  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={[styles.mainText, { fontSize }]}>{text}</Text>

      {isGlitching && (
        <>
          <Text style={[styles.glitchLayer, { fontSize, color: colors.glitchCyan, transform: [{ translateX: -3 }, { translateY: 2 }] }]}>{text}</Text>
          <Text style={[styles.glitchLayer, { fontSize, color: colors.glitchMagenta, transform: [{ translateX: 3 }, { translateY: -2 }] }]}>{text}</Text>
        </>
      )}

      {isGlitching && (
        <View style={[styles.sliceContainer, { top: slice.y, height: slice.h, transform: [{ translateX: slice.x }] }]}>
          <Text style={[styles.sliceText, { fontSize, top: -slice.y }]}>{text}</Text>
        </View>
      )}

      {isGlitching && (
        <>
          <View style={[styles.cutBlock, { top: cuts[0].top, left: cuts[0].left, width: cuts[0].width, height: cuts[0].height }]} />
          <View style={[styles.cutBlock, { bottom: cuts[1].bottom, right: cuts[1].right, width: cuts[1].width, height: cuts[1].height }]} />
          <View style={[styles.cutBlock, { top: '40%', left: '20%', width: 30, height: 2 }]} />
        </>
      )}
    </View>
  );
}

const getStyles = (colors: ColorPalette) => StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'flex-start',
    justifyContent: 'center',
    alignSelf: 'auto',
    marginBottom: 0,
  },
  mainText: {
    fontWeight: '900',
    color: colors.white,
    fontFamily: 'monospace',
    zIndex: 1,
  },
  glitchLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    fontWeight: '900',
    fontFamily: 'monospace',
    opacity: 0.8,
    zIndex: 0,
  },
  sliceContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 2,
  },
  sliceText: {
    position: 'absolute',
    left: 0,
    fontWeight: '900',
    fontFamily: 'monospace',
    color: colors.white,
    textShadowColor: colors.glitchCyan,
    textShadowOffset: { width: 2, height: 0 },
    textShadowRadius: 1,
  },
  cutBlock: {
    position: 'absolute',
    backgroundColor: colors.background,
    zIndex: 3,
  }
});