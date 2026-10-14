import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAppSelector } from '../store/hooks';
import { playCyborgAlertSound, triggerCyborgNotification } from '../services/notificationService';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from '../hooks/useTranslation';
import { ColorPalette } from '../constants/Colors';
import GlitchText from '../components/GlitchText';
import CustomButton from '../components/CustomButton';

type Mode = 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';

export default function FocusScreen() {
  const colors = useThemeColors();
  const t = useTranslation();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const isDark = colors.background === '#0D0D0D';

  const { taskId } = useLocalSearchParams<{ taskId?: string }>();
  const tasks = useAppSelector(state => state.tasks.tasksList);
  
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(taskId || null);
  const activeTask = tasks.find(item => item.id === selectedTaskId);

  const [durations, setDurations] = useState({
    FOCUS: 25,
    SHORT_BREAK: 5,
    LONG_BREAK: 15,
  });

  const [inputFocus, setInputFocus] = useState('25');
  const [inputShort, setInputShort] = useState('5');
  const [inputLong, setInputLong] = useState('15');
  const [showConfig, setShowConfig] = useState(false);

  const [mode, setMode] = useState<Mode>('FOCUS');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [completedCycles, setCompletedCycles] = useState(0);

  const totalDuration = useMemo(() => {
    return Math.max(durations[mode] * 60, 1);
  }, [durations, mode]);

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
          `${t.focusingOn} ${activeTask ? activeTask.title : 'GENERAL_TASK'}`
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

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setTimeLeft(durations[newMode] * 60);
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(durations[mode] * 60);
  };

  const handleAdjustMinutes = (deltaMinutes: number) => {
    if (isActive) return;
    const newSeconds = Math.max(60, timeLeft + deltaMinutes * 60);
    setTimeLeft(newSeconds);
    const newMins = Math.round(newSeconds / 60);
    setDurations(prev => ({ ...prev, [mode]: newMins }));
    if (mode === 'FOCUS') setInputFocus(newMins.toString());
    if (mode === 'SHORT_BREAK') setInputShort(newMins.toString());
    if (mode === 'LONG_BREAK') setInputLong(newMins.toString());
  };

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = Math.min(100, Math.max(0, Math.round(((totalDuration - timeLeft) / totalDuration) * 100)));

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/' as any);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backLink}>{t.backHome}</Text>
        </TouchableOpacity>
        <GlitchText text={t.focusTitle} fontSize={24} />
      </View>

      <View style={styles.targetCard}>
        <Text style={styles.targetLabel}>{t.targetNode}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.targetScroll}>
          <TouchableOpacity 
            style={[styles.targetChip, selectedTaskId === null && styles.targetChipActive]}
            onPress={() => setSelectedTaskId(null)}
          >
            <Text style={[styles.targetChipText, selectedTaskId === null && { color: isDark ? colors.primary : '#000000' }]}>
              {t.generalSession}
            </Text>
          </TouchableOpacity>

          {tasks.filter(item => item.status === 'TODO' && !item.is_deleted).map(item => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.targetChip, selectedTaskId === item.id && styles.targetChipActive]}
              onPress={() => setSelectedTaskId(item.id)}
            >
              <Text style={[styles.targetChipText, selectedTaskId === item.id && { color: isDark ? colors.primary : '#000000' }]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.modeTabs}>
        <TouchableOpacity 
          style={[styles.modeBtn, mode === 'FOCUS' && styles.modeBtnActive]} 
          onPress={() => switchMode('FOCUS')}
        >
          <Text style={[styles.modeText, mode === 'FOCUS' && { color: isDark ? colors.primary : '#000000' }]}>
            {t.focusTab} ({durations.FOCUS}M)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.modeBtn, mode === 'SHORT_BREAK' && styles.modeBtnActive]} 
          onPress={() => switchMode('SHORT_BREAK')}
        >
          <Text style={[styles.modeText, mode === 'SHORT_BREAK' && { color: isDark ? colors.primary : '#000000' }]}>
            {t.shortBreakTab} ({durations.SHORT_BREAK}M)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.modeBtn, mode === 'LONG_BREAK' && styles.modeBtnActive]} 
          onPress={() => switchMode('LONG_BREAK')}
        >
          <Text style={[styles.modeText, mode === 'LONG_BREAK' && { color: isDark ? colors.primary : '#000000' }]}>
            {t.longBreakTab} ({durations.LONG_BREAK}M)
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.clockCard}>
        <Text style={styles.clockModeHeader}>
          {mode === 'FOCUS' ? t.protocolFocus : t.protocolBreak}
        </Text>

        <Text style={styles.timerDisplay}>{formatTime(timeLeft)}</Text>

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

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{t.elapsed} {progressPercent}%</Text>
          <Text style={styles.metaText}>{t.cyclesCompleted} [{completedCycles}]</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <View style={{ flex: 2, marginRight: 10 }}>
          <CustomButton 
            title={isActive ? t.pauseProtocol : t.engageFocus} 
            onPress={() => {
              playCyborgAlertSound();
              setIsActive(!isActive);
            }} 
          />
        </View>
        <View style={{ flex: 1 }}>
          <CustomButton 
            title={t.reset} 
            variant="outline" 
            onPress={handleReset} 
          />
        </View>
      </View>

      <TouchableOpacity 
        style={styles.configToggleBtn} 
        onPress={() => setShowConfig(!showConfig)}
      >
        <Text style={styles.configToggleText}>
          {showConfig ? t.hideConfig : t.showConfig}
        </Text>
      </TouchableOpacity>

      {showConfig && (
        <View style={styles.configCard}>
          <Text style={styles.configHeading}>{t.customDurationMatrix}</Text>

          <View style={styles.inputGroupRow}>
            <View style={styles.inputCol}>
              <Text style={styles.inputLabel}>{t.focusLabel}</Text>
              <TextInput
                style={styles.numberInput}
                value={inputFocus}
                onChangeText={setInputFocus}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            <View style={styles.inputCol}>
              <Text style={styles.inputLabel}>{t.shortBreakLabel}</Text>
              <TextInput
                style={styles.numberInput}
                value={inputShort}
                onChangeText={setInputShort}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            <View style={styles.inputCol}>
              <Text style={styles.inputLabel}>{t.longBreakLabel}</Text>
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
            <Text style={styles.applyBtnText}>{t.applyDurations}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>{t.focusIntel}</Text>
        <Text style={styles.statsDesc}>
          {activeTask 
            ? `${t.focusingOn} "${activeTask.title}"`
            : t.generalFocusDesc}
        </Text>
      </View>
    </ScrollView>
  );
}

