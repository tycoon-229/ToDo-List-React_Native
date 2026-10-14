import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { restoreTask, purgeTask, purgeAllDeleted } from '../features/tasksSlice';
import { supabase } from '../services/supabase';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from '../hooks/useTranslation';
import { ColorPalette } from '../constants/Colors';
import GlitchText from '../components/GlitchText';

export default function QuarantineScreen() {
  const colors = useThemeColors();
  const t = useTranslation();
  const dispatch = useAppDispatch();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const isDark = colors.background === '#0D0D0D';

  const { user } = useAppSelector(state => state.auth);
  const allTasks = useAppSelector(state => state.tasks.tasksList);
  const categoriesList = useAppSelector(state => state.categories.list);

  const quarantinedTasks = useMemo(() => {
    return allTasks.filter(item => item.is_deleted === true);
  }, [allTasks]);

  const handleRestore = async (id: string) => {
    dispatch(restoreTask(id));
    await supabase
      .from('tasks')
      .update({ is_deleted: false, deleted_at: null })
      .eq('id', id);

    if (Platform.OS === 'web') {
      window.alert('RESTORED_COMPLETE: Nhiệm vụ đã được phục hồi về danh sách chính.');
    }
  };

  const handlePurgeSingle = async (id: string) => {
    const confirm = Platform.OS === 'web'
      ? window.confirm('CẢNH BÁO: Hành động này sẽ tiêu hủy vĩnh viễn node dữ liệu này. Không thể đảo ngược!')
      : true;

    if (!confirm) return;

    dispatch(purgeTask(id));
    await supabase.from('tasks').delete().eq('id', id);
  };

  const handlePurgeAll = async () => {
    if (quarantinedTasks.length === 0) return;

    const confirm = Platform.OS === 'web'
      ? window.confirm(`CẢNH BÁO KHẨN CẤP: Tiêu hủy toàn bộ ${quarantinedTasks.length} nhiệm vụ trong vùng cách ly?`)
      : true;

    if (!confirm) return;

    dispatch(purgeAllDeleted());
    await supabase
      .from('tasks')
      .delete()
      .eq('user_id', user?.id)
      .eq('is_deleted', true);

    if (Platform.OS === 'web') {
      window.alert('VAULT_CLEARED: Vùng cách ly đã được làm sạch hoàn toàn.');
    }
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
        <GlitchText text={t.quarantineTitle} fontSize={24} />
      </View>

      <View style={styles.statusBar}>
        <Text style={styles.statusCount}>
          {t.isolatedNodes} {quarantinedTasks.length}
        </Text>
        {quarantinedTasks.length > 0 && (
          <TouchableOpacity style={styles.purgeAllBtn} onPress={handlePurgeAll}>
            <Text style={styles.purgeAllBtnText}>{t.purgeAllVault}</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={quarantinedTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 50 }}
        renderItem={({ item }) => {
          const category = item.category_id ? categoriesList.find(c => c.id === item.category_id) : null;
          const deletedTime = item.deleted_at ? item.deleted_at.replace('T', ' ').substring(0, 16) : 'UNKNOWN';

          return (
            <View style={styles.quarantineCard}>
              <View style={styles.cardHeader}>
                {category && (
                  <View style={[styles.badge, { borderColor: category.color || colors.primary }]}>
                    <Text style={[styles.badgeText, { color: category.color || colors.primary }]}>
                      {category.name}
                    </Text>
                  </View>
                )}
                <Text style={styles.deletedTimestamp}>{t.deletedPrefix} {deletedTime}</Text>
              </View>

              <Text style={styles.taskTitle}>{item.title}</Text>

              {item.description ? (
                <Text style={styles.taskDesc} numberOfLines={2}>{item.description}</Text>
              ) : null}

              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={[styles.restoreBtn, isDark ? styles.btnDark : styles.btnLight]} 
                  onPress={() => handleRestore(item.id)}
                >
                  <Text style={[styles.restoreBtnText, isDark ? styles.btnTextDark : styles.btnTextLight]}>
                    {t.restoreNode}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.purgeBtn} 
                  onPress={() => handlePurgeSingle(item.id)}
                >
                  <Text style={styles.purgeBtnText}>{t.purgeForever}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t.vaultEmpty}</Text>
            <Text style={styles.emptySubText}>{t.vaultEmptySub}</Text>
          </View>
        }
      />
    </View>
  );
}

const getStyles = (colors: ColorPalette) => {
  const isDark = colors.background === '#0D0D0D';

  return StyleSheet.create({
    container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    link: { color: colors.primary, fontFamily: 'monospace', fontWeight: 'bold' },

    statusBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 15,
    },
    statusCount: { color: colors.primary, fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold' },
    purgeAllBtn: { borderWidth: 1, borderColor: colors.danger, paddingHorizontal: 8, paddingVertical: 4 },
    purgeAllBtnText: { color: colors.danger, fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' },

    quarantineCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 14,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    badge: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
    badgeText: { fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold', textTransform: 'uppercase' },
    deletedTimestamp: { color: colors.textLight, fontFamily: 'monospace', fontSize: 10 },

    taskTitle: { color: colors.white, fontFamily: 'monospace', fontSize: 15, fontWeight: 'bold', marginBottom: 6 },
    taskDesc: { color: colors.textLight, fontFamily: 'monospace', fontSize: 11, marginBottom: 12, lineHeight: 16 },

    actionRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 8 },
    restoreBtn: {
      borderWidth: 2,
      borderColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 10,
    },
    btnDark: {
      backgroundColor: '#0D0D0D',
    },
    btnLight: {
      backgroundColor: colors.primary,
    },
    restoreBtnText: {
      fontFamily: 'monospace',
      fontWeight: 'bold',
      fontSize: 11,
    },
    btnTextDark: {
      color: colors.primary,
    },
    btnTextLight: {
      color: '#000000',
    },
    purgeBtn: {
      borderWidth: 1,
      borderColor: colors.danger,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    purgeBtnText: {
      color: colors.danger,
      fontFamily: 'monospace',
      fontWeight: 'bold',
      fontSize: 11,
    },

    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: colors.primary, fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold', marginBottom: 6 },
    emptySubText: { color: colors.textLight, fontFamily: 'monospace', fontSize: 11 }
  });
};