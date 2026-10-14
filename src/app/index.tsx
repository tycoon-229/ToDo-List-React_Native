import React, { useState, useMemo, useCallback } from 'react';
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
  ScrollView,
  Image
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setTasks, addTask, toggleTaskStatus, softDeleteTask } from '../features/tasksSlice';
import { setCategories } from '../features/categoriesSlice';
import { clearSession, setProfile } from '../features/authSlice';
import { toggleNotifications, setDefaultOffset, setTheme, setLanguage, setTimezone } from '../features/settingsSlice';
import { supabase } from '../services/supabase';
import { requestBrowserPermission, triggerCyborgNotification } from '../services/notificationService';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from '../hooks/useTranslation';
import { ColorPalette } from '../constants/Colors';
import GlitchText from '../components/GlitchText';
import TaskItem from '../components/TaskItem';
import CustomButton from '../components/CustomButton';
import { setSubtasks } from '../features/subtasksSlice';

export default function Home() {
  const { user, profile, isAuthenticated } = useAppSelector(state => state.auth);
  const tasks = useAppSelector(state => state.tasks.tasksList);
  const categoriesList = useAppSelector(state => state.categories.list);
  const { notificationsEnabled, defaultOffsetMinutes, theme } = useAppSelector(state => state.settings);
  const dispatch = useAppDispatch();

  const colors = useThemeColors();
  const t = useTranslation();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const isDark = colors.background === '#0D0D0D';
  
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [sortAsc, setSortAsc] = useState(false);

  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'TODO' | 'COMPLETED'>('ALL');
  const [filterPriority, setFilterPriority] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');
  const [filterCategoryId, setFilterCategoryId] = useState<string | 'ALL'>('ALL');

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

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && user?.id) {
        fetchData();
      }
    }, [isAuthenticated, user?.id])
  );

  const fetchData = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (tasksData) dispatch(setTasks(tasksData));

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        dispatch(setProfile({
          username: profileData.username || '',
          bio: profileData.bio || '',
          avatar_url: profileData.avatar_url,
          cover_url: profileData.cover_url,
        }));
        if (profileData.theme) dispatch(setTheme(profileData.theme));
        if (profileData.language) dispatch(setLanguage(profileData.language));
        if (profileData.timezone) dispatch(setTimezone(profileData.timezone));
      }

      const { data: subData } = await supabase.from('subtasks').select('*');
      if (subData) dispatch(setSubtasks(subData));

      const { data: catsData } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);

      if (catsData) dispatch(setCategories(catsData));

    } catch (err) {
      console.error('FetchData error:', err);
    } finally {
      setLoading(false);
    }
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
      is_deleted: false,
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
    const task = tasks.find(tItem => tItem.id === id);
    if (!task) return;

    if (task.status === 'TODO' && task.recurrence && task.recurrence !== 'NONE') {
      const baseDate = task.due_date ? new Date(task.due_date) : new Date();
      const nextDate = new Date(baseDate);

      if (task.recurrence === 'DAILY') nextDate.setDate(nextDate.getDate() + 1);
      else if (task.recurrence === 'WEEKLY') nextDate.setDate(nextDate.getDate() + 7);
      else if (task.recurrence === 'MONTHLY') nextDate.setMonth(nextDate.getMonth() + 1);

      const nextDueDateStr = nextDate.toISOString().split('T')[0];
      const newStreak = (task.streak || 0) + 1;

      dispatch(setTasks(tasks.map(tItem => tItem.id === id ? {
        ...tItem,
        due_date: nextDueDateStr,
        streak: newStreak,
        status: 'TODO'
      } : tItem)));

      triggerCyborgNotification('STREAK_EXTENDED', `Chuỗi liên tục đạt: 🔥${newStreak}`);

      await supabase.from('tasks').update({
        due_date: nextDueDateStr,
        streak: newStreak,
        status: 'TODO'
      }).eq('id', id);
      return;
    }

    const newStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    dispatch(toggleTaskStatus(id));
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
  };

  const handleDelete = async (id: string) => {
    const deletedTimestamp = new Date().toISOString();
    dispatch(softDeleteTask({ id, deleted_at: deletedTimestamp }));

    await supabase
      .from('tasks')
      .update({ is_deleted: true, deleted_at: deletedTimestamp })
      .eq('id', id);

    triggerCyborgNotification('NODE_QUARANTINED', 'Nhiệm vụ đã chuyển vào Vùng cách ly.');
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

  const quarantinedCount = useMemo(() => tasks.filter(tItem => tItem.is_deleted === true).length, [tasks]);

  const processedTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (task.is_deleted === true) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = task.title?.toLowerCase().includes(q);
          const matchDesc = task.description?.toLowerCase().includes(q);
          const matchTags = task.tags?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchTags) return false;
        }

        if (filterStatus !== 'ALL' && task.status !== filterStatus) return false;
        if (filterPriority !== 'ALL' && task.priority !== filterPriority) return false;

        if (filterCategoryId !== 'ALL') {
          if (filterCategoryId === 'ROOT' && task.category_id !== null) return false;
          if (filterCategoryId !== 'ROOT' && task.category_id !== filterCategoryId) return false;
        }

        return true;
      })
      .sort((a, b) => {
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

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrapper}>
          <GlitchText text={t.tasksDb} fontSize={26} />
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity 
            style={styles.headerAvatarBtn} 
            onPress={() => router.push('/settings' as any)}
          >
            <Image 
              source={{ uri: profile?.avatar_url || 'https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif' }} 
              style={styles.headerAvatarImg} 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuToggleBtn} 
            onPress={() => setDrawerOpen(true)}
          >
            <Text style={styles.menuToggleText}>{t.sysMenu}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* THANH TÌM KIẾM */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t.searchPlaceholder}
          placeholderTextColor={colors.textLight}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity style={styles.searchClearBtn} onPress={() => setSearchQuery('')}>
            <Text style={styles.searchClearText}>[X]</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* TOOLBAR */}
      <View style={styles.toolbar}>
        <View style={styles.toolbarLeft}>
          <Text style={styles.label}>
            {t.matched} {processedTasks.length}/{tasks.filter(tItem => !tItem.is_deleted).length}
          </Text>
          <TouchableOpacity 
            style={[styles.filterToggleBtn, (showFilterPanel || isFilterActive) && styles.filterToggleBtnActive]} 
            onPress={() => setShowFilterPanel(!showFilterPanel)}
          >
            <Text style={[styles.filterToggleText, (showFilterPanel || isFilterActive) && { color: isDark ? colors.primary : '#000000' }]}>
              {t.filterMatrix} {isFilterActive ? '*' : ''}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => setSortAsc(!sortAsc)} style={styles.sortBtn}>
          <Text style={styles.sortText}>
            {t.deadlineSort} [ {sortAsc ? t.sortAsc : t.sortDefault} ]
          </Text>
        </TouchableOpacity>
      </View>

      {/* BẢNG LỌC MA TRẬN */}
      {showFilterPanel && (
        <View style={styles.filterMatrixCard}>
          <View style={styles.filterMatrixHeader}>
            <Text style={styles.filterMatrixTitle}>QUERY_FILTER_MATRIX //</Text>
            {isFilterActive && (
              <TouchableOpacity onPress={handleResetFilters}>
                <Text style={styles.resetFilterText}>{t.resetAll}</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.filterSubLabel}>{t.status}</Text>
          <View style={styles.filterRow}>
            {(['ALL', 'TODO', 'COMPLETED'] as const).map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.filterChip, filterStatus === st && styles.filterChipActive]}
                onPress={() => setFilterStatus(st)}
              >
                <Text style={[styles.filterChipText, filterStatus === st && { color: isDark ? colors.primary : '#000000' }]}>
                  {st === 'ALL' ? t.all : st === 'TODO' ? t.todo : t.completed}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterSubLabel}>{t.priority}</Text>
          <View style={styles.filterRow}>
            {(['ALL', 'LOW', 'MEDIUM', 'HIGH'] as const).map((pr) => (
              <TouchableOpacity
                key={pr}
                style={[styles.filterChip, filterPriority === pr && styles.filterChipActive]}
                onPress={() => setFilterPriority(pr)}
              >
                <Text style={[styles.filterChipText, filterPriority === pr && { color: isDark ? colors.primary : '#000000' }]}>
                  {pr === 'ALL' ? t.all : pr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterSubLabel}>{t.category}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScrollFilter}>
            <TouchableOpacity
              style={[styles.filterChip, filterCategoryId === 'ALL' && styles.filterChipActive, { marginRight: 6 }]}
              onPress={() => setFilterCategoryId('ALL')}
            >
              <Text style={[styles.filterChipText, filterCategoryId === 'ALL' && { color: isDark ? colors.primary : '#000000' }]}>{t.all}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, filterCategoryId === 'ROOT' && styles.filterChipActive, { marginRight: 6 }]}
              onPress={() => setFilterCategoryId('ROOT')}
            >
              <Text style={[styles.filterChipText, filterCategoryId === 'ROOT' && { color: isDark ? colors.primary : '#000000' }]}>[ ROOT ]</Text>
            </TouchableOpacity>

            {categoriesList.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterChip, 
                  filterCategoryId === cat.id && styles.filterChipActive,
                  { borderColor: cat.color || colors.primary, marginRight: 6 }
                ]}
                onPress={() => setFilterCategoryId(cat.id)}
              >
                <Text style={[
                  styles.filterChipText, 
                  filterCategoryId === cat.id ? { color: isDark ? colors.primary : '#000000' } : { color: cat.color || colors.primary }
                ]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* DANH SÁCH TASK */}
      {loading && tasks.length === 0 ? (
        <ActivityIndicator color={colors.primary} size="large" />
      ) : (
        <FlatList 
          data={processedTasks} 
          keyExtractor={(item) => item.id} 
          renderItem={({ item }) => <TaskItem task={item} onToggle={handleToggle} onDelete={handleDelete} />} 
          contentContainerStyle={{ paddingBottom: 100 }} 
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t.noTasksMatched}</Text>
              {isFilterActive && (
                <TouchableOpacity onPress={handleResetFilters} style={styles.emptyResetBtn}>
                  <Text style={styles.emptyResetText}>{t.clearFilters}</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* NÚT THÊM TASK */}
      <View style={styles.fabContainer}>
        <CustomButton title={t.addNode} onPress={() => setModalVisible(true)} />
      </View>

      {/* DRAWER */}
      {isDrawerOpen && (
        <View style={styles.drawerOverlay}>
          <TouchableOpacity style={styles.drawerBackdrop} onPress={() => setDrawerOpen(false)} />
          <View style={styles.drawerContainer}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>{t.systemControl}</Text>
              <TouchableOpacity onPress={() => setDrawerOpen(false)}>
                <Text style={styles.closeText}>[ X ]</Text>
              </TouchableOpacity>
            </View>

            {/* MINI PROFILE CARD */}
            <View style={styles.drawerProfileCard}>
              <Image 
                source={{ uri: profile?.avatar_url || 'https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif' }} 
                style={styles.drawerAvatarImg} 
              />
              <View style={styles.drawerProfileInfo}>
                <View 
                  style={[
                    styles.drawerNameWrapper, 
                    { 
                      borderLeftColor: colors.primary,
                      borderColor: colors.border,
                      backgroundColor: isDark 
                        ? 'rgba(10, 10, 10, 0.8)' 
                        : 'rgba(255, 255, 255, 0.85)',
                    }
                  ]}
                >
                  <Text 
                    style={[
                      styles.drawerProfileName, 
                      { 
                        color: colors.white,
                        textShadowColor: isDark 
                          ? 'rgba(0, 0, 0, 0.95)' 
                          : 'rgba(255, 255, 255, 0.9)',
                        textShadowOffset: { width: 1, height: 1 },
                        textShadowRadius: 4,
                      }
                    ]} 
                    numberOfLines={1}
                  >
                    {profile?.username || user?.email?.split('@')[0] || 'Cyborg_User'}
                  </Text>
                </View>

                <TouchableOpacity 
                  style={styles.editProfileBtn}
                  onPress={() => { setDrawerOpen(false); router.push('/settings' as any); }}
                >
                  <Text style={styles.editProfileBtnText}>[ {t.profileSettings.replace('> ', '').replace('_', '')} ]</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.drawerLinks}>
              <TouchableOpacity 
                style={styles.drawerItem} 
                onPress={() => { setDrawerOpen(false); router.push('/settings' as any); }}
              >
                <Text style={[styles.drawerLinkText, { color: colors.primary }]}>
                  {t.profileSettings}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.drawerItem} 
                onPress={() => { setDrawerOpen(false); router.push('/calendar' as any); }}
              >
                <Text style={styles.drawerLinkText}>{t.timeline}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.drawerItem} 
                onPress={() => { setDrawerOpen(false); router.push('/focus' as any); }}
              >
                <Text style={[styles.drawerLinkText, { color: colors.white }]}>{t.focusMode}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.drawerItem} 
                onPress={() => { setDrawerOpen(false); router.push('/analytics' as any); }}
              >
                <Text style={[styles.drawerLinkText, { color: colors.glitchCyan }]}>{t.telemetry}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.drawerItem} 
                onPress={() => { setDrawerOpen(false); router.push('/categories' as any); }}
              >
                <Text style={[styles.drawerLinkText, { color: colors.glitchMagenta }]}>{t.categories}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.drawerItem} 
                onPress={() => { setDrawerOpen(false); router.push('/quarantine' as any); }}
              >
                <Text style={[styles.drawerLinkText, { color: quarantinedCount > 0 ? colors.danger : colors.textLight }]}>
                  {t.quarantineVault} {quarantinedCount > 0 ? `[${quarantinedCount}]` : '[0]'}_
                </Text>
              </TouchableOpacity>

              <View style={styles.configBox}>
                <Text style={styles.configHeading}>{t.alertSystem}</Text>

                <TouchableOpacity 
                  style={[styles.configToggleBtn, notificationsEnabled && styles.configToggleBtnActive]} 
                  onPress={() => dispatch(toggleNotifications())}
                >
                  <Text style={[styles.configToggleText, notificationsEnabled && { color: isDark ? colors.primary : '#000000' }]}>
                    {t.alertStatus} [ {notificationsEnabled ? t.alertActive : t.alertMuted} ]
                  </Text>
                </TouchableOpacity>

                <Text style={[styles.label, { marginTop: 15, fontSize: 11 }]}>{t.defaultOffset}</Text>
                <View style={styles.row}>
                  {[15, 30, 60].map((mins) => (
                    <TouchableOpacity
                      key={mins}
                      style={[styles.offsetBtn, defaultOffsetMinutes === mins && styles.offsetBtnActive]}
                      onPress={() => dispatch(setDefaultOffset(mins))}
                    >
                      <Text style={[styles.offsetText, defaultOffsetMinutes === mins && { color: isDark ? colors.primary : '#000000' }]}>
                        {mins}M
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.testBtn} onPress={handleTestAlert}>
                  <Text style={styles.testBtnText}>{t.testSignal}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.drawerItem, { borderBottomWidth: 0, marginTop: 25 }]} 
                onPress={handleLogout}
              >
                <Text style={[styles.drawerLinkText, { color: colors.danger }]}>{t.disconnect}</Text>
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
              <Text style={styles.modalHeader}>{t.initNewTask}</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t.title}</Text>
                <TextInput 
                  style={styles.input} 
                  value={newTask.title} 
                  onChangeText={(tText) => setNewTask({...newTask, title: tText})} 
                  placeholder={t.titlePlaceholder} 
                  placeholderTextColor={colors.textLight} 
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t.description}</Text>
                <TextInput 
                  style={[styles.input, { height: 90, textAlignVertical: 'top' }]} 
                  value={newTask.description} 
                  onChangeText={(tText) => setNewTask({...newTask, description: tText})} 
                  placeholder={t.descPlaceholder} 
                  placeholderTextColor={colors.textLight} 
                  multiline 
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t.category}</Text>
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
                          <View style={[styles.catDot, { backgroundColor: cat.color || colors.primary }]} />
                          <Text style={styles.dropdownItemText}>{cat.name}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t.tags}</Text>
                <TextInput 
                  style={styles.input} 
                  value={newTask.tags} 
                  onChangeText={(tText) => setNewTask({...newTask, tags: tText})} 
                  placeholder={t.tagsPlaceholder} 
                  placeholderTextColor={colors.textLight} 
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t.priority}</Text>
                <View style={styles.row}>
                  {(['LOW', 'MEDIUM', 'HIGH'] as const).map(p => (
                    <TouchableOpacity 
                      key={p} 
                      style={[styles.priorityBtn, newTask.priority === p && styles.priorityBtnActive]} 
                      onPress={() => setNewTask({...newTask, priority: p})}
                    >
                      <Text style={[styles.priorityText, newTask.priority === p && { color: isDark ? colors.primary : '#000000' }]}>{p}</Text>
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
                      style={[styles.priorityBtn, newTask.recurrence === rec && styles.priorityBtnActive]} 
                      onPress={() => setNewTask({...newTask, recurrence: rec})}
                    >
                      <Text style={[styles.priorityText, newTask.recurrence === rec && { color: isDark ? colors.primary : '#000000' }]}>
                        {rec}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t.deadline}</Text>
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
                    onChangeText={(tText) => setNewTask({...newTask, dueDate: tText})} 
                    placeholder="YYYY-MM-DD" 
                    placeholderTextColor={colors.textLight} 
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t.reminder}</Text>
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
                    onChangeText={(tText) => setNewTask({...newTask, reminderTime: tText})} 
                    placeholder="YYYY-MM-DDTHH:mm" 
                    placeholderTextColor={colors.textLight} 
                  />
                )}
              </View>

              <View style={styles.modalActions}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <CustomButton title={t.cancel} variant="outline" onPress={() => setModalVisible(false)} />
                </View>
                <View style={{ flex: 1 }}>
                  <CustomButton title={t.execute} onPress={handleExecuteInsert} loading={loading} />
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: ColorPalette) => {
  const isDark = colors.background === '#0D0D0D';

  return StyleSheet.create({
    container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: colors.background },
    header: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: 15 
    },
    headerTitleWrapper: { flex: 1, alignItems: 'flex-start' },
    headerRightActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerAvatarBtn: {
      width: 38,
      height: 38,
      borderWidth: 2,
      borderColor: colors.primary,
      marginRight: 10,
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },
    headerAvatarImg: {
      width: '100%',
      height: '100%',
    },
    menuToggleBtn: { 
      paddingVertical: 8, 
      paddingHorizontal: 12, 
      borderWidth: 2, 
      borderColor: colors.primary, 
      backgroundColor: isDark ? '#0D0D0D' : colors.primary, 
      height: 40, 
      justifyContent: 'center', 
      alignItems: 'center' 
    },
    menuToggleText: { 
      color: isDark ? colors.primary : '#000000', 
      fontFamily: 'monospace', 
      fontWeight: 'bold' 
    },

    searchContainer: {
      position: 'relative',
      marginBottom: 15,
    },
    searchInput: {
      backgroundColor: colors.surface,
      color: colors.white,
      padding: 12,
      paddingRight: 40,
      borderWidth: 1,
      borderColor: colors.border,
      fontFamily: 'monospace',
      fontSize: 13,
    },
    searchClearBtn: {
      position: 'absolute',
      right: 12,
      top: 12,
    },
    searchClearText: {
      color: colors.danger,
      fontFamily: 'monospace',
      fontWeight: 'bold',
    },

    toolbar: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: 12, 
      paddingBottom: 10, 
      borderBottomWidth: 1, 
      borderBottomColor: colors.border 
    },
    toolbarLeft: { flexDirection: 'row', alignItems: 'center' },
    label: { color: colors.primary, fontFamily: 'monospace', fontSize: 12 },
    filterToggleBtn: {
      marginLeft: 10,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderWidth: 1.5,
      borderColor: colors.primary,
      backgroundColor: isDark ? '#0D0D0D' : colors.surface,
    },
    filterToggleBtnActive: {
      backgroundColor: isDark ? '#0D0D0D' : colors.primary,
      borderColor: colors.primary,
    },
    filterToggleText: {
      color: isDark ? colors.primary : colors.white,
      fontFamily: 'monospace',
      fontSize: 11,
      fontWeight: 'bold',
    },
    sortBtn: { 
      backgroundColor: isDark ? '#0D0D0D' : colors.primary, 
      paddingHorizontal: 8, 
      paddingVertical: 4, 
      borderWidth: 1.5, 
      borderColor: colors.primary 
    },
    sortText: { 
      color: isDark ? colors.primary : '#000000', 
      fontFamily: 'monospace', 
      fontSize: 11,
      fontWeight: 'bold'
    },

    filterMatrixCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.primary,
      padding: 14,
      marginBottom: 15,
    },
    filterMatrixHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 6,
    },
    filterMatrixTitle: { color: colors.primary, fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold' },
    resetFilterText: { color: colors.danger, fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' },
    filterSubLabel: { color: colors.textLight, fontFamily: 'monospace', fontSize: 10, marginBottom: 5, marginTop: 6 },
    filterRow: { flexDirection: 'row', marginBottom: 6 },
    filterChip: {
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: isDark ? '#0D0D0D' : colors.surface,
      marginRight: 6,
    },
    filterChipActive: {
      backgroundColor: isDark ? '#0D0D0D' : colors.primary,
      borderColor: colors.primary,
    },
    filterChipText: {
      color: colors.white,
      fontFamily: 'monospace',
      fontSize: 10,
      fontWeight: 'bold',
    },
    categoryScrollFilter: { flexDirection: 'row', marginTop: 4, marginBottom: 4 },

    fabContainer: { position: 'absolute', bottom: 30, left: 20, right: 20 },

    drawerOverlay: { 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.65)', 
      zIndex: 1000, 
      flexDirection: 'row' 
    },
    drawerBackdrop: { flex: 1 },
    drawerContainer: { 
      width: '300px' as any, 
      maxWidth: '85%', 
      backgroundColor: colors.surface, 
      borderLeftWidth: 2, 
      borderColor: colors.primary, 
      padding: 20, 
      paddingTop: 50, 
      height: '100%' 
    },
    drawerHeader: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: 15, 
      borderBottomWidth: 1, 
      borderBottomColor: colors.border, 
      paddingBottom: 12 
    },
    drawerTitle: { color: colors.primary, fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold' },
    closeText: { color: colors.danger, fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold' },
    
    drawerProfileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      marginBottom: 15,
    },
    drawerAvatarImg: {
      width: 46,
      height: 46,
      borderWidth: 2,
      borderColor: colors.primary,
      marginRight: 12,
    },
    drawerProfileInfo: {
      flex: 1,
    },
    drawerNameWrapper: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderWidth: 1,
      borderLeftWidth: 3,
      alignSelf: 'flex-start',
      marginBottom: 6,
      ...(Platform.OS === 'web' ? { 
        backdropFilter: 'blur(6px)', 
        WebkitBackdropFilter: 'blur(6px)' 
      } as any : {}),
    },
    drawerProfileName: {
      fontFamily: 'monospace',
      fontSize: 13,
      fontWeight: 'bold',
    },
    editProfileBtn: {
      alignSelf: 'flex-start',
    },
    editProfileBtnText: {
      color: colors.glitchCyan,
      fontFamily: 'monospace',
      fontSize: 11,
      fontWeight: 'bold',
    },

    drawerLinks: { flex: 1 },
    drawerItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
    drawerLinkText: { color: colors.primary, fontFamily: 'monospace', fontSize: 15, fontWeight: 'bold' },

    configBox: { 
      marginTop: 20, 
      padding: 12, 
      borderWidth: 1, 
      borderColor: colors.border, 
      backgroundColor: colors.background 
    },
    configHeading: { color: colors.primary, fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold', marginBottom: 10 },
    configToggleBtn: { 
      padding: 10, 
      borderWidth: 2, 
      borderColor: colors.primary, 
      alignItems: 'center', 
      backgroundColor: isDark ? '#0D0D0D' : colors.primary 
    },
    configToggleBtnActive: { 
      backgroundColor: isDark ? '#0D0D0D' : colors.primary 
    },
    configToggleText: { 
      color: isDark ? colors.primary : '#000000', 
      fontFamily: 'monospace', 
      fontSize: 12, 
      fontWeight: 'bold' 
    },
    offsetBtn: { 
      flex: 1, 
      padding: 8, 
      borderWidth: 1.5, 
      borderColor: colors.border, 
      alignItems: 'center', 
      marginHorizontal: 2,
      backgroundColor: isDark ? '#0D0D0D' : colors.surface,
    },
    offsetBtnActive: { 
      backgroundColor: isDark ? '#0D0D0D' : colors.primary, 
      borderColor: colors.primary 
    },
    offsetText: { 
      color: colors.white, 
      fontFamily: 'monospace', 
      fontSize: 11, 
      fontWeight: 'bold' 
    },
    testBtn: { 
      marginTop: 15, 
      padding: 8, 
      borderWidth: 1.5, 
      borderColor: colors.glitchCyan, 
      alignItems: 'center',
      backgroundColor: isDark ? '#0D0D0D' : 'transparent',
    },
    testBtnText: { color: colors.glitchCyan, fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'center' },
    scrollModal: { flexGrow: 1, justifyContent: 'center', padding: 20 },
    modalContent: { 
      backgroundColor: colors.surface, 
      padding: 20, 
      borderWidth: 2, 
      borderColor: colors.primary, 
      shadowColor: colors.primary, 
      shadowOpacity: 0.5, 
      shadowRadius: 10 
    },
    modalHeader: { 
      color: colors.white, 
      fontSize: 18, 
      fontFamily: 'monospace', 
      fontWeight: 'bold', 
      marginBottom: 20, 
      textAlign: 'center', 
      borderBottomWidth: 1, 
      borderBottomColor: colors.border, 
      paddingBottom: 10 
    },
    inputGroup: { marginBottom: 15 },
    input: { 
      backgroundColor: colors.inputBg, 
      color: colors.white, 
      padding: 12, 
      borderWidth: 1, 
      borderColor: colors.border, 
      fontFamily: 'monospace' 
    },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    priorityBtn: { 
      flex: 1, 
      padding: 12, 
      borderWidth: 1.5, 
      borderColor: colors.border, 
      alignItems: 'center', 
      marginHorizontal: 2, 
      backgroundColor: isDark ? '#0D0D0D' : colors.surface 
    },
    priorityBtnActive: { 
      backgroundColor: isDark ? '#0D0D0D' : colors.primary, 
      borderColor: colors.primary 
    },
    priorityText: { color: colors.white, fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold' },
    modalActions: { flexDirection: 'row', marginTop: 15 },

    dropdownBtn: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      backgroundColor: colors.inputBg, 
      padding: 12, 
      borderWidth: 1, 
      borderColor: colors.border 
    },
    dropdownBtnText: { color: colors.white, fontFamily: 'monospace' },
    dropdownMenu: { 
      backgroundColor: colors.surface, 
      borderWidth: 1, 
      borderColor: colors.border, 
      borderTopWidth: 0, 
      maxHeight: 180,
    },
    dropdownItem: { 
      padding: 12, 
      borderBottomWidth: 1, 
      borderBottomColor: colors.border 
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
    dropdownItemText: { color: colors.primary, fontFamily: 'monospace' },

    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: colors.textLight, fontFamily: 'monospace', fontSize: 13 },
    emptyResetBtn: { 
      marginTop: 15, 
      padding: 8, 
      borderWidth: 2, 
      borderColor: colors.primary,
      backgroundColor: isDark ? '#0D0D0D' : colors.primary
    },
    emptyResetText: { 
      color: isDark ? colors.primary : '#000000', 
      fontFamily: 'monospace', 
      fontSize: 12,
      fontWeight: 'bold'
    }
  });
};