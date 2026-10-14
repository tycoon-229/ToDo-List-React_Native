import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAppSelector } from '../store/hooks';
import GlitchText from '../components/GlitchText';
import Colors from '../constants/Colors';

type Timeframe = 'DAY' | 'WEEK' | 'MONTH';

export default function AnalyticsScreen() {
  const tasks = useAppSelector(state => state.tasks.tasksList);
  const categories = useAppSelector(state => state.categories.list);
  const [timeframe, setTimeframe] = useState<Timeframe>('DAY');

  // Lấy chuỗi ngày hiện tại (YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  }, []);

  // 1. Chỉ số cốt lõi (Core Telemetry)
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const activeTasks = tasks.filter(t => t.status === 'TODO').length;
  const overdueTasks = tasks.filter(
    t => t.status === 'TODO' && t.due_date && t.due_date < todayStr
  ).length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 2. Dữ liệu biểu đồ năng suất theo mốc thời gian
  const chartData = useMemo(() => {
    const now = new Date();

    if (timeframe === 'DAY') {
      // 7 ngày gần nhất
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateKey = d.toISOString().split('T')[0];
        const label = `${d.getDate()}/${d.getMonth() + 1}`;

        const completedCount = tasks.filter(
          t => t.status === 'COMPLETED' && t.due_date === dateKey
        ).length;
        const totalCount = tasks.filter(t => t.due_date === dateKey).length;

        days.push({ label, completed: completedCount, total: totalCount });
      }
      return days;
    }

    if (timeframe === 'WEEK') {
      // 4 tuần gần nhất
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
          t => t.status === 'COMPLETED' && t.due_date && t.due_date >= startStr && t.due_date <= endStr
        ).length;
        const totalCount = tasks.filter(
          t => t.due_date && t.due_date >= startStr && t.due_date <= endStr
        ).length;

        weeks.push({ label, completed: completedCount, total: totalCount });
      }
      return weeks;
    }

    // MONTH: 6 tháng gần nhất
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const prefix = `${year}-${month}`;
      const label = `T${d.getMonth() + 1}`;

      const completedCount = tasks.filter(
        t => t.status === 'COMPLETED' && t.due_date && t.due_date.startsWith(prefix)
      ).length;
      const totalCount = tasks.filter(
        t => t.due_date && t.due_date.startsWith(prefix)
      ).length;

      months.push({ label, completed: completedCount, total: totalCount });
    }
    return months;
  }, [tasks, timeframe]);

  // Tìm giá trị max để tính tỷ lệ % chiều cao của thanh biểu đồ
  const maxBarValue = Math.max(...chartData.map(d => Math.max(d.total, d.completed)), 4);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* HEADER ĐIỀU HƯỚNG */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>{'< SYS_HOME'}</Text>
        </TouchableOpacity>
        <GlitchText text="TELEMETRY" fontSize={24} />
      </View>

      {/* CHỈ SỐ HOÀN THÀNH (EFFICIENCY INDEX) */}
      <View style={styles.efficiencyCard}>
        <View style={styles.efficiencyHeader}>
          <Text style={styles.sectionLabel}>EFFICIENCY_INDEX //</Text>
          <Text style={styles.efficiencyValue}>{completionRate}%</Text>
        </View>
        {/* Thanh Gauge Bar phong cách Cyborg */}
        <View style={styles.meterTrack}>
          <View style={[styles.meterFill, { width: `${completionRate}%` }]} />
        </View>
        <Text style={styles.meterMeta}>
          STATUS: {completionRate >= 80 ? 'OPTIMAL' : completionRate >= 50 ? 'NOMINAL' : 'DEGRADED'}
        </Text>
      </View>

      {/* LƯỚI 4 CHỈ SỐ CỐT LÕI (HUD METRICS) */}
      <View style={styles.metricGrid}>
        <View style={[styles.metricBox, { borderColor: Colors.primary }]}>
          <Text style={styles.metricTitle}>TOTAL_NODES</Text>
          <Text style={[styles.metricNumber, { color: Colors.primary }]}>{totalTasks}</Text>
        </View>

        <View style={[styles.metricBox, { borderColor: Colors.glitchCyan }]}>
          <Text style={styles.metricTitle}>COMPLETED</Text>
          <Text style={[styles.metricNumber, { color: Colors.glitchCyan }]}>{completedTasks}</Text>
        </View>

        <View style={[styles.metricBox, { borderColor: '#FFFF00' }]}>
          <Text style={styles.metricTitle}>IN_PROGRESS</Text>
          <Text style={[styles.metricNumber, { color: '#FFFF00' }]}>{activeTasks}</Text>
        </View>

        <View style={[styles.metricBox, { borderColor: Colors.danger }]}>
          <Text style={styles.metricTitle}>OVERDUE</Text>
          <Text style={[styles.metricNumber, { color: Colors.danger }]}>{overdueTasks}</Text>
        </View>
      </View>

      {/* KHỐI BIỂU ĐỒ NĂNG SUẤT (PRODUCTIVITY CHART) */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.sectionLabel}>PRODUCTIVITY_GRAPH //</Text>
          {/* Tùy chọn Ngày / Tuần / Tháng */}
          <View style={styles.timeframeTabs}>
            {(['DAY', 'WEEK', 'MONTH'] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, timeframe === tab && styles.tabBtnActive]}
                onPress={() => setTimeframe(tab)}
              >
                <Text style={[styles.tabText, timeframe === tab && { color: Colors.background }]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Chú giải (Legend) */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: Colors.primary }]} />
            <Text style={styles.legendLabel}>COMPLETED</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#333', borderColor: Colors.border, borderWidth: 1 }]} />
            <Text style={styles.legendLabel}>TOTAL</Text>
          </View>
        </View>

        {/* Khung vẽ biểu đồ cột */}
        <View style={styles.chartCanvas}>
          {chartData.map((item, idx) => {
            const completedHeight = (item.completed / maxBarValue) * 120;
            const totalHeight = (item.total / maxBarValue) * 120;

            return (
              <View key={idx} style={styles.barGroup}>
                <View style={styles.barsContainer}>
                  {/* Cột Tổng (Total) */}
                  <View style={[styles.barTotal, { height: Math.max(totalHeight, 4) }]} />
                  {/* Cột Hoàn thành (Completed) */}
                  <View style={[styles.barCompleted, { height: Math.max(completedHeight, 4) }]} />
                </View>
                <Text style={styles.barLabel}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* PHÂN BỔ THEO DANH MỤC (CATEGORY ALLOCATION) */}
      <View style={styles.categoryCard}>
        <Text style={styles.sectionLabel}>CATEGORY_ALLOCATION //</Text>
        {categories.length === 0 ? (
          <Text style={styles.emptyText}>NO_CATEGORIES_LOGGED</Text>
        ) : (
          categories.map(cat => {
            const count = tasks.filter(t => t.category_id === cat.id).length;
            const catPercent = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;

            return (
              <View key={cat.id} style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <View style={[styles.catBadge, { borderColor: cat.color || Colors.primary }]}>
                    <Text style={[styles.catBadgeText, { color: cat.color || Colors.primary }]}>
                      {cat.name}
                    </Text>
                  </View>
                  <Text style={styles.categoryMeta}>{count} NODES ({catPercent}%)</Text>
                </View>
                <View style={styles.categoryTrack}>
                  <View
                    style={[
                      styles.categoryFill,
                      { width: `${catPercent}%`, backgroundColor: cat.color || Colors.primary },
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 20, paddingTop: 50, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  backLink: { color: Colors.primary, fontFamily: 'monospace', fontWeight: 'bold' },

  sectionLabel: { color: Colors.primary, fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold' },

  // Card Hiệu suất
  efficiencyCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  efficiencyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  efficiencyValue: { color: Colors.primary, fontFamily: 'monospace', fontSize: 24, fontWeight: '900' },
  meterTrack: { height: 12, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  meterFill: { height: '100%', backgroundColor: Colors.primary },
  meterMeta: { color: Colors.white, fontFamily: 'monospace', fontSize: 10, marginTop: 8, textAlign: 'right' },

  // Lưới chỉ số HUD
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  metricBox: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  metricTitle: { color: Colors.white, fontFamily: 'monospace', fontSize: 11, marginBottom: 6 },
  metricNumber: { fontFamily: 'monospace', fontSize: 28, fontWeight: '900' },

  // Card Biểu đồ
  chartCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  timeframeTabs: { flexDirection: 'row' },
  tabBtn: { paddingVertical: 4, paddingHorizontal: 8, borderWidth: 1, borderColor: Colors.border, marginLeft: 4 },
  tabBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { color: Colors.white, fontFamily: 'monospace', fontSize: 10, fontWeight: 'bold' },

  legendRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 15 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginLeft: 15 },
  legendBox: { width: 10, height: 10, marginRight: 5 },
  legendLabel: { color: Colors.white, fontFamily: 'monospace', fontSize: 10 },

  chartCanvas: {
    height: 150,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 5,
  },
  barGroup: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barsContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', width: '100%' },
  barTotal: { width: 8, backgroundColor: '#262626', borderTopWidth: 1, borderColor: Colors.border, marginHorizontal: 2 },
  barCompleted: { width: 8, backgroundColor: Colors.primary, marginHorizontal: 2 },
  barLabel: { color: Colors.white, fontFamily: 'monospace', fontSize: 10, marginTop: 8 },

  // Phân bổ danh mục
  categoryCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryRow: { marginTop: 14 },
  categoryInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  catBadge: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
  catBadgeText: { fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' },
  categoryMeta: { color: Colors.white, fontFamily: 'monospace', fontSize: 10 },
  categoryTrack: { height: 6, backgroundColor: Colors.background, borderWidth: 1, borderColor: '#333' },
  categoryFill: { height: '100%' },
  emptyText: { color: Colors.white, fontFamily: 'monospace', fontSize: 11, textAlign: 'center', marginTop: 15 }
});