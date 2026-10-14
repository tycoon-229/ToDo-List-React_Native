import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  Modal, 
  Platform, 
  ScrollView 
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setTasks, addTask, toggleTaskStatus, deleteTask } from '../features/tasksSlice';
import { setCategories } from '../features/categoriesSlice';
import { clearSession } from '../features/authSlice';
import { toggleNotifications, setDefaultOffset } from '../features/settingsSlice';
import { supabase } from '../services/supabase';
import { requestBrowserPermission, triggerCyborgNotification } from '../services/notificationService';
import GlitchText from '../components/GlitchText';
import TaskItem from '../components/TaskItem';
import CustomButton from '../components/CustomButton';
import Colors from '../constants/Colors';
import { setSubtasks } from '../features/subtasksSlice';

export default function Home() {
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const tasks = useAppSelector(state => state.tasks.tasksList);
  const categoriesList = useAppSelector(state => state.categories.list);
  const { notificationsEnabled, defaultOffsetMinutes } = useAppSelector(state => state.settings);
  const dispatch = useAppDispatch();
  
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [sortAsc, setSortAsc] = useState(false);

  // Điều khiển Dropdown Category & Drawer
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  // --- STATE TÌM KIẾM VÀ LỌC MA TRẬN (MODULE 6) ---
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'TODO' | 'COMPLETED'>('ALL');
  const [filterPriority, setFilterPriority] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');
  const [filterCategoryId, setFilterCategoryId] = useState<string | 'ALL'>('ALL');

  // Form State tạo Task mới
  const [newTask, setNewTask] = useState({
    title: '', 
    description: '', 
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH', 
    dueDate: '', 
    reminderTime: '',
    categoryId: null as string | null, 
    tags: '',
    recurrence: 'NONE' as 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY',
  });

  // Tự động làm mới dữ liệu mỗi khi người dùng quay lại màn hình Home
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && user?.id) {
        fetchData();
      }
    }, [isAuthenticated, user?.id])
  );

  const fetchData = async () => {
    setLoading(true);
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    // Tải toàn bộ subtask
    const { data: subData } = await supabase.from('subtasks').select('*');
    if (subData) dispatch(setSubtasks(subData));

    if (tasksData) dispatch(setTasks(tasksData));

    const { data: catsData } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user?.id);

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
      title: newTask.title, 
      description: newTask.description, 
      priority: newTask.priority,
      due_date: newTask.dueDate || null, 
      reminder_time: newTask.reminderTime || null,
      category_id: newTask.categoryId, 
      tags: newTask.tags, 
      recurrence: newTask.recurrence,
      streak: 0,
      user_id: user.id, 
      status: 'TODO' 
    };

    const { data, error } = await supabase.from('tasks').insert([insertData]).select();

    if (error) {
      if (Platform.OS === 'web') window.alert(`SYS_ERR: ${error.message}`);
      else Alert.alert('SYS_ERR', error.message);
    } else {
      dispatch(addTask(data[0]));
      setModalVisible(false);
      setNewTask({ 
        title: '', 
        description: '', 
        priority: 'MEDIUM', 
        dueDate: '', 
        reminderTime: '', 
        categoryId: null, 
        tags: '',
        recurrence: 'NONE',
      });
      setShowCatDropdown(false);
    }
    setLoading(false);
  };

  const handleToggle = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // Nếu là Task lặp lại và đang từ TODO -> bấm hoàn thành: Tự động gia hạn chu kỳ kế tiếp
    if (task.status === 'TODO' && task.recurrence && task.recurrence !== 'NONE') {
      const baseDate = task.due_date ? new Date(task.due_date) : new Date();
      const nextDate = new Date(baseDate);

      if (task.recurrence === 'DAILY') {
        nextDate.setDate(nextDate.getDate() + 1);
      } else if (task.recurrence === 'WEEKLY') {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (task.recurrence === 'MONTHLY') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }

      const nextDueDateStr = nextDate.toISOString().split('T')[0];
      const newStreak = (task.streak || 0) + 1;

      // Cập nhật Redux ngay lập tức
      dispatch(setTasks(tasks.map(t => t.id === id ? {
        ...t,
        due_date: nextDueDateStr,
        streak: newStreak,
        status: 'TODO'
      } : t)));

      triggerCyborgNotification('STREAK_EXTENDED', `Chuỗi liên tục đạt cấp độ: ${newStreak} 🔥`);

      // Cập nhật Supabase
      await supabase.from('tasks').update({
        due_date: nextDueDateStr,
        streak: newStreak,
        status: 'TODO'
      }).eq('id', id);

      return;
    }

    // Logic bình thường đối với task không lặp lại
    const newStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    dispatch(toggleTaskStatus(id));
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
  };

  const handleDelete = async (id: string) => {
    dispatch(deleteTask(id));
    await supabase.from('tasks').delete().eq('id', id);
  };

  const handleTestAlert = async () => {
    const granted = await requestBrowserPermission();
    if (granted || Platform.OS !== 'web') {
      triggerCyborgNotification('SIGNAL_TEST', 'Kênh âm thanh cảnh báo Cyborg và Web Push hoạt động ổn định.');
    } else {
      window.alert('Vui lòng mở quyền thông báo (Notification) trên thanh địa chỉ trình duyệt.');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterStatus('ALL');
    setFilterPriority('ALL');
    setFilterCategoryId('ALL');
  };

  // --- THUẬT TOÁN TÌM KIẾM, LỌC ĐA TIÊU CHÍ VÀ SẮP XẾP ---
  const processedTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // 1. Lọc từ khóa tìm kiếm (Title, Description, Tags)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = task.title?.toLowerCase().includes(q);
          const matchDesc = task.description?.toLowerCase().includes(q);
          const matchTags = task.tags?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchTags) return false;
        }

        // 2. Lọc theo trạng thái
        if (filterStatus !== 'ALL' && task.status !== filterStatus) return false;

        // 3. Lọc theo mức độ ưu tiên
        if (filterPriority !== 'ALL' && task.priority !== filterPriority) return false;

        // 4. Lọc theo danh mục
        if (filterCategoryId !== 'ALL') {
          if (filterCategoryId === 'ROOT' && task.category_id !== null) return false;
          if (filterCategoryId !== 'ROOT' && task.category_id !== filterCategoryId) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Luôn ưu tiên TODO lên trước COMPLETED
        if (a.status === 'TODO' && b.status === 'COMPLETED') return -1;
        if (a.status === 'COMPLETED' && b.status === 'TODO') return 1;

        if (!sortAsc) return 0;

        if (!a.due_date) return 1;
        if (!b.due_date) return -1;

        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
  }, [tasks, searchQuery, filterStatus, filterPriority, filterCategoryId, sortAsc]);

  if (!isAuthenticated) return <View style={styles.container} />;

  const isFilterActive = searchQuery !== '' || filterStatus !== 'ALL' || filterPriority !== 'ALL' || filterCategoryId !== 'ALL';
  const selectedCatName = newTask.categoryId === null 
    ? '[ ROOT ]' 
    : categoriesList.find(c => c.id === newTask.categoryId)?.name || '[ UNKNOWN ]';

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrapper}>
          <GlitchText text="TASKS_DB" fontSize={26} />
        </View>
        <TouchableOpacity 
          style={styles.menuToggleBtn} 
          onPress={() => setDrawerOpen(true)}
        >
          <Text style={styles.menuToggleText}>[ ≡ SYS_MENU ]</Text>
        </TouchableOpacity>
      </View>

      {/* THANH TÌM KIẾM DÒNG LỆNH (LIVE SEARCH) */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="SEARCH_QUERY //: gõ tên, mô tả hoặc tag..."
          placeholderTextColor={Colors.textLight}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity style={styles.searchClearBtn} onPress={() => setSearchQuery('')}>
            <Text style={styles.searchClearText}>[X]</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* TOOLBAR ĐIỀU KHIỂN & BẬT TẮT MA TRẬN LỌC */}
      <View style={styles.toolbar}>
        <View style={styles.toolbarLeft}>
          <Text style={styles.label}>
            MATCHED: {processedTasks.length}/{tasks.length}
          </Text>
          <TouchableOpacity 
            style={[styles.filterToggleBtn, (showFilterPanel || isFilterActive) && styles.filterToggleBtnActive]} 
            onPress={() => setShowFilterPanel(!showFilterPanel)}
          >
            <Text style={[styles.filterToggleText, (showFilterPanel || isFilterActive) && { color: Colors.background }]}>
              [ FILTER_MATRIX {isFilterActive ? '*' : ''} ]
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => setSortAsc(!sortAsc)} style={styles.sortBtn}>
          <Text style={styles.sortText}>DEADLINE: [ {sortAsc ? 'ASC' : 'DEFAULT'} ]</Text>
        </TouchableOpacity>
      </View>

      {/* BẢNG LỌC MA TRẬN (EXPANDABLE FILTER PANEL) */}
      {showFilterPanel && (
        <View style={styles.filterMatrixCard}>
          <View style={styles.filterMatrixHeader}>
            <Text style={styles.filterMatrixTitle}>QUERY_FILTER_MATRIX //</Text>
            {isFilterActive && (
              <TouchableOpacity onPress={handleResetFilters}>
                <Text style={styles.resetFilterText}>[ RESET_ALL ]</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 1. Lọc Trạng thái */}
          <Text style={styles.filterSubLabel}>STATUS //:</Text>
          <View style={styles.filterRow}>
            {(['ALL', 'TODO', 'COMPLETED'] as const).map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.filterChip, filterStatus === st && styles.filterChipActive]}
                onPress={() => setFilterStatus(st)}
              >
                <Text style={[styles.filterChipText, filterStatus === st && { color: Colors.background }]}>
                  {st}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 2. Lọc Priority */}
          <Text style={styles.filterSubLabel}>PRIORITY //:</Text>
          <View style={styles.filterRow}>
            {(['ALL', 'LOW', 'MEDIUM', 'HIGH'] as const).map((pr) => (
              <TouchableOpacity
                key={pr}
                style={[styles.filterChip, filterPriority === pr && styles.filterChipActive]}
                onPress={() => setFilterPriority(pr)}
              >
                <Text style={[styles.filterChipText, filterPriority === pr && { color: Colors.background }]}>
                  {pr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* CHỌN CHU KỲ LẶP LẠI */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>RECURRENCE_PROTOCOL //:</Text>
                <View style={styles.row}>
                  {(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'] as const).map(rec => (
                    <TouchableOpacity 
                      key={rec} 
                      style={[styles.priorityBtn, newTask.recurrence === rec && styles.priorityBtnActive]} 
                      onPress={() => setNewTask({...newTask, recurrence: rec})}
                    >
                      <Text style={[styles.priorityText, newTask.recurrence === rec && { color: Colors.background }]}>
                        {rec}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

          {/* 3. Lọc Danh mục */}
          <Text style={styles.filterSubLabel}>CATEGORY //:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScrollFilter}>
            <TouchableOpacity
              style={[styles.filterChip, filterCategoryId === 'ALL' && styles.filterChipActive, { marginRight: 6 }]}
              onPress={() => setFilterCategoryId('ALL')}
            >
              <Text style={[styles.filterChipText, filterCategoryId === 'ALL' && { color: Colors.background }]}>ALL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, filterCategoryId === 'ROOT' && styles.filterChipActive, { marginRight: 6 }]}
              onPress={() => setFilterCategoryId('ROOT')}
            >
              <Text style={[styles.filterChipText, filterCategoryId === 'ROOT' && { color: Colors.background }]}>[ ROOT ]</Text>
            </TouchableOpacity>

            {categoriesList.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterChip, 
                  filterCategoryId === cat.id && styles.filterChipActive,
                  { borderColor: cat.color || Colors.primary, marginRight: 6 }
                ]}
                onPress={() => setFilterCategoryId(cat.id)}
              >
                <Text style={[
                  styles.filterChipText, 
                  filterCategoryId === cat.id ? { color: Colors.background } : { color: cat.color || Colors.primary }
                ]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* DANH SÁCH CÔNG VIỆC SAU KHI LỌC */}
      {loading && tasks.length === 0 ? (
        <ActivityIndicator color={Colors.primary} size="large" />
      ) : (
        <FlatList 
          data={processedTasks} 
          keyExtractor={(item) => item.id} 
          renderItem={({ item }) => <TaskItem task={item} onToggle={handleToggle} onDelete={handleDelete} />} 
          contentContainerStyle={{ paddingBottom: 100 }} 
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>NO_NODES_MATCHED_QUERY //</Text>
              {isFilterActive && (
                <TouchableOpacity onPress={handleResetFilters} style={styles.emptyResetBtn}>
                  <Text style={styles.emptyResetText}>[ CLEAR_FILTERS ]</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* NÚT THÊM TASK NỔI */}
      <View style={styles.fabContainer}>
        <CustomButton title="ADD_NEW_NODE" onPress={() => setModalVisible(true)} />
      </View>

      {/* DRAWER BÊN PHẢI */}
      {isDrawerOpen && (
        <View style={styles.drawerOverlay}>
          <TouchableOpacity style={styles.drawerBackdrop} onPress={() => setDrawerOpen(false)} />
          <View style={styles.drawerContainer}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>SYSTEM_CONTROL //</Text>
              <TouchableOpacity onPress={() => setDrawerOpen(false)}>
                <Text style={styles.closeText}>[ X ]</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.drawerLinks}>
              <TouchableOpacity 
                style={styles.drawerItem} 
                onPress={() => { setDrawerOpen(false); router.push('/calendar' as any); }}
              >
                <Text style={styles.drawerLinkText}>&gt; TIMELINE_</Text>
              </TouchableOpacity>

              {/* NÚT VÀO CHẾ ĐỘ TẬP TRUNG (MỚI) */}
              <TouchableOpacity 
                style={styles.drawerItem} 
                onPress={() => { setDrawerOpen(false); router.push('/focus' as any); }}
              >
                <Text style={[styles.drawerLinkText, { color: Colors.white }]}>&gt; FOCUS_MODE_</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.drawerItem} 
                onPress={() => { setDrawerOpen(false); router.push('/analytics' as any); }}
              >
                <Text style={[styles.drawerLinkText, { color: Colors.glitchCyan }]}>&gt; TELEMETRY_STATS_</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.drawerItem} 
                onPress={() => { setDrawerOpen(false); router.push('/categories' as any); }}
              >
                <Text style={[styles.drawerLinkText, { color: Colors.glitchMagenta }]}>&gt; CATEGORIES_</Text>
              </TouchableOpacity>

              {/* BẢNG CẤU HÌNH HỆ THỐNG THÔNG BÁO */}
              <View style={styles.configBox}>
                <Text style={styles.configHeading}>ALERT_SYSTEM //:</Text>

                <TouchableOpacity 
                  style={[styles.configToggleBtn, notificationsEnabled && styles.configToggleBtnActive]} 
                  onPress={() => dispatch(toggleNotifications())}
                >
                  <Text style={[styles.configToggleText, notificationsEnabled && { color: Colors.background }]}>
                    STATUS: [ {notificationsEnabled ? 'ACTIVE' : 'MUTED'} ]
                  </Text>
                </TouchableOpacity>

                <Text style={[styles.label, { marginTop: 15, fontSize: 11 }]}>DEFAULT_OFFSET //:</Text>
                <View style={styles.row}>
                  {[15, 30, 60].map((mins) => (
                    <TouchableOpacity
                      key={mins}
                      style={[styles.offsetBtn, defaultOffsetMinutes === mins && styles.offsetBtnActive]}
                      onPress={() => dispatch(setDefaultOffset(mins))}
                    >
                      <Text style={[styles.offsetText, defaultOffsetMinutes === mins && { color: Colors.background }]}>
                        {mins}M
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.testBtn} onPress={handleTestAlert}>
                  <Text style={styles.testBtnText}>&gt; TEST_ALERT_SIGNAL</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.drawerItem, { borderBottomWidth: 0, marginTop: 25 }]} 
                onPress={handleLogout}
              >
                <Text style={[styles.drawerLinkText, { color: Colors.danger }]}>&gt; DISCONNECT_</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}

      {/* POPUP THÊM MỚI TASK */}
      <Modal visible={isModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.scrollModal} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Text style={styles.modalHeader}>INITIALIZE_NEW_TASK //</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>TITLE //:</Text>
                <TextInput 
                  style={styles.input} 
                  value={newTask.title} 
                  onChangeText={(t) => setNewTask({...newTask, title: t})} 
                  placeholder="Nhập tiêu đề..." 
                  placeholderTextColor={Colors.textLight} 
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>DESCRIPTION //:</Text>
                <TextInput 
                  style={[styles.input, { height: 90, textAlignVertical: 'top' }]} 
                  value={newTask.description} 
                  onChangeText={(t) => setNewTask({...newTask, description: t})} 
                  placeholder="Nhập mô tả..." 
                  placeholderTextColor={Colors.textLight} 
                  multiline 
                />
              </View>

              {/* DROPDOWN CHỌN DANH MỤC (HỖ TRỢ CUỘN TOÀN BỘ DANH SÁCH) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CATEGORY //:</Text>
                <TouchableOpacity 
                  style={styles.dropdownBtn} 
                  onPress={() => setShowCatDropdown(!showCatDropdown)}
                >
                  <Text style={styles.dropdownBtnText}>{selectedCatName}</Text>
                  <Text style={styles.dropdownBtnText}>{showCatDropdown ? '▲' : '▼'}</Text>
                </TouchableOpacity>
                
                {showCatDropdown && (
                  <ScrollView 
                    style={styles.dropdownMenu} 
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                  >
                    <TouchableOpacity 
                      style={styles.dropdownItem} 
                      onPress={() => { 
                        setNewTask({...newTask, categoryId: null}); 
                        setShowCatDropdown(false); 
                      }}
                    >
                      <Text style={styles.dropdownItemText}>[ ROOT ]</Text>
                    </TouchableOpacity>

                    {categoriesList.map(cat => (
                      <TouchableOpacity 
                        key={cat.id} 
                        style={styles.dropdownItem} 
                        onPress={() => { 
                          setNewTask({...newTask, categoryId: cat.id}); 
                          setShowCatDropdown(false); 
                        }}
                      >
                        <View style={styles.dropdownItemRow}>
                          <View style={[styles.catDot, { backgroundColor: cat.color || Colors.primary }]} />
                          <Text style={styles.dropdownItemText}>{cat.name}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>TAGS //:</Text>
                <TextInput 
                  style={styles.input} 
                  value={newTask.tags} 
                  onChangeText={(t) => setNewTask({...newTask, tags: t})} 
                  placeholder="frontend, bug, v1.0..." 
                  placeholderTextColor={Colors.textLight} 
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>PRIORITY //:</Text>
                <View style={styles.row}>
                  {(['LOW', 'MEDIUM', 'HIGH'] as const).map(p => (
                    <TouchableOpacity 
                      key={p} 
                      style={[styles.priorityBtn, newTask.priority === p && styles.priorityBtnActive]} 
                      onPress={() => setNewTask({...newTask, priority: p})}
                    >
                      <Text style={[styles.priorityText, newTask.priority === p && { color: Colors.background }]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>DEADLINE (HẠN CHÓT) //:</Text>
                {Platform.OS === 'web' ? (
                  <input 
                    type="date" 
                    value={newTask.dueDate} 
                    onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})} 
                    style={webInputStyle} 
                  />
                ) : (
                  <TextInput 
                    style={styles.input} 
                    value={newTask.dueDate} 
                    onChangeText={(t) => setNewTask({...newTask, dueDate: t})} 
                    placeholder="YYYY-MM-DD" 
                    placeholderTextColor={Colors.textLight} 
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>REMINDER_TIMESTAMP (GIỜ NHẮC) //:</Text>
                {Platform.OS === 'web' ? (
                  <input 
                    type="datetime-local" 
                    value={newTask.reminderTime} 
                    onChange={(e) => setNewTask({...newTask, reminderTime: e.target.value})} 
                    style={webInputStyle} 
                  />
                ) : (
                  <TextInput 
                    style={styles.input} 
                    value={newTask.reminderTime} 
                    onChangeText={(t) => setNewTask({...newTask, reminderTime: t})} 
                    placeholder="YYYY-MM-DDTHH:mm" 
                    placeholderTextColor={Colors.textLight} 
                  />
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

const webInputStyle = { 
  backgroundColor: Colors.background, 
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
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: Colors.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  headerTitleWrapper: { flex: 1, alignItems: 'flex-start' },
  menuToggleBtn: { 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderWidth: 1, 
    borderColor: Colors.primary, 
    backgroundColor: Colors.surface, 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  menuToggleText: { color: Colors.primary, fontFamily: 'monospace', fontWeight: 'bold' },

  // Thanh tìm kiếm
  searchContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: Colors.surface,
    color: Colors.white,
    padding: 12,
    paddingRight: 40,
    borderWidth: 1,
    borderColor: Colors.border,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  searchClearBtn: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  searchClearText: {
    color: Colors.danger,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },

  // Toolbar
  toolbar: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12, 
    paddingBottom: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: Colors.border 
  },
  toolbarLeft: { flexDirection: 'row', alignItems: 'center' },
  label: { color: Colors.primary, fontFamily: 'monospace', fontSize: 12 },
  filterToggleBtn: {
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterToggleBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterToggleText: {
    color: Colors.primary,
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 'bold',
  },
  sortBtn: { 
    backgroundColor: Colors.surface, 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderWidth: 1, 
    borderColor: Colors.border 
  },
  sortText: { color: Colors.primary, fontFamily: 'monospace', fontSize: 11 },

  // Bảng Filter Ma trận
  filterMatrixCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: 14,
    marginBottom: 15,
  },
  filterMatrixHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingBottom: 6,
  },
  filterMatrixTitle: { color: Colors.primary, fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold' },
  resetFilterText: { color: Colors.danger, fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' },
  filterSubLabel: { color: Colors.textLight, fontFamily: 'monospace', fontSize: 10, marginBottom: 5, marginTop: 6 },
  filterRow: { flexDirection: 'row', marginBottom: 6 },
  filterChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    color: Colors.white,
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
  },
  categoryScrollFilter: { flexDirection: 'row', marginTop: 4, marginBottom: 4 },

  fabContainer: { position: 'absolute', bottom: 30, left: 20, right: 20 },

  // Drawer
  drawerOverlay: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: 'rgba(0,0,0,0.75)', 
    zIndex: 1000, 
    flexDirection: 'row' 
  },
  drawerBackdrop: { flex: 1 },
  drawerContainer: { 
    width: '300px' as any, 
    maxWidth: '85%', 
    backgroundColor: Colors.surface, 
    borderLeftWidth: 2, 
    borderColor: Colors.primary, 
    padding: 20, 
    paddingTop: 50, 
    height: '100%' 
  },
  drawerHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: Colors.border, 
    paddingBottom: 15 
  },
  drawerTitle: { color: Colors.primary, fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold' },
  closeText: { color: Colors.danger, fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold' },
  drawerLinks: { flex: 1 },
  drawerItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#222' },
  drawerLinkText: { color: Colors.primary, fontFamily: 'monospace', fontSize: 15, fontWeight: 'bold' },

  // Cấu hình Alert trong Drawer
  configBox: { 
    marginTop: 25, 
    padding: 12, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    backgroundColor: Colors.background 
  },
  configHeading: { color: Colors.primary, fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold', marginBottom: 10 },
  configToggleBtn: { padding: 10, borderWidth: 1, borderColor: Colors.primary, alignItems: 'center', backgroundColor: 'transparent' },
  configToggleBtnActive: { backgroundColor: Colors.primary },
  configToggleText: { color: Colors.primary, fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold' },
  offsetBtn: { flex: 1, padding: 8, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', marginHorizontal: 2 },
  offsetBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  offsetText: { color: Colors.white, fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' },
  testBtn: { marginTop: 15, padding: 8, borderWidth: 1, borderColor: Colors.glitchCyan, alignItems: 'center' },
  testBtnText: { color: Colors.glitchCyan, fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.85)', justifyContent: 'center' },
  scrollModal: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  modalContent: { 
    backgroundColor: Colors.surface, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: Colors.primary, 
    shadowColor: Colors.primary, 
    shadowOpacity: 0.5, 
    shadowRadius: 10 
  },
  modalHeader: { 
    color: Colors.white, 
    fontSize: 18, 
    fontFamily: 'monospace', 
    fontWeight: 'bold', 
    marginBottom: 20, 
    textAlign: 'center', 
    borderBottomWidth: 1, 
    borderBottomColor: Colors.textLight, 
    paddingBottom: 10 
  },
  inputGroup: { marginBottom: 15 },
  input: { 
    backgroundColor: Colors.background, 
    color: Colors.white, 
    padding: 12, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    fontFamily: 'monospace' 
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  priorityBtn: { flex: 1, padding: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', marginHorizontal: 2 },
  priorityBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  priorityText: { color: Colors.white, fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold' },
  modalActions: { flexDirection: 'row', marginTop: 15 },

  // Dropdown
  dropdownBtn: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    backgroundColor: Colors.background, 
    padding: 12, 
    borderWidth: 1, 
    borderColor: Colors.border 
  },
  dropdownBtnText: { color: Colors.white, fontFamily: 'monospace' },
  dropdownMenu: { 
    backgroundColor: Colors.surface, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    borderTopWidth: 0, 
    maxHeight: 180, // Tăng chiều cao và cho phép cuộn bên trong
  },
  dropdownItem: { 
    padding: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#222' 
  },
  dropdownItemRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  catDot: { 
    width: 8, 
    height: 8, 
    marginRight: 10 
  },
  dropdownItemText: { color: Colors.primary, fontFamily: 'monospace' },

  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: Colors.textLight, fontFamily: 'monospace', fontSize: 13 },
  emptyResetBtn: { marginTop: 15, padding: 8, borderWidth: 1, borderColor: Colors.primary },
  emptyResetText: { color: Colors.primary, fontFamily: 'monospace', fontSize: 12 }
});