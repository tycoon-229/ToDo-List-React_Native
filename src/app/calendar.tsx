import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SectionList } from 'react-native';
import { router } from 'expo-router';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { toggleTaskStatus, deleteTask } from '../features/tasksSlice';
import { supabase } from '../services/supabase';
import GlitchText from '../components/GlitchText';
import TaskItem from '../components/TaskItem';
import Colors from '../constants/Colors';

export default function CalendarScreen() {
  const tasks = useAppSelector(state => state.tasks.tasksList);
  const dispatch = useAppDispatch();
  
  // 1. Khai báo 2 bộ lọc
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'TODO' | 'COMPLETED'>('ALL');
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'OVERDUE' | 'TODAY' | 'UPCOMING'>('ALL');

  // Lấy ngày hôm nay định dạng YYYY-MM-DD
  const getTodayString = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };
  const todayStr = getTodayString();

  // 2. Lọc theo trạng thái trước
  const statusFilteredTasks = tasks.filter(t => {
    if (statusFilter === 'TODO') return t.status === 'TODO';
    if (statusFilter === 'COMPLETED') return t.status === 'COMPLETED';
    return true;
  });

  // 3. Phân nhóm thời gian từ danh sách đã lọc trạng thái
  const overdue = statusFilteredTasks.filter(t => t.due_date && t.due_date < todayStr && t.status !== 'COMPLETED');
  const today = statusFilteredTasks.filter(t => t.due_date === todayStr);
  const upcoming = statusFilteredTasks.filter(t => t.due_date && t.due_date > todayStr);
  const noDate = statusFilteredTasks.filter(t => !t.due_date);

  // 4. Áp dụng bộ lọc thời gian vào các Section
  let rawSections = [];
  if (timeFilter === 'ALL' || timeFilter === 'OVERDUE') {
    rawSections.push({ title: '>>> CRITICAL_OVERDUE //:', data: overdue, color: Colors.danger });
  }
  if (timeFilter === 'ALL' || timeFilter === 'TODAY') {
    rawSections.push({ title: '>>> CURRENT_CYCLE (TODAY) //:', data: today, color: Colors.primary });
  }
  if (timeFilter === 'ALL' || timeFilter === 'UPCOMING') {
    rawSections.push({ title: '>>> FUTURE_NODES (UPCOMING) //:', data: upcoming, color: Colors.glitchCyan });
  }
  if (timeFilter === 'ALL') {
    rawSections.push({ title: '>>> UNSCHEDULED //:', data: noDate, color: Colors.textLight });
  }

  // Chỉ hiện những nhóm có dữ liệu
  const sections = rawSections.filter(section => section.data.length > 0);

  const handleToggle = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    dispatch(toggleTaskStatus(id));
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
  };

  const handleDelete = async (id: string) => {
    dispatch(deleteTask(id));
    await supabase.from('tasks').delete().eq('id', id);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>{'< SYS_HOME'}</Text>
        </TouchableOpacity>
        <GlitchText text="TIMELINE" fontSize={24} />
      </View>

      {/* Khu vực Bộ lọc kép */}
      <View style={styles.filterSection}>
        {/* Lọc Trạng thái */}
        <Text style={styles.filterLabel}>STATUS_FILTER //:</Text>
        <View style={styles.filterRow}>
          {(['ALL', 'TODO', 'COMPLETED'] as const).map(f => (
            <TouchableOpacity 
              key={f} 
              style={[styles.filterBtn, statusFilter === f && styles.filterBtnActive]}
              onPress={() => setStatusFilter(f)}
            >
              <Text style={[styles.filterText, statusFilter === f && { color: Colors.background }]}>
                {f === 'ALL' ? 'TẤT CẢ' : f === 'TODO' ? 'CHƯA XONG' : 'ĐÃ XONG'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Lọc Thời gian */}
        <Text style={styles.filterLabel}>TIME_FILTER //:</Text>
        <View style={styles.filterRow}>
          {(['ALL', 'OVERDUE', 'TODAY', 'UPCOMING'] as const).map(f => (
            <TouchableOpacity 
              key={f} 
              style={[styles.filterBtn, timeFilter === f && styles.filterBtnActive]}
              onPress={() => setTimeFilter(f)}
            >
              <Text style={[styles.filterText, timeFilter === f && { color: Colors.background }]}>
                {f === 'ALL' ? 'ALL_NODES' : f === 'OVERDUE' ? 'CRITICAL' : f === 'TODAY' ? 'CURRENT' : 'FUTURE'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Danh sách Task */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TaskItem task={item} onToggle={handleToggle} onDelete={handleDelete} />}
        renderSectionHeader={({ section: { title, color } }) => (
          <Text style={[styles.sectionHeader, { color }]}>{title}</Text>
        )}
        contentContainerStyle={{ paddingBottom: 50 }}
        ListEmptyComponent={<Text style={styles.emptyText}>NO_DATA_FOUND //</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  link: { color: Colors.primary, fontFamily: 'monospace', fontWeight: 'bold' },
  
  // Styles mới cho khu vực lọc
  filterSection: { marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filterLabel: { color: Colors.textLight, fontFamily: 'monospace', fontSize: 12, marginBottom: 8 },
  filterRow: { flexDirection: 'row', marginBottom: 10, justifyContent: 'space-between' },
  filterBtn: { flex: 1, padding: 8, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', marginHorizontal: 2 },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { color: Colors.white, fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' },
  
  sectionHeader: { fontFamily: 'monospace', fontWeight: '900', fontSize: 16, marginTop: 15, marginBottom: 10, backgroundColor: Colors.surface, padding: 10, borderWidth: 1, borderColor: Colors.border },
  emptyText: { color: Colors.textLight, fontFamily: 'monospace', textAlign: 'center', marginTop: 40 }
});