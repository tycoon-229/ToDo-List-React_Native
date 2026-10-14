import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAppSelector } from '../store/hooks';
import { playCyborgAlertSound, triggerCyborgNotification } from '../services/notificationService';
import GlitchText from '../components/GlitchText';
import CustomButton from '../components/CustomButton';
import Colors from '../constants/Colors';

type Mode = 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';

export default function FocusScreen() {
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();
  const tasks = useAppSelector(state => state.tasks.tasksList);
  
  // Task mục tiêu
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(taskId || null);
  const activeTask = tasks.find(t => t.id === selectedTaskId);

  // 1. Quản lý thời lượng tùy chỉnh (Đơn vị: phút)
  const [durations, setDurations] = useState({
    FOCUS: 25,
    SHORT_BREAK: 5,
    LONG_BREAK: 15,
  });

  // State tạm thời trong bảng cấu hình
  const [inputFocus, setInputFocus] = useState('25');
  const [inputShort, setInputShort] = useState('5');
  const [inputLong, setInputLong] = useState('15');
  const [showConfig, setShowConfig] = useState(false);

  // 2. State đồng hồ đếm ngược
  const [mode, setMode] = useState<Mode>('FOCUS');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [completedCycles, setCompletedCycles] = useState(0);

  // Tổng số giây của chế độ hiện tại để tính % tiến độ
  const totalDuration = useMemo(() => {
    return Math.max(durations[mode] * 60, 1);
  }, [durations, mode]);

  // Bộ đếm thời gian
  useEffect(() => {
    let timer: any = null;

    if (isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      playCyborgAlertSound();
      setIsActive(false);

      if (mode === 'FOCUS') {
        const nextCycles = completedCycles + 1;
        setCompletedCycles(nextCycles);
        triggerCyborgNotification(
          'CYCLE_COMPLETED',
          `Hoàn thành phiên tập trung cho node: ${activeTask ? activeTask.title : 'GENERAL_TASK'}`
        );

        if (nextCycles % 4 === 0) {
          switchMode('LONG_BREAK');
        } else {
          switchMode('SHORT_BREAK');
        }
      } else {
        triggerCyborgNotification('BREAK_OVER', 'Thời gian xả năng lượng kết thúc. Khởi động lại FOCUS!');
        switchMode('FOCUS');
      }
    }

    return () => clearInterval(timer);
  }, [isActive, timeLeft, mode, completedCycles, activeTask, durations]);

  // Chuyển đổi giữa các chế độ
  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setTimeLeft(durations[newMode] * 60);
    setIsActive(false);
  };

  // Reset về thời lượng ban đầu của chế độ hiện tại
  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(durations[mode] * 60);
  };

  // Tăng/giảm thời gian nhanh bằng phút (+/-) khi đồng hồ đang dừng
  const handleAdjustMinutes = (deltaMinutes: number) => {
    if (isActive) return;
    const newSeconds = Math.max(60, timeLeft + deltaMinutes * 60);
    setTimeLeft(newSeconds);
    // Cập nhật lại thời lượng gốc của mode hiện tại để thanh % tính chuẩn xác
    const newMins = Math.round(newSeconds / 60);
    setDurations(prev => ({ ...prev, [mode]: newMins }));
    if (mode === 'FOCUS') setInputFocus(newMins.toString());
    if (mode === 'SHORT_BREAK') setInputShort(newMins.toString());
    if (mode === 'LONG_BREAK') setInputLong(newMins.toString());
  };

  // Áp dụng số phút nhập từ bảng cấu hình
  const handleApplyCustomConfig = () => {
    const f = Math.max(1, parseInt(inputFocus, 10) || 25);
    const s = Math.max(1, parseInt(inputShort, 10) || 5);
    const l = Math.max(1, parseInt(inputLong, 10) || 15);

    const newDurations = { FOCUS: f, SHORT_BREAK: s, LONG_BREAK: l };
    setDurations(newDurations);
    setTimeLeft(newDurations[mode] * 60);
    setIsActive(false);
    setShowConfig(false);

    if (Platform.OS === 'web') window.alert('TIMER_CONFIG_APPLIED: Đã ghi đè thời lượng chu kỳ mới.');
  };

  // Định dạng mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = Math.min(100, Math.max(0, Math.round(((totalDuration - timeLeft) / totalDuration) * 100)));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>{'< SYS_HOME'}</Text>
        </TouchableOpacity>
        <GlitchText text="CYBER_FOCUS" fontSize={24} />
      </View>

      {/* CHỌN MỤC TIÊU TẬP TRUNG */}
      <View style={styles.targetCard}>
        <Text style={styles.targetLabel}>TARGET_NODE //:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.targetScroll}>
          <TouchableOpacity 
            style={[styles.targetChip, selectedTaskId === null && styles.targetChipActive]}
            onPress={() => setSelectedTaskId(null)}
          >
            <Text style={[styles.targetChipText, selectedTaskId === null && { color: Colors.background }]}>
              [ GENERAL_NEURAL_SESSION ]
            </Text>
          </TouchableOpacity>

          {tasks.filter(t => t.status === 'TODO').map(t => (
            <TouchableOpacity 
              key={t.id} 
              style={[styles.targetChip, selectedTaskId === t.id && styles.targetChipActive]}
              onPress={() => setSelectedTaskId(t.id)}
            >
              <Text style={[styles.targetChipText, selectedTaskId === t.id && { color: Colors.background }]}>
                {t.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* TABS CHUYỂN CHẾ ĐỘ KÈM SỐ PHÚT HIỆN TẠI */}
      <View style={styles.modeTabs}>
        <TouchableOpacity 
          style={[styles.modeBtn, mode === 'FOCUS' && styles.modeBtnActive]} 
          onPress={() => switchMode('FOCUS')}
        >
          <Text style={[styles.modeText, mode === 'FOCUS' && { color: Colors.background }]}>
            FOCUS ({durations.FOCUS}M)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.modeBtn, mode === 'SHORT_BREAK' && styles.modeBtnActive]} 
          onPress={() => switchMode('SHORT_BREAK')}
        >
          <Text style={[styles.modeText, mode === 'SHORT_BREAK' && { color: Colors.background }]}>
            SHORT ({durations.SHORT_BREAK}M)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.modeBtn, mode === 'LONG_BREAK' && styles.modeBtnActive]} 
          onPress={() => switchMode('LONG_BREAK')}
        >
          <Text style={[styles.modeText, mode === 'LONG_BREAK' && { color: Colors.background }]}>
            LONG ({durations.LONG_BREAK}M)
          </Text>
        </TouchableOpacity>
      </View>

      {/* MÀN HÌNH ĐỒNG HỒ HUD */}
      <View style={styles.clockCard}>
        <Text style={styles.clockModeHeader}>
          {mode === 'FOCUS' ? '>>> PROTOCOL: DEEP_FOCUS <<<' : '>>> PROTOCOL: RECHARGE_ENERGY <<<'}
        </Text>

        <Text style={styles.timerDisplay}>{formatTime(timeLeft)}</Text>

        {/* BỘ NÚT TĂNG/GIẢM NHANH THỜI GIAN KHI TẠM DỪNG */}
        {!isActive && (
          <View style={styles.adjustRow}>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => handleAdjustMinutes(-5)}>
              <Text style={styles.adjustBtnText}>-5M</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => handleAdjustMinutes(-1)}>
              <Text style={styles.adjustBtnText}>-1M</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => handleAdjustMinutes(1)}>
              <Text style={styles.adjustBtnText}>+1M</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => handleAdjustMinutes(5)}>
              <Text style={styles.adjustBtnText}>+5M</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Thanh Gauge Bar tiến độ */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>ELAPSED: {progressPercent}%</Text>
          <Text style={styles.metaText}>CYCLES_COMPLETED: [{completedCycles}]</Text>
        </View>
      </View>

      {/* BẢNG ĐIỀU KHIỂN NÚT BẤM */}
      <View style={styles.actionRow}>
        <View style={{ flex: 2, marginRight: 10 }}>
          <CustomButton 
            title={isActive ? 'PAUSE_PROTOCOL' : 'ENGAGE_FOCUS'} 
            onPress={() => {
              playCyborgAlertSound();
              setIsActive(!isActive);
            }} 
          />
        </View>
        <View style={{ flex: 1 }}>
          <CustomButton 
            title="RESET" 
            variant="outline" 
            onPress={handleReset} 
          />
        </View>
      </View>

      {/* NÚT MỞ BẢNG CẤU HÌNH SỐ PHÚT CHUYÊN SÂU */}
      <TouchableOpacity 
        style={styles.configToggleBtn} 
        onPress={() => setShowConfig(!showConfig)}
      >
        <Text style={styles.configToggleText}>
          {showConfig ? '[ HIDE_CUSTOM_CONFIG ▲ ]' : '[ CUSTOMIZE_DURATIONS_CONFIG ▼ ]'}
        </Text>
      </TouchableOpacity>

      {/* BẢNG NHẬP PHÚT TÙY Ý */}
      {showConfig && (
        <View style={styles.configCard}>
          <Text style={styles.configHeading}>CUSTOM_DURATION_MATRIX (MINUTES) //:</Text>

          <View style={styles.inputGroupRow}>
            <View style={styles.inputCol}>
              <Text style={styles.inputLabel}>FOCUS //:</Text>
              <TextInput
                style={styles.numberInput}
                value={inputFocus}
                onChangeText={setInputFocus}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            <View style={styles.inputCol}>
              <Text style={styles.inputLabel}>SHORT_BREAK //:</Text>
              <TextInput
                style={styles.numberInput}
                value={inputShort}
                onChangeText={setInputShort}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            <View style={styles.inputCol}>
              <Text style={styles.inputLabel}>LONG_BREAK //:</Text>
              <TextInput
                style={styles.numberInput}
                value={inputLong}
                onChangeText={setInputLong}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.applyBtn} onPress={handleApplyCustomConfig}>
            <Text style={styles.applyBtnText}>&gt; APPLY_DURATIONS_OVERWRITE &lt;</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* THÔNG TIN NHIỆM VỤ ĐANG TẬP TRUNG */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>FOCUS_SESSION_INTEL //</Text>
        <Text style={styles.statsDesc}>
          {activeTask 
            ? `Đang dồn năng lượng xử lý node: "${activeTask.title}"`
            : 'Chưa gắn với node cụ thể. Phiên tập trung sẽ được ghi nhận vào hiệu suất chung.'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 20, paddingTop: 50, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backLink: { color: Colors.primary, fontFamily: 'monospace', fontWeight: 'bold' },

  targetCard: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 15 },
  targetLabel: { color: Colors.primary, fontFamily: 'monospace', fontSize: 11, marginBottom: 8, fontWeight: 'bold' },
  targetScroll: { flexDirection: 'row' },
  targetChip: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.border, marginRight: 8, backgroundColor: Colors.background },
  targetChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  targetChipText: { color: Colors.white, fontFamily: 'monospace', fontSize: 11 },

  modeTabs: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modeBtn: { flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', marginHorizontal: 2, backgroundColor: Colors.surface },
  modeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  modeText: { color: Colors.white, fontFamily: 'monospace', fontSize: 10, fontWeight: 'bold' },

  clockCard: { 
    backgroundColor: Colors.surface, 
    borderWidth: 2, 
    borderColor: Colors.primary, 
    padding: 24, 
    alignItems: 'center', 
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  clockModeHeader: { color: Colors.glitchCyan, fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', marginBottom: 10 },
  timerDisplay: { 
    color: Colors.white, 
    fontFamily: 'monospace', 
    fontSize: 60, 
    fontWeight: '900', 
    letterSpacing: 4,
    marginBottom: 10,
    textShadowColor: Colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },

  // Bộ nút tăng/giảm nhanh
  adjustRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 15 },
  adjustBtn: { 
    borderWidth: 1, 
    borderColor: Colors.border, 
    paddingVertical: 4, 
    paddingHorizontal: 10, 
    marginHorizontal: 4, 
    backgroundColor: Colors.background 
  },
  adjustBtnText: { color: Colors.glitchCyan, fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' },

  progressTrack: { height: 10, width: '100%', backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  progressFill: { height: '100%', backgroundColor: Colors.primary },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  metaText: { color: Colors.textLight, fontFamily: 'monospace', fontSize: 10 },

  actionRow: { flexDirection: 'row', marginBottom: 15 },

  // Toggle bảng cấu hình
  configToggleBtn: { 
    borderWidth: 1, 
    borderColor: Colors.glitchCyan, 
    padding: 10, 
    alignItems: 'center', 
    backgroundColor: Colors.surface, 
    marginBottom: 15 
  },
  configToggleText: { color: Colors.glitchCyan, fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' },

  // Bảng nhập phút tùy chỉnh
  configCard: { 
    backgroundColor: Colors.surface, 
    borderWidth: 1, 
    borderColor: Colors.primary, 
    padding: 16, 
    marginBottom: 20 
  },
  configHeading: { color: Colors.primary, fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold', marginBottom: 12 },
  inputGroupRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  inputCol: { flex: 1, marginHorizontal: 4 },
  inputLabel: { color: Colors.textLight, fontFamily: 'monospace', fontSize: 10, marginBottom: 4 },
  numberInput: { 
    backgroundColor: Colors.background, 
    color: Colors.white, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    padding: 10, 
    fontFamily: 'monospace', 
    fontSize: 14, 
    textAlign: 'center' 
  },
  applyBtn: { backgroundColor: Colors.primary, padding: 12, alignItems: 'center' },
  applyBtnText: { color: Colors.background, fontFamily: 'monospace', fontWeight: 'bold', fontSize: 12 },

  statsCard: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: '#262626', padding: 14 },
  statsTitle: { color: Colors.primary, fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', marginBottom: 5 },
  statsDesc: { color: Colors.white, fontFamily: 'monospace', fontSize: 12, lineHeight: 18 }
});