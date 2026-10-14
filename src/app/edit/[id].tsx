import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CustomButton from '../../components/CustomButton';
import GlitchText from '../../components/GlitchText';
import Colors from '../../constants/Colors';
import { updateTask } from '../../features/tasksSlice';
import { supabase } from '../../services/supabase';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();

  const task = useAppSelector(state => state.tasks.tasksList.find(t => t.id === id));
  const categoriesList = useAppSelector(state => state.categories.list);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [tags, setTags] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [showCatDropdown, setShowCatDropdown] = useState(false);

  const [recurrence, setRecurrence] = useState<'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'>('NONE');

  useEffect(() => {
  if (task) {
    setTitle(task.title || '');
    setDescription(task.description || '');
    setPriority(task.priority || 'MEDIUM');
    setDueDate(task.due_date || '');
    setReminderTime(task.reminder_time || '');
    setCategoryId(task.category_id || null);
    setTags(task.tags || '');
    setRecurrence(task.recurrence || 'NONE');
  }
}, [task]);

  if (!task) {
    return (
      <View style={styles.container}>
        <Text style={{ color: Colors.white, fontFamily: 'monospace' }}>SYS_ERR: Node not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={styles.link}>{'< RETURN'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleUpdate = async () => {
    if (!title.trim()) {
      if (Platform.OS === 'web') window.alert('SYS_ERR: Tiêu đề không được để trống.');
      else Alert.alert('SYS_ERR', 'Tiêu đề không được để trống.');
      return;
    }

    setLoading(true);
    const supabaseData = { 
      title, 
      description, 
      priority, 
      due_date: dueDate || null, 
      reminder_time: reminderTime || null,
      category_id: categoryId, 
      tags,
      recurrence,
    };
    const reduxData = { 
      title, 
      description, 
      priority, 
      due_date: dueDate || undefined, 
      reminder_time: reminderTime || undefined,
      category_id: categoryId, 
      tags,
      recurrence,
    };

    const { error } = await supabase.from('tasks').update(supabaseData).eq('id', id);
    
    if (error) {
      if (Platform.OS === 'web') window.alert(`SYS_ERR: ${error.message}`);
      else Alert.alert('SYS_ERR', error.message);
    } else {
      dispatch(updateTask({ ...task, ...reduxData } as any)); 
      if (Platform.OS === 'web') {
        window.alert('SYSTEM_UPDATE: Bản ghi đã được ghi đè thành công.');
        router.back();
      } else {
        Alert.alert('SYSTEM_UPDATE', 'Bản ghi đã được ghi đè thành công.', [{ text: 'ACKNOWLEDGE', onPress: () => router.back() }]);
      }
    }
    setLoading(false);
  };

  const selectedCatName = categoryId === null ? '[ ROOT ]' : categoriesList.find(c => c.id === categoryId)?.name || '[ UNKNOWN ]';

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()} >
          <Text style={styles.link}>{'< RETURN'}</Text>
        </TouchableOpacity>

        <GlitchText text="EDIT_NODE" fontSize={26} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>TITLE //:</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholderTextColor={Colors.textLight} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>DESCRIPTION //:</Text>
        <TextInput 
          style={[styles.input, { height: 90, textAlignVertical: 'top' }]} 
          value={description} 
          onChangeText={setDescription} 
          multiline 
          placeholderTextColor={Colors.textLight} 
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>CATEGORY //:</Text>
        <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowCatDropdown(!showCatDropdown)}>
          <Text style={styles.dropdownBtnText}>{selectedCatName}</Text>
          <Text style={styles.dropdownBtnText}>{showCatDropdown ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        
        {showCatDropdown && (
          <ScrollView style={styles.dropdownMenu} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
            <TouchableOpacity style={styles.dropdownItem} onPress={() => { setCategoryId(null); setShowCatDropdown(false); }}>
              <Text style={styles.dropdownItemText}>[ ROOT ]</Text>
            </TouchableOpacity>
            {categoriesList.map(cat => (
              <TouchableOpacity key={cat.id} style={styles.dropdownItem} onPress={() => { setCategoryId(cat.id); setShowCatDropdown(false); }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 8, height: 8, backgroundColor: cat.color || Colors.primary, marginRight: 10 }} />
                  <Text style={styles.dropdownItemText}>{cat.name}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>TAGS (Phân cách bằng dấu phẩy) //:</Text>
        <TextInput style={styles.input} value={tags} onChangeText={setTags} placeholder="frontend, urgent..." placeholderTextColor={Colors.textLight} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>PRIORITY //:</Text>
        <View style={styles.row}>
          {(['LOW', 'MEDIUM', 'HIGH'] as const).map(p => (
            <TouchableOpacity key={p} style={[styles.priorityBtn, priority === p && styles.priorityBtnActive]} onPress={() => setPriority(p)}>
              <Text style={[styles.priorityText, priority === p && { color: Colors.background }]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>RECURRENCE_PROTOCOL //:</Text>
        <View style={styles.row}>
          {(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'] as const).map(rec => (
            <TouchableOpacity 
              key={rec} 
              style={[styles.priorityBtn, recurrence === rec && styles.priorityBtnActive]} 
              onPress={() => setRecurrence(rec)}
            >
              <Text style={[styles.priorityText, recurrence === rec && { color: Colors.background }]}>
                {rec}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>DEADLINE //:</Text>
        {Platform.OS === 'web' ? (
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={webInputStyle} />
        ) : (
          <TextInput style={styles.input} value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textLight} />
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>REMINDER_TIMESTAMP //:</Text>
        {Platform.OS === 'web' ? (
          <input type="datetime-local" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} style={webInputStyle} />
        ) : (
          <TextInput style={styles.input} value={reminderTime} onChangeText={setReminderTime} placeholder="YYYY-MM-DDTHH:mm" placeholderTextColor={Colors.textLight} />
        )}
      </View>

      <CustomButton title="OVERWRITE_DATA" onPress={handleUpdate} loading={loading} />
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const webInputStyle = { 
  backgroundColor: Colors.surface, 
  color: Colors.white, 
  padding: '12px', 
  border: `1px solid ${Colors.border}`, 
  fontFamily: 'monospace', 
  width: '100%', 
  boxSizing: 'border-box', 
  outline: 'none', 
  colorScheme: 'dark' 
} as any;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: Colors.background },
  navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  link: { color: Colors.primary, fontFamily: 'monospace', fontWeight: 'bold' },
  inputGroup: { marginBottom: 15 },
  label: { color: Colors.primary, fontFamily: 'monospace', fontSize: 13, marginBottom: 5 },
  input: { backgroundColor: Colors.surface, color: Colors.white, padding: 12, borderWidth: 1, borderColor: Colors.border, fontFamily: 'monospace' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  priorityBtn: { flex: 1, padding: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', marginHorizontal: 2 },
  priorityBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  priorityText: { color: Colors.white, fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold' },

  dropdownBtn: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.surface, padding: 12, borderWidth: 1, borderColor: Colors.border },
  dropdownBtnText: { color: Colors.white, fontFamily: 'monospace' },
  dropdownMenu: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderTopWidth: 0, maxHeight: 160 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
  dropdownItemText: { color: Colors.primary, fontFamily: 'monospace' }
});