const getStyles = (colors: ColorPalette) => {
  const isDark = colors.background === '#0D0D0D';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: 20, paddingTop: 50, paddingBottom: 60 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    backLink: { color: colors.primary, fontFamily: 'monospace', fontWeight: 'bold' },

    targetCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 15 },
    targetLabel: { color: colors.primary, fontFamily: 'monospace', fontSize: 11, marginBottom: 8, fontWeight: 'bold' },
    targetScroll: { flexDirection: 'row' },
    targetChip: { 
      paddingHorizontal: 12, 
      paddingVertical: 6, 
      borderWidth: 1.5, 
      borderColor: colors.border, 
      marginRight: 8, 
      backgroundColor: isDark ? '#0D0D0D' : colors.surface 
    },
    targetChipActive: { 
      backgroundColor: isDark ? '#0D0D0D' : colors.primary, 
      borderColor: colors.primary 
    },
    targetChipText: { color: colors.white, fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' },

    modeTabs: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    modeBtn: { 
      flex: 1, 
      paddingVertical: 10, 
      borderWidth: 1.5, 
      borderColor: colors.border, 
      alignItems: 'center', 
      marginHorizontal: 2, 
      backgroundColor: isDark ? '#0D0D0D' : colors.surface 
    },
    modeBtnActive: { 
      backgroundColor: isDark ? '#0D0D0D' : colors.primary, 
      borderColor: colors.primary 
    },
    modeText: { color: colors.white, fontFamily: 'monospace', fontSize: 10, fontWeight: 'bold' },

    clockCard: { 
      backgroundColor: colors.surface, 
      borderWidth: 2, 
      borderColor: colors.primary, 
      padding: 24, 
      alignItems: 'center', 
      marginBottom: 20,
      shadowColor: colors.primary,
      shadowOpacity: 0.5,
      shadowRadius: 15,
    },
    clockModeHeader: { color: colors.glitchCyan, fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', marginBottom: 10 },
    timerDisplay: { 
      color: colors.white, 
      fontFamily: 'monospace', 
      fontSize: 60, 
      fontWeight: '900', 
      letterSpacing: 4,
      marginBottom: 10,
      textShadowColor: colors.primary,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 10,
    },

    adjustRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 15 },
    adjustBtn: { 
      borderWidth: 1.5, 
      borderColor: colors.primary, 
      paddingVertical: 6, 
      paddingHorizontal: 12, 
      marginHorizontal: 4, 
      backgroundColor: isDark ? '#0D0D0D' : colors.primary 
    },
    adjustBtnText: { 
      color: isDark ? colors.primary : '#000000', 
      fontFamily: 'monospace', 
      fontSize: 11, 
      fontWeight: 'bold' 
    },

    progressTrack: { height: 10, width: '100%', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
    progressFill: { height: '100%', backgroundColor: colors.primary },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
    metaText: { color: colors.textLight, fontFamily: 'monospace', fontSize: 10 },

    actionRow: { flexDirection: 'row', marginBottom: 15 },

    configToggleBtn: { 
      borderWidth: 1.5, 
      borderColor: colors.glitchCyan, 
      padding: 10, 
      alignItems: 'center', 
      backgroundColor: isDark ? '#0D0D0D' : 'transparent', 
      marginBottom: 15 
    },
    configToggleText: { color: colors.glitchCyan, fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' },

    configCard: { 
      backgroundColor: colors.surface, 
      borderWidth: 1, 
      borderColor: colors.primary, 
      padding: 16, 
      marginBottom: 20 
    },
    configHeading: { color: colors.primary, fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold', marginBottom: 12 },
    inputGroupRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    inputCol: { flex: 1, marginHorizontal: 4 },
    inputLabel: { color: colors.textLight, fontFamily: 'monospace', fontSize: 10, marginBottom: 4 },
    numberInput: { 
      backgroundColor: colors.inputBg, 
      color: colors.white, 
      borderWidth: 1, 
      borderColor: colors.border, 
      padding: 10, 
      fontFamily: 'monospace', 
      fontSize: 14, 
      textAlign: 'center' 
    },
    applyBtn: { 
      borderWidth: 2,
      borderColor: colors.primary,
      backgroundColor: isDark ? '#0D0D0D' : colors.primary, 
      padding: 12, 
      alignItems: 'center' 
    },
    applyBtnText: { 
      color: isDark ? colors.primary : '#000000', 
      fontFamily: 'monospace', 
      fontWeight: 'bold', 
      fontSize: 12 
    },

    statsCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 14 },
    statsTitle: { color: colors.primary, fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', marginBottom: 5 },
    statsDesc: { color: colors.white, fontFamily: 'monospace', fontSize: 12, lineHeight: 18 }
  });
};