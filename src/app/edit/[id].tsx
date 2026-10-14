import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { updateTask } from '../../features/tasksSlice';
import { supabase } from '../../services/supabase';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useTranslation } from '../../hooks/useTranslation';
import { ColorPalette } from '../../constants/Colors';
import CustomButton from '../../components/CustomButton';
import GlitchText from '../../components/GlitchText';

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const t = useTranslation();
  const theme = useAppSelector(state => state.settings.theme);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const task = useAppSelector(state => state.tasks.tasksList.find(t => t.id === id));
  const categoriesList = useAppSelector(state => state.categories.list);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [tags, setTags] = useState('');
  const [recurrence, setRecurrence] = useState<'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'>('NONE');
  
  const [loading, setLoading] = useState(false);
  const [showCatDropdown, setShowCatDropdown] = useState(false);

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
        <Text style={{ color: colors.white, fontFamily: 'monospace' }}>SYS_ERR: Node not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={styles.link}>{t.return}</Text>
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
      recurrence
    };
    const reduxData = { 
      title, 
      description, 
      priority, 
      due_date: dueDate || undefined, 
      reminder_time: reminderTime || undefined,
      category_id: categoryId, 
      tags,
      recurrence
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

  const webInputStyle = { 
    backgroundColor: colors.inputBg, 
    color: colors.white, 
    padding: '12px', 
    border: `1px solid ${colors.border}`, 
    fontFamily: 'monospace', 
    width: '100%', 
    boxSizing: 'border-box', 
    outline: 'none', 
    colorScheme: theme === 'CYBER_DARK' ? 'dark' : 'light' 
  } as any;

  // Xử lý quay lại an toàn chống rỗng stack lịch sử
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/' as any);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={handleBack}>
        <Text style={styles.link}>{t.return}</Text>
      </TouchableOpacity>

      <GlitchText text="EDIT_NODE" fontSize={26} />
      </View>
      

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t.title}</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholderTextColor={colors.textLight} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t.description}</Text>
        <TextInput 
          style={[styles.input, { height: 90, textAlignVertical: 'top' }]} 
          value={description} 
          onChangeText={setDescription} 
          multiline 
          placeholderTextColor={colors.textLight} 
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t.category}</Text>
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
                  <View style={{ width: 8, height: 8, backgroundColor: cat.color || colors.primary, marginRight: 10 }} />
                  <Text style={styles.dropdownItemText}>{cat.name}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t.tags}</Text>
        <TextInput style={styles.input} value={tags} onChangeText={setTags} placeholder="frontend, urgent..." placeholderTextColor={colors.textLight} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t.priority}</Text>
        <View style={styles.row}>
          {(['LOW', 'MEDIUM', 'HIGH'] as const).map(p => (
            <TouchableOpacity key={p} style={[styles.priorityBtn, priority === p && styles.priorityBtnActive]} onPress={() => setPriority(p)}>
              <Text style={[styles.priorityText, priority === p && { color: colors.background }]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t.recurrence}</Text>
        <View style={styles.row}>
          {(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'] as const).map(rec => (
            <TouchableOpacity 
              key={rec} 
              style={[styles.priorityBtn, recurrence === rec && styles.priorityBtnActive]} 
              onPress={() => setRecurrence(rec)}
            >
              <Text style={[styles.priorityText, recurrence === rec && { color: colors.background }]}>
                {rec}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t.deadline}</Text>
        {Platform.OS === 'web' ? (
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={webInputStyle} />
        ) : (
          <TextInput style={styles.input} value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textLight} />
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t.reminder}</Text>
        {Platform.OS === 'web' ? (
          <input type="datetime-local" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} style={webInputStyle} />
        ) : (
          <TextInput style={styles.input} value={reminderTime} onChangeText={setReminderTime} placeholder="YYYY-MM-DDTHH:mm" placeholderTextColor={colors.textLight} />
        )}
      </View>

      <CustomButton title={t.modifyNode} onPress={handleUpdate} loading={loading} />
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const getStyles = (colors: ColorPalette) => StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: colors.background },
  navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  link: { color: colors.primary, fontFamily: 'monospace', fontWeight: 'bold' },
  inputGroup: { marginBottom: 15 },
  label: { color: colors.primary, fontFamily: 'monospace', fontSize: 13, marginBottom: 5 },
  input: { backgroundColor: colors.inputBg, color: colors.white, padding: 12, borderWidth: 1, borderColor: colors.border, fontFamily: 'monospace' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },

  priorityBtn: { 
    flex: 1, 
    padding: 12, 
    borderWidth: 1.5, 
    borderColor: colors.border, 
    alignItems: 'center', 
    marginHorizontal: 2, 
    backgroundColor: colors.background === '#0D0D0D' ? '#0D0D0D' : colors.surface 
  },
  priorityBtnActive: { 
    backgroundColor: colors.background === '#0D0D0D' ? '#0D0D0D' : colors.primary, 
    borderColor: colors.primary 
  },
  priorityText: { 
    color: colors.white, 
    fontFamily: 'monospace', 
    fontSize: 12, 
    fontWeight: 'bold' 
  },

  dropdownBtn: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.inputBg, padding: 12, borderWidth: 1, borderColor: colors.border },
  dropdownBtnText: { color: colors.white, fontFamily: 'monospace' },
  dropdownMenu: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderTopWidth: 0, maxHeight: 160 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  dropdownItemText: { color: colors.primary, fontFamily: 'monospace' }
});