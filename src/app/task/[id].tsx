import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { updateTask } from '../../features/tasksSlice';
import { supabase } from '../../services/supabase';
import CustomButton from '../../components/CustomButton';
import GlitchText from '../../components/GlitchText';
import Colors from '../../constants/Colors';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const task = useAppSelector(state => state.tasks.tasksList.find(t => t.id === id));
  const categoriesList = useAppSelector(state => state.categories.list);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [tags, setTags] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [showCatDropdown, setShowCatDropdown] = useState(false); // State Dropdown

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'MEDIUM');
      setDueDate(task.due_date || '');
      setCategoryId(task.category_id || null);
      setTags(task.tags || '');
    }
  }, [task]);

  if (!task) {
    return (
      <View style={styles.container}>
        <Text style={{color: Colors.white, fontFamily: 'monospace'}}>SYS_ERR: Task not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}><Text style={styles.link}>{'< RETURN'}</Text></TouchableOpacity>
      </View>
    );
  }

  const handleUpdate = async () => {
    setLoading(true);
    const supabaseData = { title, description, priority, due_date: dueDate || null, category_id: categoryId, tags };
    const reduxData = { title, description, priority, due_date: dueDate || undefined, category_id: categoryId, tags };
    const { error } = await supabase.from('tasks').update(supabaseData).eq('id', id);
    
    if (error) {
      if (Platform.OS === 'web') window.alert(`SYS_ERR: ${error.message}`);
      else Alert.alert('SYS_ERR', error.message);
    } else {
      dispatch(updateTask({ ...task, ...reduxData } as any)); 
      if (Platform.OS === 'web') {
        window.alert('SYSTEM_UPDATE: Dữ liệu node đã được ghi đè thành công.\n\nNhấn OK để [ ACKNOWLEDGE ]');
        router.back();
      } else {
        Alert.alert('SYSTEM_UPDATE', 'Dữ liệu node đã được ghi đè thành công.', [{ text: 'ACKNOWLEDGE', onPress: () => router.back() }]);
      }
    }
    setLoading(false);
  };

  const selectedCatName = categoryId === null ? '[ ROOT ]' : categoriesList.find(c => c.id === categoryId)?.name || '[ UNKNOWN ]';

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 20 }}>
        <Text style={styles.link}>{'< BACK_TO_MAIN'}</Text>
      </TouchableOpacity>

      <GlitchText text="EDIT_NODE" fontSize={28} />

      {/* Giao diện form đồng nhất với popup thêm */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>TITLE //:</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholderTextColor={Colors.textLight} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>DESCRIPTION //:</Text>
        <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} multiline placeholderTextColor={Colors.textLight} />
      </View>

      {/* MENU DROPDOWN MỚI CHO CATEGORY */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>CATEGORY //:</Text>
        <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowCatDropdown(!showCatDropdown)}>
          <Text style={styles.dropdownBtnText}>{selectedCatName}</Text>
          <Text style={styles.dropdownBtnText}>{showCatDropdown ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        
        {showCatDropdown && (
          <View style={styles.dropdownMenu}>
            <TouchableOpacity style={styles.dropdownItem} onPress={() => { setCategoryId(null); setShowCatDropdown(false); }}>
              <Text style={styles.dropdownItemText}>[ ROOT ]</Text>
            </TouchableOpacity>
            {categoriesList.map(cat => (
              <TouchableOpacity key={cat.id} style={styles.dropdownItem} onPress={() => { setCategoryId(cat.id); setShowCatDropdown(false); }}>
                <Text style={styles.dropdownItemText}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>TAGS (Phân cách bởi dấu phẩy) //:</Text>
        <TextInput style={styles.input} value={tags} onChangeText={setTags} placeholder="frontend, bug..." placeholderTextColor={Colors.textLight} />
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
        <Text style={styles.label}>DEADLINE //:</Text>
        {Platform.OS === 'web' ? (
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={webInputStyle} />
        ) : (
          <TextInput style={styles.input} value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textLight} />
        )}
      </View>

      <CustomButton title="OVERWRITE_DATA" onPress={handleUpdate} loading={loading} />
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const webInputStyle = { backgroundColor: Colors.surface, color: Colors.white, padding: '15px', border: `1px solid ${Colors.border}`, fontFamily: 'monospace', width: '100%', boxSizing: 'border-box', outline: 'none', colorScheme: 'dark' } as any;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: Colors.background },
  link: { color: Colors.primary, fontFamily: 'monospace', fontWeight: 'bold' },
  
  inputGroup: { marginBottom: 15 },
  label: { color: Colors.primary, fontFamily: 'monospace', fontSize: 14, marginBottom: 5 },
  input: { backgroundColor: Colors.surface, color: Colors.white, padding: 15, borderWidth: 1, borderColor: Colors.border, fontFamily: 'monospace' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  priorityBtn: { flex: 1, padding: 15, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', marginHorizontal: 2 },
  priorityBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  priorityText: { color: Colors.white, fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold' },

  // Styles cho Dropdown
  dropdownBtn: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.surface, padding: 15, borderWidth: 1, borderColor: Colors.border },
  dropdownBtnText: { color: Colors.white, fontFamily: 'monospace' },
  dropdownMenu: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderTopWidth: 0, maxHeight: 150 },
  dropdownItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#333' },
  dropdownItemText: { color: Colors.primary, fontFamily: 'monospace' }
});