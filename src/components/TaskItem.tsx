import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAppSelector } from '../store/hooks';
import Colors from '../constants/Colors';
import { Task } from '../features/tasksSlice';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const isCompleted = task.status === 'COMPLETED';
  const priorityColor = task.priority === 'HIGH' ? Colors.danger : (task.priority === 'MEDIUM' ? '#FFFF00' : Colors.glitchCyan);

  const categoriesList = useAppSelector(state => state.categories.list);
  const category = task.category_id ? categoriesList.find(c => c.id === task.category_id) : null;

  const subtasks = useAppSelector(state => state.subtasks.list.filter(s => s.task_id === task.id));
  const completedSubtasks = subtasks.filter(s => s.is_completed).length;

  return (
    <View style={styles.container}>
      {/* Checkbox hoàn thành */}
      <TouchableOpacity style={styles.checkboxWrapper} onPress={() => onToggle(task.id)}>
        <View style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}>
          {isCompleted && <View style={styles.innerSquare} />}
        </View>
      </TouchableOpacity>

      {/* Thân Task: BẤM VÀO ĐỂ XEM CHI TIẾT */}
      <TouchableOpacity 
        style={styles.contentWrapper} 
        onPress={() => router.push(`/task/${task.id}` as any)}
      >
        <View style={styles.badgeRow}>
          {category && (
            <View style={[styles.categoryBadge, { borderColor: category.color || Colors.primary }]}>
              <Text style={[styles.categoryBadgeText, { color: category.color || Colors.primary }]}>
                {category.name}
              </Text>
            </View>
          )}

          {/* HUY HIỆU CHU KỲ & CHUỖI STREAK */}
          {task.recurrence && task.recurrence !== 'NONE' && (
            <View style={[styles.categoryBadge, { borderColor: '#ffae00' }]}>
              <Text style={[styles.categoryBadgeText, { color: '#ffae00' }]}>
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
          {task.due_date && <Text style={styles.metaText}> | DUE: {task.due_date}</Text>}
        </View>
      </TouchableOpacity>
      
      {/* CỘT NÚT THAO TÁC: NÚT EDIT NẰM TRÊN NÚT DEL */}
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

const styles = StyleSheet.create({
  container: { 
    backgroundColor: Colors.surface, 
    padding: 14, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  checkboxWrapper: { marginRight: 12 },
  checkbox: { 
    width: 22, 
    height: 22, 
    borderWidth: 2, 
    borderColor: Colors.primary, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  checkboxCompleted: { borderColor: Colors.textLight },
  innerSquare: { width: 10, height: 10, backgroundColor: Colors.textLight },
  contentWrapper: { flex: 1, justifyContent: 'center', alignItems: 'flex-start' },
  
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  categoryBadge: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, marginRight: 6 },
  categoryBadgeText: { fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold', textTransform: 'uppercase' },

  subtaskBadge: { borderWidth: 1, borderColor: Colors.glitchCyan, paddingHorizontal: 5, paddingVertical: 2 },
  subtaskBadgeText: { fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold', color: Colors.glitchCyan },

  taskTitle: { fontSize: 15, color: Colors.white, fontFamily: 'monospace', marginBottom: 4 },
  taskCompletedText: { textDecorationLine: 'line-through', color: Colors.textLight },
  tagsText: { color: Colors.glitchMagenta, fontFamily: 'monospace', fontSize: 10, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 11, fontFamily: 'monospace', color: Colors.textLight },

  // Cột nút bên phải
  actionsColumn: {
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#222',
    paddingLeft: 10,
  },
  actionBtn: {
    paddingVertical: 4,
  },
  editText: {
    color: Colors.glitchCyan,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 12,
  },
  deleteText: {
    color: Colors.danger,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 12,
  },
});