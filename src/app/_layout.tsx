import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import { supabase } from '../services/supabase';
import { useAppDispatch } from '../store/hooks';
import { setSession, clearSession } from '../features/authSlice';

// Component khôi phục phiên bản ghi
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // 1. Kiểm tra session ngay khi khởi động app hoặc khi Hot Reload
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Phục hồi trạng thái vào Redux
        dispatch(setSession({ id: session.user.id, email: session.user.email || '' }));
      } else {
        dispatch(clearSession());
        router.replace('/login' as any);
      }
    };
    checkAuth();

    // 2. Lắng nghe thay đổi (Đăng xuất / Đăng nhập) từ Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        dispatch(setSession({ id: session.user.id, email: session.user.email || '' }));
      } else if (event === 'SIGNED_OUT') {
        dispatch(clearSession());
        router.replace('/login' as any);
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AuthInitializer>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="calendar" />
          <Stack.Screen name="categories" />
        </Stack>
      </AuthInitializer>
    </Provider>
  );
}