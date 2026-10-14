import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { toggleTaskStatus, updateTask } from '../../features/tasksSlice';
import { setSubtasks, addSubtask, toggleSubtaskStatus, deleteSubtask } from '../../features/subtasksSlice';
import { supabase } from '../../services/supabase';
import GlitchText from '../../components/GlitchText';
import CustomButton from '../../components/CustomButton';
import Colors from '../../constants/Colors';

export default function TaskDetailView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();

  const task = useAppSelector(state => state.tasks.tasksList.find(t => t.id === id));
  const categoriesList = useAppSelector(state => state.categories.list);
  const allSubtasks = useAppSelector(state => state.subtasks.list);

  const subtasks = useMemo(() => allSubtasks.filter(s => s.task_id === id), [allSubtasks, id]);
  const category = task?.category_id ? categoriesList.find(c => c.id === task.category_id) : null;

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSubtasks();
    }
  }, [id]);

  const fetchSubtasks = async () => {
    const { data } = await supabase
      .from('subtasks')
      .select('*')
      .eq('task_id', id)
      .order('created_at', { ascending: true });
    if (data) dispatch(setSubtasks(data));
  };

  if (!task) {
    return (
      <View style={styles.container}>
        <Text style={{ color: Colors.white, fontFamily: 'monospace' }}>SYS_ERR: Node không tồn tại hoặc đã bị xóa.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={styles.link}>{'< SYS_HOME'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCompleted = task.status === 'COMPLETED';
  const priorityColor = task.priority === 'HIGH' ? Colors.danger : (task.priority === 'MEDIUM' ? '#FFFF00' : Colors.glitchCyan);

  // Đổi trạng thái task chính
  const handleToggleMainTask = async () => {
    if (task.status === 'TODO' && task.recurrence && task.recurrence !== 'NONE') {
      const baseDate = task.due_date ? new Date(task.due_date) : new Date();
      const nextDate = new Date(baseDate);

      if (task.recurrence === 'DAILY') nextDate.setDate(nextDate.getDate() + 1);
      else if (task.recurrence === 'WEEKLY') nextDate.setDate(nextDate.getDate() + 7);
      else if (task.recurrence === 'MONTHLY') nextDate.setMonth(nextDate.getMonth() + 1);

      const nextDueDateStr = nextDate.toISOString().split('T')[0];
      const newStreak = (task.streak || 0) + 1;

      dispatch(updateTask({
        ...task,
        due_date: nextDueDateStr,
        streak: newStreak,
        status: 'TODO'
      }));

      await supabase.from('tasks').update({
        due_date: nextDueDateStr,
        streak: newStreak,
        status: 'TODO'
      }).eq('id', task.id);
      return;
    }

    const newStatus = isCompleted ? 'TODO' : 'COMPLETED';
    dispatch(toggleTaskStatus(task.id));
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
  };

  // Thao tác với Subtasks
  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    setSubLoading(true);
    const { data, error } = await supabase.from('subtasks').insert([{
      task_id: id,
      title: newSubtaskTitle.trim(),
      is_completed: false
    }]).select();

    if (!error && data) {
      dispatch(addSubtask(data[0]));
      setNewSubtaskTitle('');
    }
    setSubLoading(false);
  };

  const handleToggleSubtask = async (subId: string, currentStatus: boolean) => {
    dispatch(toggleSubtaskStatus(subId));
    await supabase.from('subtasks').update({ is_completed: !currentStatus }).eq('id', subId);
  };

  const handleDeleteSubtask = async (subId: string) => {
    dispatch(deleteSubtask(subId));
    await supabase.from('subtasks').delete().eq('id', subId);
  };

  const completedSubtasksCount = subtasks.filter(s => s.is_completed).length;
  const subtaskProgress = subtasks.length > 0 ? Math.round((completedSubtasksCount / subtasks.length) * 100) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* HEADER ĐIỀU HƯỚNG & NÚT EDIT */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>{'< SYS_HOME'}</Text>
        </TouchableOpacity>

        <GlitchText text="TASK_INTEL" fontSize={26} />

        <TouchableOpacity 
          style={styles.editBtn} 
          onPress={() => router.push(`/edit/${task.id}` as any)}
        >
          <Text style={styles.editBtnText}>[ EDIT_NODE ]</Text>
        </TouchableOpacity>
      </View>
      
      {/* THẺ TRẠNG THÁI CHÍNH */}
      <View style={styles.panelCard}>
        <View style={styles.statusRow}>
          <Text style={styles.metaLabel}>NODE_STATUS //:</Text>
          <TouchableOpacity 
            style={[styles.statusBadge, isCompleted ? styles.statusCompleted : styles.statusPending]}
            onPress={handleToggleMainTask}
          >
            <Text style={[styles.statusText, isCompleted ? { color: Colors.primary } : { color: '#FFFF00' }]}>
              {isCompleted ? '[ COMPLETED ✓ ]' : '[ IN_PROGRESS ⧗ ]'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* NÚT KÍCH HOẠT FOCUS TRỰC TIẾP CHO TASK NÀY (MỚI) */}
        {!isCompleted && (
          <TouchableOpacity 
            style={{ 
              marginBottom: 12, 
              paddingVertical: 8, 
              borderWidth: 1, 
              borderColor: Colors.primary, 
              backgroundColor: 'rgba(0, 255, 65, 0.05)',
              alignItems: 'center' 
            }}
            onPress={() => router.push({ pathname: '/focus', params: { taskId: task.id } } as any)}
          >
            <Text style={{ color: Colors.primary, fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' }}>
              &gt; START_FOCUS_TIMER_FOR_THIS_NODE &lt;
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.taskTitle}>{task.title}</Text>

        <Text style={styles.metaLabel}>DESCRIPTION //:</Text>
        <View style={styles.descBox}>
          <Text style={styles.descText}>
            {task.description ? task.description : 'NO_DESCRIPTION_ATTACHED //'}
          </Text>
        </View>
      </View>

      {/* THÔNG SỐ SIÊU DỮ LIỆU (METADATA HUD) */}
      <View style={styles.gridRow}>
        <View style={styles.hudCard}>
          <Text style={styles.hudLabel}>PRIORITY</Text>
          <Text style={[styles.hudValue, { color: priorityColor }]}>[{task.priority}]</Text>
        </View>

        <View style={styles.hudCard}>
          <Text style={styles.hudLabel}>CATEGORY</Text>
          <Text style={[styles.hudValue, { color: category?.color || Colors.primary }]}>
            {category ? category.name : '[ ROOT ]'}
          </Text>
        </View>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.hudCard}>
          <Text style={styles.hudLabel}>DEADLINE</Text>
          <Text style={styles.hudValue}>{task.due_date || 'NONE'}</Text>
        </View>

        <View style={styles.hudCard}>
          <Text style={styles.hudLabel}>REMINDER</Text>
          <Text style={styles.hudValue}>{task.reminder_time ? task.reminder_time.replace('T', ' ') : 'MUTED'}</Text>
        </View>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.hudCard}>
          <Text style={styles.hudLabel}>RECURRENCE</Text>
          <Text style={[styles.hudValue, { color: '#ffae00' }]}>
            {task.recurrence && task.recurrence !== 'NONE' ? `[ ${task.recurrence} ]` : 'NONE'}
          </Text>
        </View>

        <View style={styles.hudCard}>
          <Text style={styles.hudLabel}>STREAK_RECORD</Text>
          <Text style={[styles.hudValue, { color: '#ffae00' }]}>
            🔥 {task.streak || 0} CYCLES
          </Text>
        </View>
      </View>

      {task.tags ? (
        <View style={styles.tagsContainer}>
          <Text style={styles.metaLabel}>TAGS //:</Text>
          <View style={styles.tagWrap}>
            {task.tags.split(',').map((tag, i) => (
              <View key={i} style={styles.tagChip}>
                <Text style={styles.tagChipText}>#{tag.trim()}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* KHỐI SUBTASK CHECKLIST */}
      <View style={styles.checklistCard}>
        <View style={styles.checklistHeader}>
          <Text style={styles.sectionTitle}>SUBTASKS_PROTOCOL //</Text>
          <Text style={styles.progressText}>
            {completedSubtasksCount}/{subtasks.length} ({subtaskProgress}%)
          </Text>
        </View>

        {/* Thanh Gauge Bar tiến độ Subtask */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${subtaskProgress}%` }]} />
        </View>

        {/* Ô thêm Subtask nhanh ngay tại trang chi tiết */}
        <View style={styles.subtaskInputRow}>
          <TextInput
            style={styles.subtaskInput}
            value={newSubtaskTitle}
            onChangeText={setNewSubtaskTitle}
            placeholder="Thêm node con mới..."
            placeholderTextColor={Colors.white}
            onSubmitEditing={handleAddSubtask}
          />
          <TouchableOpacity style={styles.subtaskAddBtn} onPress={handleAddSubtask} disabled={subLoading}>
            <Text style={styles.subtaskAddBtnText}>+ ADD</Text>
          </TouchableOpacity>
        </View>

        {/* Danh sách Subtasks */}
        {subtasks.length === 0 ? (
          <Text style={styles.emptySubText}>CHƯA CÓ SUBTASK NÀO ĐƯỢC THIẾT LẬP //</Text>
        ) : (
          subtasks.map((st) => (
            <View key={st.id} style={styles.subtaskItem}>
              <TouchableOpacity 
                style={styles.subtaskCheckRow} 
                onPress={() => handleToggleSubtask(st.id, st.is_completed)}
              >
                <View style={[styles.subtaskBox, st.is_completed && styles.subtaskBoxChecked]}>
                  {st.is_completed && <View style={styles.subtaskInner} />}
                </View>
                <Text style={[styles.subtaskTitle, st.is_completed && styles.subtaskTitleDone]}>
                  {st.title}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleDeleteSubtask(st.id)}>
                <Text style={styles.subtaskDel}>[X]</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <CustomButton 
        title="MODIFY_NODE_DATA" 
        onPress={() => router.push(`/edit/${task.id}` as any)} 
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 20, paddingTop: 50, paddingBottom: 50 },
  navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  link: { color: Colors.primary, fontFamily: 'monospace', fontWeight: 'bold' },
  editBtn: { borderWidth: 1, borderColor: Colors.glitchCyan, paddingHorizontal: 10, paddingVertical: 5 },
  editBtnText: { color: Colors.glitchCyan, fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold' },

  panelCard: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 15 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusBadge: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  statusCompleted: { borderColor: Colors.primary, backgroundColor: 'rgba(0, 255, 65, 0.1)' },
  statusPending: { borderColor: '#FFFF00', backgroundColor: 'rgba(255, 255, 0, 0.1)' },
  statusText: { fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold' },

  taskTitle: { color: Colors.white, fontFamily: 'monospace', fontSize: 20, fontWeight: '900', marginBottom: 15 },
  metaLabel: { color: Colors.primary, fontFamily: 'monospace', fontSize: 11, marginBottom: 6 },
  descBox: { backgroundColor: Colors.background, borderWidth: 1, borderColor: '#262626', padding: 12 },
  descText: { color: '#E0E0E0', fontFamily: 'monospace', fontSize: 13, lineHeight: 20 },

  gridRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  hudCard: { flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, padding: 12, marginHorizontal: 3 },
  hudLabel: { color: Colors.white, fontFamily: 'monospace', fontSize: 10, marginBottom: 4 },
  hudValue: { color: Colors.white, fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold' },

  tagsContainer: { marginBottom: 15 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  tagChip: { borderWidth: 1, borderColor: Colors.glitchMagenta, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6, marginBottom: 6 },
  tagChipText: { color: Colors.glitchMagenta, fontFamily: 'monospace', fontSize: 11 },

  // Checklist
  checklistCard: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 20 },
  checklistHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: Colors.primary, fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold' },
  progressText: { color: Colors.glitchCyan, fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold' },
  progressBarTrack: { height: 8, backgroundColor: Colors.background, borderWidth: 1, borderColor: '#333', marginBottom: 15 },
  progressBarFill: { height: '100%', backgroundColor: Colors.primary },

  subtaskInputRow: { flexDirection: 'row', marginBottom: 15 },
  subtaskInput: { flex: 1, backgroundColor: Colors.background, color: Colors.white, padding: 10, borderWidth: 1, borderColor: Colors.border, fontFamily: 'monospace', fontSize: 12 },
  subtaskAddBtn: { backgroundColor: Colors.primary, paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center' },
  subtaskAddBtnText: { color: Colors.background, fontFamily: 'monospace', fontWeight: 'bold', fontSize: 12 },

  emptySubText: { color: Colors.white, fontFamily: 'monospace', fontSize: 11, textAlign: 'center', paddingVertical: 10 },
  subtaskItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#222' },
  subtaskCheckRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  subtaskBox: { width: 18, height: 18, borderWidth: 1, borderColor: Colors.primary, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  subtaskBoxChecked: { borderColor: Colors.white },
  subtaskInner: { width: 8, height: 8, backgroundColor: Colors.white },
  subtaskTitle: { color: Colors.white, fontFamily: 'monospace', fontSize: 13, flex: 1 },
  subtaskTitleDone: { color: Colors.white, textDecorationLine: 'line-through' },
  subtaskDel: { color: Colors.danger, fontFamily: 'monospace', fontWeight: 'bold', paddingLeft: 10 }
});