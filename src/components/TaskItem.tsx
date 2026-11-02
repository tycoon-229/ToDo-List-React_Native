import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAppSelector } from '../store/hooks';
import { useThemeColors } from '../hooks/useThemeColors';
import { ColorPalette } from '../constants/Colors';
import { Task } from '../features/tasksSlice';
import { formatDateTimeByZone } from '../constants/translations';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const isCompleted = task.status === 'COMPLETED';
  const priorityColor = task.priority === 'HIGH' ? colors.danger : (task.priority === 'MEDIUM' ? '#FFAE00' : colors.glitchCyan);

  const categoriesList = useAppSelector(state => state.categories.list);
  const category = task.category_id ? categoriesList.find(c => c.id === task.category_id) : null;

  const timezone = useAppSelector(state => state.settings.timezone);
  const language = useAppSelector(state => state.settings.language);
  const allSubtasks = useAppSelector(state => state.subtasks.list);
  const subtasks = useMemo(() => allSubtasks.filter(s => s.task_id === task.id), [allSubtasks, task.id]);
  const completedSubtasks = subtasks.filter(s => s.is_completed).length;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.checkboxWrapper} onPress={() => onToggle(task.id)}>
        <View style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}>
          {isCompleted && <View style={styles.innerSquare} />}
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.contentWrapper} 
        onPress={() => router.push(`/task/${task.id}` as any)}
      >
        <View style={styles.badgeRow}>
          {category && (
            <View style={[styles.categoryBadge, { borderColor: category.color || colors.primary }]}>
              <Text style={[styles.categoryBadgeText, { color: category.color || colors.primary }]}>
                {category.name}
              </Text>
            </View>
          )}

          {task.recurrence && task.recurrence !== 'NONE' && (
            <View style={[styles.categoryBadge, { borderColor: '#FFAE00' }]}>
              <Text style={[styles.categoryBadgeText, { color: '#FFAE00' }]}>
                ⟳ {task.recurrence} {task.streak && task.streak > 0 ? `🔥${task.streak}` : ''}
              </Text>
            </View>
          )}

          {subtasks.length > 0 && (
            <View style={styles.subtaskBadge}>
              <Text style={styles.subtaskBadgeText}>
                SUB: {completedSubtasks}/{subtasks.length}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.taskTitle, isCompleted && styles.taskCompletedText]} numberOfLines={1}>
          {task.title}
        </Text>
        
        {task.tags ? (
          <Text style={styles.tagsText}>
            #{task.tags.split(',').map(t => t.trim()).join(' #')}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: priorityColor }]}>[{task.priority}]</Text>
          {task.due_date && (
            <Text style={styles.metaText}>
              {' '} | DUE: {formatDateTimeByZone(task.due_date, timezone, language)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      
      <View style={styles.actionsColumn}>
        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => router.push(`/edit/${task.id}` as any)}
        >
          <Text style={styles.editText}>[ EDIT ]</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => onDelete(task.id)}
        >
          <Text style={styles.deleteText}>[ DEL ]</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (colors: ColorPalette) => StyleSheet.create({
  container: { 
    backgroundColor: colors.surface, 
    padding: 14, 
    borderWidth: 1, 
    borderColor: colors.border, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  checkboxWrapper: { marginRight: 12 },
  checkbox: { 
    width: 22, 
    height: 22, 
    borderWidth: 2, 
    borderColor: colors.primary, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  checkboxCompleted: { borderColor: colors.textLight },
  innerSquare: { width: 10, height: 10, backgroundColor: colors.primary },
  contentWrapper: { flex: 1, justifyContent: 'center', alignItems: 'flex-start' },
  
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  categoryBadge: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, marginRight: 6 },
  categoryBadgeText: { fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold', textTransform: 'uppercase' },

  subtaskBadge: { borderWidth: 1, borderColor: colors.glitchCyan, paddingHorizontal: 5, paddingVertical: 2 },
  subtaskBadgeText: { fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold', color: colors.glitchCyan },

  taskTitle: { fontSize: 15, color: colors.white, fontFamily: 'monospace', marginBottom: 4 },
  taskCompletedText: { textDecorationLine: 'line-through', color: colors.textLight },
  tagsText: { color: colors.glitchMagenta, fontFamily: 'monospace', fontSize: 10, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 11, fontFamily: 'monospace', color: colors.textLight },

  actionsColumn: {
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingLeft: 10,
  },
  actionBtn: { paddingVertical: 4 },
  editText: { color: colors.glitchCyan, fontFamily: 'monospace', fontWeight: 'bold', fontSize: 12 },
  deleteText: { color: colors.danger, fontFamily: 'monospace', fontWeight: 'bold', fontSize: 12 },
});