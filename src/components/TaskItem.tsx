import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAppSelector } from '../store/hooks'; // THÊM DÒNG NÀY
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

  // Lấy danh sách Categories từ Redux để tìm màu & tên danh mục của Task này
  const categoriesList = useAppSelector(state => state.categories.list);
  const category = task.category_id ? categoriesList.find(c => c.id === task.category_id) : null;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.checkboxWrapper} onPress={() => onToggle(task.id)}>
        <View style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}>
            {isCompleted && <View style={styles.innerSquare} />}
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.contentWrapper} onPress={() => router.push(`/task/${task.id}` as any)}>
        
        {/* HIỂN THỊ NHÃN DANH MỤC Ở TRÊN CÙNG */}
        {category && (
          <View style={[styles.categoryBadge, { borderColor: category.color || Colors.primary }]}>
            <Text style={[styles.categoryBadgeText, { color: category.color || Colors.primary }]}>
              {category.name}
            </Text>
          </View>
        )}

        <Text style={[styles.taskTitle, isCompleted && styles.taskCompletedText]} numberOfLines={1}>
          {task.title}
        </Text>
        
        {task.tags ? (
          <Text style={{ color: Colors.glitchMagenta, fontFamily: 'monospace', fontSize: 10, marginBottom: 4 }}>
            #{task.tags.split(',').map(t => t.trim()).join(' #')}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: priorityColor }]}>[{task.priority}]</Text>
          {task.due_date && <Text style={styles.metaText}> | DUE: {task.due_date}</Text>}
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(task.id)}>
        <Text style={styles.deleteText}>[ DEL ]</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.surface, padding: 15, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  checkboxWrapper: { marginRight: 15 },
  checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  checkboxCompleted: { borderColor: Colors.textLight },
  innerSquare: { width: 12, height: 12, backgroundColor: Colors.textLight },
  contentWrapper: { flex: 1, justifyContent: 'center', alignItems: 'flex-start' }, // Căn trái
  
  // Style cho nhãn Category
  categoryBadge: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 6 },
  categoryBadgeText: { fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold', textTransform: 'uppercase' },

  taskTitle: { fontSize: 16, color: Colors.white, fontFamily: 'monospace', marginBottom: 5 },
  taskCompletedText: { textDecorationLine: 'line-through', color: Colors.textLight },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, fontFamily: 'monospace', color: Colors.textLight },
  deleteBtn: { marginLeft: 15 },
  deleteText: { color: Colors.danger, fontWeight: 'bold', fontFamily: 'monospace' },
});