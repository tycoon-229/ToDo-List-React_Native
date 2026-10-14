import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SectionList } from 'react-native';
import { router } from 'expo-router';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { toggleTaskStatus, softDeleteTask } from '../features/tasksSlice';
import { supabase } from '../services/supabase';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from '../hooks/useTranslation';
import { ColorPalette } from '../constants/Colors';
import GlitchText from '../components/GlitchText';
import TaskItem from '../components/TaskItem';

export default function CalendarScreen() {
  const colors = useThemeColors();
  const t = useTranslation();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const tasks = useAppSelector(state => state.tasks.tasksList);
  const dispatch = useAppDispatch();
  
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'TODO' | 'COMPLETED'>('ALL');
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'OVERDUE' | 'TODAY' | 'UPCOMING'>('ALL');

  const getTodayString = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };
  const todayStr = getTodayString();

  const statusFilteredTasks = tasks.filter(task => {
    if (task.is_deleted) return false;
    if (statusFilter === 'TODO') return task.status === 'TODO';
    if (statusFilter === 'COMPLETED') return task.status === 'COMPLETED';
    return true;
  });

  const overdue = statusFilteredTasks.filter(task => task.due_date && task.due_date < todayStr && task.status !== 'COMPLETED');
  const today = statusFilteredTasks.filter(task => task.due_date === todayStr);
  const upcoming = statusFilteredTasks.filter(task => task.due_date && task.due_date > todayStr);
  const noDate = statusFilteredTasks.filter(task => !task.due_date);

  let rawSections = [];
  if (timeFilter === 'ALL' || timeFilter === 'OVERDUE') {
    rawSections.push({ title: t.criticalOverdue, data: overdue, color: colors.danger });
  }
  if (timeFilter === 'ALL' || timeFilter === 'TODAY') {
    rawSections.push({ title: t.currentCycle, data: today, color: colors.primary });
  }
  if (timeFilter === 'ALL' || timeFilter === 'UPCOMING') {
    rawSections.push({ title: t.futureNodes, data: upcoming, color: colors.glitchCyan });
  }
  if (timeFilter === 'ALL') {
    rawSections.push({ title: t.unscheduled, data: noDate, color: colors.textLight });
  }

  const sections = rawSections.filter(section => section.data.length > 0);

  const handleToggle = async (id: string) => {
    const task = tasks.find(item => item.id === id);
    if (!task) return;
    const newStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    dispatch(toggleTaskStatus(id));
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
  };

  const handleDelete = async (id: string) => {
    const deletedTimestamp = new Date().toISOString();
    dispatch(softDeleteTask({ id, deleted_at: deletedTimestamp }));
    await supabase
      .from('tasks')
      .update({ is_deleted: true, deleted_at: deletedTimestamp })
      .eq('id', id);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>{t.backHome}</Text>
        </TouchableOpacity>
        <GlitchText text={t.timeline.replace('> ', '').replace('_', '')} fontSize={24} />
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>{t.statusFilter}</Text>
        <View style={styles.filterRow}>
          {(['ALL', 'TODO', 'COMPLETED'] as const).map(f => (
            <TouchableOpacity 
              key={f} 
              style={[styles.filterBtn, statusFilter === f && styles.filterBtnActive]}
              onPress={() => setStatusFilter(f)}
            >
              <Text style={[styles.filterText, statusFilter === f && { color: colors.background }]}>
                {f === 'ALL' ? t.all : f === 'TODO' ? t.todo : t.completed}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.filterLabel}>{t.timeFilter}</Text>
        <View style={styles.filterRow}>
          {(['ALL', 'OVERDUE', 'TODAY', 'UPCOMING'] as const).map(f => (
            <TouchableOpacity 
              key={f} 
              style={[styles.filterBtn, timeFilter === f && styles.filterBtnActive]}
              onPress={() => setTimeFilter(f)}
            >
              <Text style={[styles.filterText, timeFilter === f && { color: colors.background }]}>
                {f === 'ALL' ? t.allNodes : f === 'OVERDUE' ? t.critical : f === 'TODAY' ? t.current : t.future}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TaskItem task={item} onToggle={handleToggle} onDelete={handleDelete} />}
        renderSectionHeader={({ section: { title, color } }) => (
          <Text style={[styles.sectionHeader, { color }]}>{title}</Text>
        )}
        contentContainerStyle={{ paddingBottom: 50 }}
        ListEmptyComponent={<Text style={styles.emptyText}>{t.noDataFound}</Text>}
      />
    </View>
  );
}

const getStyles = (colors: ColorPalette) => StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  link: { color: colors.primary, fontFamily: 'monospace', fontWeight: 'bold' },
  
  filterSection: { marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterLabel: { color: colors.textLight, fontFamily: 'monospace', fontSize: 12, marginBottom: 8 },
  filterRow: { flexDirection: 'row', marginBottom: 10, justifyContent: 'space-between' },
  filterBtn: { flex: 1, padding: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center', marginHorizontal: 2, backgroundColor: colors.surface },
  filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.white, fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' },
  
  sectionHeader: { fontFamily: 'monospace', fontWeight: '900', fontSize: 15, marginTop: 15, marginBottom: 10, backgroundColor: colors.surface, padding: 10, borderWidth: 1, borderColor: colors.border },
  emptyText: { color: colors.textLight, fontFamily: 'monospace', textAlign: 'center', marginTop: 40 }
});