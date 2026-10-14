import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CustomButton from '../../components/CustomButton';
import GlitchText from '../../components/GlitchText';
import { ColorPalette } from '../../constants/Colors';
import { addSubtask, deleteSubtask, setSubtasks, toggleSubtaskStatus } from '../../features/subtasksSlice';
import { toggleTaskStatus, updateTask } from '../../features/tasksSlice';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../services/supabase';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

export default function TaskDetailView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const t = useTranslation();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const isDark = colors.background === '#0D0D0D';

  const task = useAppSelector(state => state.tasks.tasksList.find(tItem => tItem.id === id));
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
        <Text style={{ color: colors.white, fontFamily: 'monospace' }}>SYS_ERR: Node không tồn tại hoặc đã bị xóa.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={styles.link}>{t.backHome}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCompleted = task.status === 'COMPLETED';
  const priorityColor = task.priority === 'HIGH' ? colors.danger : (task.priority === 'MEDIUM' ? '#FFAE00' : colors.glitchCyan);

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

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/' as any);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.link}>{t.backHome}</Text>
        </TouchableOpacity>

        <GlitchText text="TASK_INTEL" fontSize={26} />
        
        <TouchableOpacity 
          style={styles.editBtn} 
          onPress={() => router.push(`/edit/${task.id}` as any)}
        >
          <Text style={styles.editBtnText}>[ {t.editNode} ]</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.panelCard}>
        <View style={styles.statusRow}>
          <Text style={styles.metaLabel}>{t.status}</Text>
          <TouchableOpacity 
            style={[styles.statusBadge, isCompleted ? styles.statusCompleted : styles.statusPending]}
            onPress={handleToggleMainTask}
          >
            <Text style={[styles.statusText, isCompleted ? { color: colors.primary } : { color: '#FFAE00' }]}>
              {isCompleted ? '[ COMPLETED ✓ ]' : '[ IN_PROGRESS ⧗ ]'}
            </Text>
          </TouchableOpacity>
        </View>

        {!isCompleted && (
          <TouchableOpacity 
            style={styles.focusLaunchBtn}
            onPress={() => router.push({ pathname: '/focus', params: { taskId: task.id } } as any)}
          >
            <Text style={styles.focusLaunchText}>
              &gt; {t.focusMode} &lt;
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.taskTitle}>{task.title}</Text>

        <Text style={styles.metaLabel}>{t.description}</Text>
        <View style={styles.descBox}>
          <Text style={styles.descText}>
            {task.description ? task.description : 'NO_DESCRIPTION_ATTACHED //'}
          </Text>
        </View>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.hudCard}>
          <Text style={styles.hudLabel}>{t.priority.replace(' //:', '')}</Text>
          <Text style={[styles.hudValue, { color: priorityColor }]}>[{task.priority}]</Text>
        </View>

        <View style={styles.hudCard}>
          <Text style={styles.hudLabel}>{t.category.replace(' //:', '')}</Text>
          <Text style={[styles.hudValue, { color: category?.color || colors.primary }]}>
            {category ? category.name : '[ ROOT ]'}
          </Text>
        </View>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.hudCard}>
          <Text style={styles.hudLabel}>{t.deadline.replace(' //:', '')}</Text>
          <Text style={styles.hudValue}>{task.due_date || 'NONE'}</Text>
        </View>

        <View style={styles.hudCard}>
          <Text style={styles.hudLabel}>{t.reminder.replace(' //:', '')}</Text>
          <Text style={styles.hudValue}>{task.reminder_time ? task.reminder_time.replace('T', ' ') : 'MUTED'}</Text>
        </View>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.hudCard}>
          <Text style={styles.hudLabel}>{t.recurrence.replace(' //:', '')}</Text>
          <Text style={[styles.hudValue, { color: '#FFAE00' }]}>
            {task.recurrence && task.recurrence !== 'NONE' ? `[ ${task.recurrence} ]` : 'NONE'}
          </Text>
        </View>

        <View style={styles.hudCard}>
          <Text style={styles.hudLabel}>STREAK_RECORD</Text>
          <Text style={[styles.hudValue, { color: colors.primary }]}>
            🔥 {task.streak || 0} CYCLES
          </Text>
        </View>
      </View>

      {task.tags ? (
        <View style={styles.tagsContainer}>
          <Text style={styles.metaLabel}>{t.tags}</Text>
          <View style={styles.tagWrap}>
            {task.tags.split(',').map((tag, i) => (
              <View key={i} style={styles.tagChip}>
                <Text style={styles.tagChipText}>#{tag.trim()}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.checklistCard}>
        <View style={styles.checklistHeader}>
          <Text style={styles.sectionTitle}>{t.subtasksProtocol}</Text>
          <Text style={styles.progressText}>
            {completedSubtasksCount}/{subtasks.length} ({subtaskProgress}%)
          </Text>
        </View>

        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${subtaskProgress}%` }]} />
        </View>

        <View style={styles.subtaskInputRow}>
          <TextInput
            style={styles.subtaskInput}
            value={newSubtaskTitle}
            onChangeText={setNewSubtaskTitle}
            placeholder={t.addSubtaskPlaceholder}
            placeholderTextColor={colors.textLight}
            onSubmitEditing={handleAddSubtask}
          />
          <TouchableOpacity style={styles.subtaskAddBtn} onPress={handleAddSubtask} disabled={subLoading}>
            <Text style={styles.subtaskAddBtnText}>+ ADD</Text>
          </TouchableOpacity>
        </View>

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
        title={t.modifyNode} 
        onPress={() => router.push(`/edit/${task.id}` as any)} 
      />
    </ScrollView>
  );
}

const getStyles = (colors: ColorPalette) => {
  const isDark = colors.background === '#0D0D0D';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: 20, paddingTop: 50, paddingBottom: 50 },
    navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    link: { color: colors.primary, fontFamily: 'monospace', fontWeight: 'bold' },
    editBtn: { 
      borderWidth: 2, 
      borderColor: colors.primary, 
      paddingHorizontal: 12, 
      paddingVertical: 6,
      backgroundColor: isDark ? '#0D0D0D' : colors.primary,
    },
    editBtnText: { 
      color: isDark ? colors.primary : '#000000', 
      fontFamily: 'monospace', 
      fontSize: 12, 
      fontWeight: 'bold' 
    },

    panelCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 15 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    statusBadge: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
    statusCompleted: { borderColor: colors.primary, backgroundColor: 'rgba(0, 255, 65, 0.1)' },
    statusPending: { borderColor: '#FFAE00', backgroundColor: 'rgba(255, 174, 0, 0.1)' },
    statusText: { fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold' },

    focusLaunchBtn: {
      marginBottom: 12,
      paddingVertical: 8,
      borderWidth: 2,
      borderColor: colors.primary,
      backgroundColor: isDark ? '#0D0D0D' : colors.primary,
      alignItems: 'center'
    },
    focusLaunchText: { 
      color: isDark ? colors.primary : '#000000', 
      fontFamily: 'monospace', 
      fontSize: 11, 
      fontWeight: 'bold' 
    },

    taskTitle: { color: colors.white, fontFamily: 'monospace', fontSize: 20, fontWeight: '900', marginBottom: 15 },
    metaLabel: { color: colors.textLight, fontFamily: 'monospace', fontSize: 11, marginBottom: 6 },
    descBox: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, padding: 12 },
    descText: { color: colors.white, fontFamily: 'monospace', fontSize: 13, lineHeight: 20 },

    gridRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    hudCard: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 12, marginHorizontal: 3 },
    hudLabel: { color: colors.textLight, fontFamily: 'monospace', fontSize: 10, marginBottom: 4 },
    hudValue: { color: colors.white, fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold' },

    tagsContainer: { marginBottom: 15 },
    tagWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
    tagChip: { borderWidth: 1, borderColor: colors.glitchMagenta, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6, marginBottom: 6 },
    tagChipText: { color: colors.glitchMagenta, fontFamily: 'monospace', fontSize: 11 },

    checklistCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 20 },
    checklistHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { color: colors.primary, fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold' },
    progressText: { color: colors.glitchCyan, fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold' },
    progressBarTrack: { height: 8, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, marginBottom: 15 },
    progressBarFill: { height: '100%', backgroundColor: colors.primary },

    subtaskInputRow: { flexDirection: 'row', marginBottom: 15 },
    subtaskInput: { flex: 1, backgroundColor: colors.inputBg, color: colors.white, padding: 10, borderWidth: 1, borderColor: colors.border, fontFamily: 'monospace', fontSize: 12 },
    subtaskAddBtn: { 
      borderWidth: 1.5,
      borderColor: colors.primary,
      backgroundColor: isDark ? '#0D0D0D' : colors.primary, 
      paddingHorizontal: 14, 
      justifyContent: 'center', 
      alignItems: 'center' 
    },
    subtaskAddBtnText: { 
      color: isDark ? colors.primary : '#000000', 
      fontFamily: 'monospace', 
      fontWeight: 'bold', 
      fontSize: 12 
    },

    emptySubText: { color: colors.textLight, fontFamily: 'monospace', fontSize: 11, textAlign: 'center', paddingVertical: 10 },
    subtaskItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
    subtaskCheckRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    subtaskBox: { width: 18, height: 18, borderWidth: 1, borderColor: colors.primary, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
    subtaskBoxChecked: { borderColor: colors.textLight },
    subtaskInner: { width: 8, height: 8, backgroundColor: colors.primary },
    subtaskTitle: { color: colors.white, fontFamily: 'monospace', fontSize: 13, flex: 1 },
    subtaskTitleDone: { color: colors.textLight, textDecorationLine: 'line-through' },
    subtaskDel: { color: colors.danger, fontFamily: 'monospace', fontWeight: 'bold', paddingLeft: 10 }
  });
};