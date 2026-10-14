import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';

interface GlitchTextProps {
  text: string;
  fontSize?: number;
}

export default function GlitchText({ text, fontSize = 40 }: GlitchTextProps) {
  const [isGlitching, setIsGlitching] = useState(false);
  
  // Trạng thái cho hiệu ứng xé ngang chữ
  const [slice, setSlice] = useState({ y: 0, h: 0, x: 0 });
  
  // Trạng thái cho các khối cắt góc (Holes/Noise)
  const [cuts, setCuts] = useState([
    { top: 0, left: 0, width: 0, height: 0 },
    { bottom: 0, right: 0, width: 0, height: 0 }
  ]);

  

  useEffect(() => {
    const textHeight = fontSize * 1.2; // Chiều cao ước tính của chữ

    const interval = setInterval(() => {
      // Xác suất 40% xảy ra glitch mỗi 120ms
      if (Math.random() > 0.6) {
        setIsGlitching(true);
        
        // 1. Tạo thông số ngẫu nhiên cho lớp xé ngang
        setSlice({
          y: Math.random() * textHeight * 0.8, // Vị trí nhát cắt
          h: Math.random() * (fontSize * 0.4) + 2, // Độ dày nhát cắt
          x: (Math.random() - 0.5) * 20, // Độ lệch trái/phải
        });

        // 2. Tạo thông số cho các khối cắt khuyết ở góc
        setCuts([
          { 
            top: Math.random() * 5 - 2, 
            left: Math.random() * 5 - 2, 
            width: Math.random() * 15 + 5, 
            height: Math.random() * 10 + 5 
          },
          { 
            bottom: Math.random() * 5 - 2, 
            right: Math.random() * 10 - 2, 
            width: Math.random() * 20 + 5, 
            height: Math.random() * 8 + 4 
          }
        ]);

        // Trở về bình thường siêu tốc (50ms - 120ms)
        setTimeout(() => {
          setIsGlitching(false);
        }, Math.random() * 70 + 50);
      }
    }, 120);

    return () => clearInterval(interval);
  }, [fontSize]);

  return (
    <View style={styles.container}>
      {/* 1. TEXT GỐC */}
      <Text style={[styles.mainText, { fontSize }]}>{text}</Text>

      {/* 2. CHỚP MÀU (CYAN / MAGENTA) LỆCH NHAU */}
      {isGlitching && (
        <>
          <Text style={[styles.glitchLayer, { fontSize, color: Colors.glitchCyan, transform: [{ translateX: -3 }, { translateY: 2 }] }]}>{text}</Text>
          <Text style={[styles.glitchLayer, { fontSize, color: Colors.glitchMagenta, transform: [{ translateX: 3 }, { translateY: -2 }] }]}>{text}</Text>
        </>
      )}

      {/* 3. HIỆU ỨNG CẮT XÉ NGANG CHỮ (SLICE TEXT) */}
      {isGlitching && (
        <View style={[styles.sliceContainer, { top: slice.y, height: slice.h, transform: [{ translateX: slice.x }] }]}>
          {/* Chữ bên trong bị đẩy ngược lên bằng đúng top của container để khớp vị trí gốc */}
          <Text style={[styles.sliceText, { fontSize, top: -slice.y }]}>{text}</Text>
        </View>
      )}

      {/* 4. HIỆU ỨNG KHUYẾT GÓC (CORNER CUTS) */}
      {isGlitching && (
        <>
          {/* Khối che góc trái trên */}
          <View style={[styles.cutBlock, { top: cuts[0].top, left: cuts[0].left, width: cuts[0].width, height: cuts[0].height }]} />
          
          {/* Khối che góc phải dưới */}
          <View style={[styles.cutBlock, { bottom: cuts[1].bottom, right: cuts[1].right, width: cuts[1].width, height: cuts[1].height }]} />
          
          {/* Khối rác / Noise ngẫu nhiên trên bề mặt */}
          <View style={[styles.cutBlock, { top: '40%', left: '20%', width: 30, height: 2 }]} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  
  container: {
    position: 'relative',
    alignItems: 'flex-start',
    justifyContent: 'center',
    alignSelf: 'auto',
    marginBottom: 0,
  },

  mainText: {
    fontWeight: '900',
    color: Colors.white,
    fontFamily: 'monospace',
    zIndex: 1,
  },
  glitchLayer: {
    position: 'absolute',
    fontWeight: '900',
    fontFamily: 'monospace',
    opacity: 0.8,
    zIndex: 0, // Nằm dưới text chính
  },
  
  // CSS cho phần cắt xé
  sliceContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden', // Quan trọng: Chỉ hiển thị phần chữ bị cắt
    zIndex: 2,          // Đè lên trên chữ gốc
  },
  sliceText: {
    position: 'absolute',
    left: 0,
    fontWeight: '900',
    fontFamily: 'monospace',
    color: Colors.white,
    // Màu Cyan xen kẽ để nhát cắt trông kịch tính hơn
    textShadowColor: Colors.glitchCyan,
    textShadowOffset: { width: 2, height: 0 },
    textShadowRadius: 1,
  },

  // CSS cho các khối khuyết (Trùng màu nền để tạo cảm giác thủng/vỡ)
  cutBlock: {
    position: 'absolute',
    backgroundColor: Colors.background, 
    zIndex: 3, 
  }
});