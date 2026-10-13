import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, Platform, Modal, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setCategories, addCategory, updateCategory, deleteCategory } from '../features/categoriesSlice';
import { supabase } from '../services/supabase';
import GlitchText from '../components/GlitchText';
import CustomButton from '../components/CustomButton';
import Colors from '../constants/Colors';

const PRESET_COLORS = ['#00FF41', '#00FFFF', '#FF00FF', '#FF003C', '#FFFF00', '#FF9900'];

export default function CategoriesScreen() {
  const { user } = useAppSelector(state => state.auth);
  const categories = useAppSelector(state => state.categories.list);
  const dispatch = useAppDispatch();
  
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  
  // Form State
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState(PRESET_COLORS[0]);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCats = async () => {
      setLoading(true);
      const { data } = await supabase.from('categories').select('*').eq('user_id', user?.id).order('created_at', { ascending: true });
      if (data) dispatch(setCategories(data));
      setLoading(false);
    };
    if (user?.id) fetchCats();
  }, [user]);

  // Mở Popup Thêm mới
  const openAddModal = () => {
    setEditId(null);
    setCatName('');
    setCatColor(PRESET_COLORS[0]);
    setModalVisible(true);
  };

  // Mở Popup Chỉnh sửa
  const openEditModal = (id: string, name: string, color: string) => {
    setEditId(id);
    setCatName(name);
    setCatColor(color || PRESET_COLORS[0]);
    setModalVisible(true);
  };

  // Lưu dữ liệu (Thêm mới hoặc Cập nhật)
  const handleSave = async () => {
    if (!catName.trim() || !user?.id) {
      if (Platform.OS === 'web') window.alert('SYS_ERR: Tên danh mục không được để trống.');
      else Alert.alert('SYS_ERR', 'Tên danh mục không được để trống.');
      return;
    }
    setLoading(true);

    if (editId) {
      // CẬP NHẬT
      const { data, error } = await supabase.from('categories').update({ name: catName, color: catColor }).eq('id', editId).select();
      if (error) {
        if (Platform.OS === 'web') window.alert(`SYS_ERR: ${error.message}`);
        else Alert.alert('SYS_ERR', error.message);
      } else {
        dispatch(updateCategory(data[0]));
        setModalVisible(false);
      }
    } else {
      // THÊM MỚI
      const { data, error } = await supabase.from('categories').insert([{ name: catName, color: catColor, user_id: user.id }]).select();
      if (error) {
        if (Platform.OS === 'web') window.alert(`SYS_ERR: ${error.message}`);
        else Alert.alert('SYS_ERR', error.message);
      } else {
        dispatch(addCategory(data[0]));
        setModalVisible(false);
      }
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    dispatch(deleteCategory(id));
    await supabase.from('categories').delete().eq('id', id);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>{'< SYS_HOME'}</Text>
        </TouchableOpacity>
        <GlitchText text="CATEGORIES" fontSize={24} />
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.catItem}>
            <View style={styles.catInfo}>
              <View style={[styles.catColorIndicator, { backgroundColor: item.color || Colors.primary }]} />
              <Text style={styles.catName}>{item.name}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => openEditModal(item.id, item.name, item.color)}>
                <Text style={styles.editText}>[ EDIT ]</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={styles.deleteText}>[ DEL ]</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <View style={styles.fabContainer}>
        <CustomButton title="ADD_NEW_CATEGORY" onPress={openAddModal} />
      </View>

      {/* POPUP THÊM / SỬA DANH MỤC */}
      <Modal visible={isModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.scrollModal} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Text style={styles.modalHeader}>{editId ? 'EDIT_CATEGORY //' : 'NEW_CATEGORY //'}</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CATEGORY_NAME //:</Text>
                <TextInput 
                  style={styles.input} 
                  value={catName} 
                  onChangeText={setCatName} 
                  placeholder="Học tập, Công việc..." 
                  placeholderTextColor={Colors.textLight} 
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>COLOR_THEME //:</Text>
                <View style={styles.colorPicker}>
                  {PRESET_COLORS.map(c => (
                    <TouchableOpacity 
                      key={c} 
                      style={[styles.colorCircle, { backgroundColor: c }, catColor === c && styles.colorCircleActive]} 
                      onPress={() => setCatColor(c)} 
                    />
                  ))}
                </View>
              </View>

              <View style={styles.modalActions}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <CustomButton title="CANCEL" variant="outline" onPress={() => setModalVisible(false)} />
                </View>
                <View style={{ flex: 1 }}>
                  <CustomButton title="SAVE" onPress={handleSave} loading={loading} />
                </View>
              </View>
              
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  link: { color: Colors.primary, fontFamily: 'monospace', fontWeight: 'bold' },
  
  catItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  catInfo: { flexDirection: 'row', alignItems: 'center' },
  catColorIndicator: { width: 12, height: 12, marginRight: 10 },
  catName: { color: Colors.white, fontFamily: 'monospace', fontSize: 16 },
  actions: { flexDirection: 'row' },
  editText: { color: Colors.glitchCyan, fontFamily: 'monospace', fontWeight: 'bold', marginRight: 15 },
  deleteText: { color: Colors.danger, fontFamily: 'monospace', fontWeight: 'bold' },
  
  fabContainer: { position: 'absolute', bottom: 30, left: 20, right: 20 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.85)', justifyContent: 'center' },
  scrollModal: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: Colors.surface, padding: 20, borderWidth: 1, borderColor: Colors.primary, shadowColor: Colors.primary, shadowOpacity: 0.5, shadowRadius: 10 },
  modalHeader: { color: Colors.white, fontSize: 18, fontFamily: 'monospace', fontWeight: 'bold', marginBottom: 20, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: Colors.textLight, paddingBottom: 10 },
  
  inputGroup: { marginBottom: 20 },
  label: { color: Colors.primary, fontFamily: 'monospace', fontSize: 14, marginBottom: 10 },
  input: { backgroundColor: Colors.background, color: Colors.white, padding: 15, borderWidth: 1, borderColor: Colors.border, fontFamily: 'monospace' },
  
  colorPicker: { flexDirection: 'row', justifyContent: 'space-between' },
  colorCircle: { width: 35, height: 35, borderRadius: 17.5, opacity: 0.4 },
  colorCircleActive: { opacity: 1, borderWidth: 2, borderColor: Colors.white },
  
  modalActions: { flexDirection: 'row', marginTop: 10 }
});