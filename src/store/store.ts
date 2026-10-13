import { configureStore } from '@reduxjs/toolkit';
import tasksReducer from '../features/tasksSlice';
import authReducer from '../features/authSlice';
import categoriesReducer from '../features/categoriesSlice';

export const store = configureStore({
  reducer: {
    tasks: tasksReducer,
    auth: authReducer,
    categories: categoriesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;