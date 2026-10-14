import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAppSelector } from '../store/hooks';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from '../hooks/useTranslation';
import { ColorPalette } from '../constants/Colors';
import GlitchText from '../components/GlitchText';

type Timeframe = 'DAY' | 'WEEK' | 'MONTH';

export default function AnalyticsScreen() {
  const colors = useThemeColors();
  const t = useTranslation();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const isDark = colors.background === '#0D0D0D';

  const tasks = useAppSelector(state => state.tasks.tasksList.filter(item => !item.is_deleted));
  const categories = useAppSelector(state => state.categories.list);
  const [timeframe, setTimeframe] = useState<Timeframe>('DAY');

  const todayStr = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  }, []);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(item => item.status === 'COMPLETED').length;
  const activeTasks = tasks.filter(item => item.status === 'TODO').length;
  const overdueTasks = tasks.filter(
    item => item.status === 'TODO' && item.due_date && item.due_date < todayStr
  ).length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const chartData = useMemo(() => {
    const now = new Date();

    if (timeframe === 'DAY') {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateKey = d.toISOString().split('T')[0];
        const label = `${d.getDate()}/${d.getMonth() + 1}`;

        const completedCount = tasks.filter(
          item => item.status === 'COMPLETED' && item.due_date === dateKey
        ).length;
        const totalCount = tasks.filter(item => item.due_date === dateKey).length;

        days.push({ label, completed: completedCount, total: totalCount });
      }
      return days;
    }

    if (timeframe === 'WEEK') {
      const weeks = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - i * 7);

        const startStr = weekStart.toISOString().split('T')[0];
        const endStr = weekEnd.toISOString().split('T')[0];
        const label = `W-${4 - i}`;

        const completedCount = tasks.filter(
          item => item.status === 'COMPLETED' && item.due_date && item.due_date >= startStr && item.due_date <= endStr
        ).length;
        const totalCount = tasks.filter(
          item => item.due_date && item.due_date >= startStr && item.due_date <= endStr
        ).length;

        weeks.push({ label, completed: completedCount, total: totalCount });
      }
      return weeks;
    }

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const prefix = `${year}-${month}`;
      const label = `T${d.getMonth() + 1}`;

      const completedCount = tasks.filter(
        item => item.status === 'COMPLETED' && item.due_date && item.due_date.startsWith(prefix)
      ).length;
      const totalCount = tasks.filter(
        item => item.due_date && item.due_date.startsWith(prefix)
      ).length;

      months.push({ label, completed: completedCount, total: totalCount });
    }
    return months;
  }, [tasks, timeframe]);

  const maxBarValue = Math.max(...chartData.map(d => Math.max(d.total, d.completed)), 4);

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
        <GlitchText text={t.telemetryTitle} fontSize={24} />
      </View>

      <View style={styles.efficiencyCard}>
        <View style={styles.efficiencyHeader}>
          <Text style={styles.sectionLabel}>{t.efficiencyIndex}</Text>
          <Text style={styles.efficiencyValue}>{completionRate}%</Text>
        </View>
        <View style={styles.meterTrack}>
          <View style={[styles.meterFill, { width: `${completionRate}%` }]} />
        </View>
        <Text style={styles.meterMeta}>
          STATUS: {completionRate >= 80 ? t.statusOptimal : completionRate >= 50 ? t.statusNominal : t.statusDegraded}
        </Text>
      </View>

      <View style={styles.metricGrid}>
        <View style={[styles.metricBox, { borderColor: colors.primary }]}>
          <Text style={styles.metricTitle}>{t.totalNodes}</Text>
          <Text style={[styles.metricNumber, { color: colors.primary }]}>{totalTasks}</Text>
        </View>

        <View style={[styles.metricBox, { borderColor: colors.glitchCyan }]}>
          <Text style={styles.metricTitle}>{t.completed}</Text>
          <Text style={[styles.metricNumber, { color: colors.glitchCyan }]}>{completedTasks}</Text>
        </View>

        <View style={[styles.metricBox, { borderColor: '#FFAE00' }]}>
          <Text style={styles.metricTitle}>{t.inProgress}</Text>
          <Text style={[styles.metricNumber, { color: '#FFAE00' }]}>{activeTasks}</Text>
        </View>

        <View style={[styles.metricBox, { borderColor: colors.danger }]}>
          <Text style={styles.metricTitle}>{t.overdue}</Text>
          <Text style={[styles.metricNumber, { color: colors.danger }]}>{overdueTasks}</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.sectionLabel}>{t.productivityGraph}</Text>
          <View style={styles.timeframeTabs}>
            {(['DAY', 'WEEK', 'MONTH'] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, timeframe === tab && styles.tabBtnActive]}
                onPress={() => setTimeframe(tab)}
              >
                <Text style={[styles.tabText, timeframe === tab && { color: isDark ? colors.primary : '#000000' }]}>
                  {tab === 'DAY' ? t.dayTab : tab === 'WEEK' ? t.weekTab : t.monthTab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendLabel}>{t.completed}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: colors.inputBg, borderColor: colors.border, borderWidth: 1 }]} />
            <Text style={styles.legendLabel}>{t.total}</Text>
          </View>
        </View>

        <View style={styles.chartCanvas}>
          {chartData.map((item, idx) => {
            const completedHeight = (item.completed / maxBarValue) * 120;
            const totalHeight = (item.total / maxBarValue) * 120;

            return (
              <View key={idx} style={styles.barGroup}>
                <View style={styles.barsContainer}>
                  <View style={[styles.barTotal, { height: Math.max(totalHeight, 4) }]} />
                  <View style={[styles.barCompleted, { height: Math.max(completedHeight, 4) }]} />
                </View>
                <Text style={styles.barLabel}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.categoryCard}>
        <Text style={styles.sectionLabel}>{t.categoryAllocation}</Text>
        {categories.length === 0 ? (
          <Text style={styles.emptyText}>{t.noCategoriesLogged}</Text>
        ) : (
          categories.map(cat => {
            const count = tasks.filter(item => item.category_id === cat.id).length;
            const catPercent = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;

            return (
              <View key={cat.id} style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <View style={[styles.catBadge, { borderColor: cat.color || colors.primary }]}>
                    <Text style={[styles.catBadgeText, { color: cat.color || colors.primary }]}>
                      {cat.name}
                    </Text>
                  </View>
                  <Text style={styles.categoryMeta}>{count} {t.nodesLabel} ({catPercent}%)</Text>
                </View>
                <View style={styles.categoryTrack}>
                  <View
                    style={[
                      styles.categoryFill,
                      { width: `${catPercent}%`, backgroundColor: cat.color || colors.primary },
                    ]}
                  />
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const getStyles = (colors: ColorPalette) => {
  const isDark = colors.background === '#0D0D0D';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: 20, paddingTop: 50, paddingBottom: 60 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    backLink: { color: colors.primary, fontFamily: 'monospace', fontWeight: 'bold' },

    sectionLabel: { color: colors.primary, fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold' },

    efficiencyCard: {
      backgroundColor: colors.surface,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20,
    },
    efficiencyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
    efficiencyValue: { color: colors.primary, fontFamily: 'monospace', fontSize: 24, fontWeight: '900' },
    meterTrack: { height: 12, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
    meterFill: { height: '100%', backgroundColor: colors.primary },
    meterMeta: { color: colors.textLight, fontFamily: 'monospace', fontSize: 10, marginTop: 8, textAlign: 'right' },

    metricGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
    metricBox: {
      width: '48%',
      backgroundColor: colors.surface,
      borderWidth: 1,
      padding: 14,
      marginBottom: 12,
    },
    metricTitle: { color: colors.textLight, fontFamily: 'monospace', fontSize: 11, marginBottom: 6 },
    metricNumber: { fontFamily: 'monospace', fontSize: 28, fontWeight: '900' },

    chartCard: {
      backgroundColor: colors.surface,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20,
    },
    chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    timeframeTabs: { flexDirection: 'row' },
    tabBtn: { 
      paddingVertical: 4, 
      paddingHorizontal: 8, 
      borderWidth: 1.5, 
      borderColor: colors.border, 
      marginLeft: 4, 
      backgroundColor: isDark ? '#0D0D0D' : colors.surface 
    },
    tabBtnActive: { 
      backgroundColor: isDark ? '#0D0D0D' : colors.primary, 
      borderColor: colors.primary 
    },
    tabText: { color: colors.white, fontFamily: 'monospace', fontSize: 10, fontWeight: 'bold' },

    legendRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 15 },
    legendItem: { flexDirection: 'row', alignItems: 'center', marginLeft: 15 },
    legendBox: { width: 10, height: 10, marginRight: 5 },
    legendLabel: { color: colors.white, fontFamily: 'monospace', fontSize: 10 },

    chartCanvas: {
      height: 150,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 5,
    },
    barGroup: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
    barsContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', width: '100%' },
    barTotal: { width: 8, backgroundColor: colors.inputBg, borderTopWidth: 1, borderColor: colors.border, marginHorizontal: 2 },
    barCompleted: { width: 8, backgroundColor: colors.primary, marginHorizontal: 2 },
    barLabel: { color: colors.textLight, fontFamily: 'monospace', fontSize: 10, marginTop: 8 },

    categoryCard: {
      backgroundColor: colors.surface,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryRow: { marginTop: 14 },
    categoryInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    catBadge: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
    catBadgeText: { fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' },
    categoryMeta: { color: colors.white, fontFamily: 'monospace', fontSize: 10 },
    categoryTrack: { height: 6, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
    categoryFill: { height: '100%' },
    emptyText: { color: colors.white, fontFamily: 'monospace', fontSize: 11, textAlign: 'center', marginTop: 15 }
  });
};