import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator, Modal, Platform, ScrollView, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setTasks, addTask, toggleTaskStatus, deleteTask } from '../features/tasksSlice';
import { setCategories } from '../features/categoriesSlice';
import { clearSession } from '../features/authSlice';
import { supabase } from '../services/supabase';
import GlitchText from '../components/GlitchText';
import TaskItem from '../components/TaskItem';
import CustomButton from '../components/CustomButton';
import Colors from '../constants/Colors';

export default function Home() {
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const tasks = useAppSelector(state => state.tasks.tasksList);
  const categoriesList = useAppSelector(state => state.categories.list);
  const dispatch = useAppDispatch();
  
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [sortAsc, setSortAsc] = useState(false);
  
  // State điều khiển Drawer bên phải
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const [newTask, setNewTask] = useState({
    title: '', description: '', priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH', dueDate: '', categoryId: null as string | null, tags: ''
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    setLoading(true);
    const { data: tasksData } = await supabase.from('tasks').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
    if (tasksData) dispatch(setTasks(tasksData));
    const { data: catsData } = await supabase.from('categories').select('*').eq('user_id', user?.id);
    if (catsData) dispatch(setCategories(catsData));
    setLoading(false);
  };

  const handleLogout = async () => {
    setDrawerOpen(false);
    await supabase.auth.signOut();
    dispatch(clearSession());
    if (Platform.OS === 'web') window.alert('SYSTEM_OFFLINE: Đã ngắt kết nối an toàn.');
    else Alert.alert('SYSTEM_OFFLINE', 'Đã ngắt kết nối an toàn.');
  };

  const handleExecuteInsert = async () => {
    if (!newTask.title.trim() || !user?.id) {
      if (Platform.OS === 'web') window.alert('SYS_ERR: TITLE không được để trống.');
      else Alert.alert('SYS_ERR', 'TITLE không được để trống.');
      return;
    }
    setLoading(true);
    const insertData = { 
      title: newTask.title, description: newTask.description, priority: newTask.priority,
      due_date: newTask.dueDate || null, category_id: newTask.categoryId, tags: newTask.tags, user_id: user.id, status: 'TODO' 
    };
    const { data, error } = await supabase.from('tasks').insert([insertData]).select();
    if (error) {
      if (Platform.OS === 'web') window.alert(`SYS_ERR: ${error.message}`);
      else Alert.alert('SYS_ERR', error.message);
    } else {
      dispatch(addTask(data[0]));
      setModalVisible(false);
      setNewTask({ title: '', description: '', priority: 'MEDIUM', dueDate: '', categoryId: null, tags: '' });
    }
    setLoading(false);
  };

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

  
const sortedTasks = [...tasks].sort((a, b) => {
  // Ưu tiên task TODO lên trước COMPLETED
  if (a.status === 'TODO' && b.status === 'COMPLETED') return -1;
  if (a.status === 'COMPLETED' && b.status === 'TODO') return 1;

  // Nếu tắt sắp xếp theo ngày thì giữ nguyên thứ tự trong từng nhóm
  if (!sortAsc) return 0;

  // Task không có deadline sẽ nằm dưới task có deadline
  if (!a.due_date) return 1;
  if (!b.due_date) return -1;

  // Sắp xếp deadline tăng dần
  return new Date(a.due_date).getTime() -  new Date(b.due_date).getTime();
});

  if (!isAuthenticated) return <View style={styles.container} />;

  const selectedCatName = newTask.categoryId === null ? '[ ROOT ]' : categoriesList.find(c => c.id === newTask.categoryId)?.name || '[ UNKNOWN ]';

  return (
    <View style={styles.container}>
      {/* HEADER: Đổi thành nút SYS_MENU đơn giản ở góc phải */}
      <View style={styles.header}>
        <GlitchText text="TASKS_DB" fontSize={30} />
        <TouchableOpacity 
          style={styles.menuToggleBtn} 
          onPress={() => setDrawerOpen(true)}
        >
          <Text style={styles.menuToggleText}>[ ≡ SYS_MENU ]</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.toolbar}>
        <Text style={styles.label}>TOTAL_NODES: {tasks.length}</Text>
        <TouchableOpacity onPress={() => setSortAsc(!sortAsc)} style={styles.sortBtn}>
          <Text style={styles.sortText}>SORT_BY_DEADLINE: [ {sortAsc ? 'ON' : 'OFF'} ]</Text>
        </TouchableOpacity>
      </View>

      {loading && tasks.length === 0 ? <ActivityIndicator color={Colors.primary} size="large" /> : (
        <FlatList data={sortedTasks} keyExtractor={(item) => item.id} renderItem={({ item }) => <TaskItem task={item} onToggle={handleToggle} onDelete={handleDelete} />} contentContainerStyle={{ paddingBottom: 100 }} />
      )}

      <View style={styles.fabContainer}>
        <CustomButton title="ADD_NEW_NODE" onPress={() => setModalVisible(true)} />
      </View>

      {/* --- SLIDE-IN DRAWER TỪ PHẢI QUA --- */}
      {isDrawerOpen && (
        <View style={styles.drawerOverlay}>
          {/* Vùng bấm bên trái để đóng drawer */}
          <TouchableOpacity style={styles.drawerBackdrop} onPress={() => setDrawerOpen(false)} />
          
          {/* Nội dung Drawer trượt ra từ phải */}
          <View style={styles.drawerContainer}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>SYSTEM_NAV //</Text>
              <TouchableOpacity onPress={() => setDrawerOpen(false)}>
                <Text style={styles.closeText}>[ X ]</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.drawerLinks}>
              <TouchableOpacity 
                style={styles.drawerItem} 
                onPress={() => { setDrawerOpen(false); router.push('/calendar' as any); }}
              >
                <Text style={styles.drawerLinkText}>&gt; TIMELINE_</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.drawerItem} 
                onPress={() => { setDrawerOpen(false); router.push('/categories' as any); }}
              >
                <Text style={[styles.drawerLinkText, { color: Colors.glitchMagenta }]}>&gt; CATEGORIES_</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.drawerItem, { borderBottomWidth: 0, marginTop: 20 }]} 
                onPress={handleLogout}
              >
                <Text style={[styles.drawerLinkText, { color: Colors.danger }]}>&gt; DISCONNECT_</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* POPUP THÊM MỚI TASK (Giữ nguyên) */}
      <Modal visible={isModalVisible} transparent={true} animationType="fade">
        {/* ... (Modal code giữ nguyên như trước) ... */}
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.scrollModal} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Text style={styles.modalHeader}>INITIALIZE_NEW_TASK //</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>TITLE //:</Text>
                <TextInput style={styles.input} value={newTask.title} onChangeText={(t) => setNewTask({...newTask, title: t})} placeholder="Nhập tiêu đề..." placeholderTextColor={Colors.textLight} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>DESCRIPTION //:</Text>
                <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} value={newTask.description} onChangeText={(t) => setNewTask({...newTask, description: t})} placeholder="Nhập mô tả..." placeholderTextColor={Colors.textLight} multiline />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CATEGORY //:</Text>
                <TextInput style={styles.input} value={selectedCatName} editable={false} />
                {/* Có thể giữ nguyên phần dropdown chọn cat cũ ở đây */}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>TAGS //:</Text>
                <TextInput style={styles.input} value={newTask.tags} onChangeText={(t) => setNewTask({...newTask, tags: t})} placeholder="frontend, bug..." placeholderTextColor={Colors.textLight} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>PRIORITY //:</Text>
                <View style={styles.row}>
                  {(['LOW', 'MEDIUM', 'HIGH'] as const).map(p => (
                    <TouchableOpacity key={p} style={[styles.priorityBtn, newTask.priority === p && styles.priorityBtnActive]} onPress={() => setNewTask({...newTask, priority: p})}>
                      <Text style={[styles.priorityText, newTask.priority === p && { color: Colors.background }]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>DEADLINE //:</Text>
                {Platform.OS === 'web' ? (
                  <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})} style={webInputStyle} />
                ) : (
                  <TextInput style={styles.input} value={newTask.dueDate} onChangeText={(t) => setNewTask({...newTask, dueDate: t})} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textLight} />
                )}
              </View>

              <View style={styles.modalActions}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <CustomButton title="CANCEL" variant="outline" onPress={() => setModalVisible(false)} />
                </View>
                <View style={{ flex: 1 }}>
                  <CustomButton title="EXECUTE" onPress={handleExecuteInsert} loading={loading} />
                </View>
              </View>
              
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const webInputStyle = { backgroundColor: Colors.background, color: Colors.white, padding: '15px', border: `1px solid ${Colors.border}`, fontFamily: 'monospace', width: '100%', boxSizing: 'border-box', outline: 'none', colorScheme: 'dark' } as any;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  
  // Style nút mở Drawer
  menuToggleBtn: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: Colors.primary, backgroundColor: Colors.surface },
  menuToggleText: { color: Colors.primary, fontFamily: 'monospace', fontWeight: 'bold' },

  // Styles cho Slide-in Drawer từ phải qua
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 1000,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    flex: 1, // Chiếm phần màn hình trống bên trái
  },
  drawerContainer: {
    width: '280px' as any, // Chiều rộng drawer trên web/mobile
    maxWidth: '80%',
    backgroundColor: Colors.surface,
    borderLeftWidth: 2,
    borderColor: Colors.primary,
    padding: 20,
    paddingTop: 50,
    height: '100%',
    shadowColor: Colors.primary,
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 15,
  },
  drawerTitle: {
    color: Colors.primary,
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeText: {
    color: Colors.danger,
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
  },
  drawerLinks: {
    flex: 1,
  },
  drawerItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  drawerLinkText: {
    color: Colors.primary,
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
  },

  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sortBtn: { backgroundColor: Colors.surface, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: Colors.primary },
  sortText: { color: Colors.primary, fontFamily: 'monospace', fontSize: 12 },
  fabContainer: { position: 'absolute', bottom: 30, left: 20, right: 20 },
  label: { color: Colors.primary, fontFamily: 'monospace', fontSize: 14, marginBottom: 5 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.85)', justifyContent: 'center' },
  scrollModal: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: Colors.surface, padding: 20, borderWidth: 1, borderColor: Colors.primary, shadowColor: Colors.primary, shadowOpacity: 0.5, shadowRadius: 10 },
  modalHeader: { color: Colors.white, fontSize: 18, fontFamily: 'monospace', fontWeight: 'bold', marginBottom: 20, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: Colors.textLight, paddingBottom: 10 },
  inputGroup: { marginBottom: 15 },
  input: { backgroundColor: Colors.background, color: Colors.white, padding: 15, borderWidth: 1, borderColor: Colors.border, fontFamily: 'monospace' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  priorityBtn: { flex: 1, padding: 15, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', marginHorizontal: 2 },
  priorityBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  priorityText: { color: Colors.white, fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold' },
  modalActions: { flexDirection: 'row', marginTop: 10 }
});