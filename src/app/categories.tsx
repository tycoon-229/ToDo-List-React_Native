import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, Platform, Modal, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setCategories, addCategory, updateCategory, deleteCategory } from '../features/categoriesSlice';
import { supabase } from '../services/supabase';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from '../hooks/useTranslation';
import { ColorPalette } from '../constants/Colors';
import GlitchText from '../components/GlitchText';
import CustomButton from '../components/CustomButton';

const PRESET_COLORS = ['#00FF41', '#04cfcf', '#FF00FF', '#FF003C', '#868686', '#FF9900'];

export default function CategoriesScreen() {
  const colors = useThemeColors();
  const t = useTranslation();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const { user } = useAppSelector(state => state.auth);
  const categories = useAppSelector(state => state.categories.list);
  const dispatch = useAppDispatch();
  
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  
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

  const openAddModal = () => {
    setEditId(null);
    setCatName('');
    setCatColor(PRESET_COLORS[0]);
    setModalVisible(true);
  };

  const openEditModal = (id: string, name: string, color: string) => {
    setEditId(id);
    setCatName(name);
    setCatColor(color || PRESET_COLORS[0]);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!catName.trim() || !user?.id) {
      if (Platform.OS === 'web') window.alert('SYS_ERR: Tên danh mục không được để trống.');
      else Alert.alert('SYS_ERR', 'Tên danh mục không được để trống.');
      return;
    }
    setLoading(true);

    if (editId) {
      const { data, error } = await supabase.from('categories').update({ name: catName, color: catColor }).eq('id', editId).select();
      if (error) {
        if (Platform.OS === 'web') window.alert(`SYS_ERR: ${error.message}`);
        else Alert.alert('SYS_ERR', error.message);
      } else {
        dispatch(updateCategory(data[0]));
        setModalVisible(false);
      }
    } else {
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

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/' as any);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.link}>{t.backHome}</Text>
        </TouchableOpacity>
        <GlitchText text={t.categoriesTitle} fontSize={24} />
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.catItem}>
            <View style={styles.catInfo}>
              <View style={[styles.catColorIndicator, { backgroundColor: item.color || colors.primary }]} />
              <Text style={styles.catName}>{item.name}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => openEditModal(item.id, item.name, item.color)}>
                <Text style={styles.editText}>[ {t.edit} ]</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={styles.deleteText}>[ {t.del} ]</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <View style={styles.fabContainer}>
        <CustomButton title={t.addNewCategory} onPress={openAddModal} />
      </View>

      <Modal visible={isModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.scrollModal} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Text style={styles.modalHeader}>
                {editId ? t.editCategoryHeader : t.newCategoryHeader}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t.categoryNameLabel}</Text>
                <TextInput 
                  style={styles.input} 
                  value={catName} 
                  onChangeText={setCatName} 
                  placeholder={t.categoryNamePlaceholder} 
                  placeholderTextColor={colors.textLight} 
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t.colorThemeLabel}</Text>
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
                  <CustomButton title={t.cancel} variant="outline" onPress={() => setModalVisible(false)} />
                </View>
                <View style={{ flex: 1 }}>
                  <CustomButton title={t.save} onPress={handleSave} loading={loading} />
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: ColorPalette) => StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  link: { color: colors.primary, fontFamily: 'monospace', fontWeight: 'bold' },
  
  catItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  catInfo: { flexDirection: 'row', alignItems: 'center' },
  catColorIndicator: { width: 12, height: 12, marginRight: 10 },
  catName: { color: colors.white, fontFamily: 'monospace', fontSize: 16 },
  actions: { flexDirection: 'row' },
  editText: { color: colors.glitchCyan, fontFamily: 'monospace', fontWeight: 'bold', marginRight: 15 },
  deleteText: { color: colors.danger, fontFamily: 'monospace', fontWeight: 'bold' },
  
  fabContainer: { position: 'absolute', bottom: 30, left: 20, right: 20 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'center' },
  scrollModal: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: colors.surface, padding: 20, borderWidth: 2, borderColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.5, shadowRadius: 10 },
  modalHeader: { color: colors.white, fontSize: 18, fontFamily: 'monospace', fontWeight: 'bold', marginBottom: 20, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10 },
  
  inputGroup: { marginBottom: 20 },
  label: { color: colors.primary, fontFamily: 'monospace', fontSize: 14, marginBottom: 10 },
  input: { backgroundColor: colors.inputBg, color: colors.white, padding: 15, borderWidth: 1, borderColor: colors.border, fontFamily: 'monospace' },
  
  colorPicker: { flexDirection: 'row', justifyContent: 'space-between' },
  colorCircle: { width: 35, height: 35, borderRadius: 17.5, opacity: 0.4 },
  colorCircleActive: { opacity: 1, borderWidth: 2, borderColor: colors.white },
  
  modalActions: { flexDirection: 'row', marginTop: 10 }
});