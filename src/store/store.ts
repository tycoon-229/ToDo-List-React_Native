import { configureStore } from '@reduxjs/toolkit';
import tasksReducer from '../features/tasksSlice';
import authReducer from '../features/authSlice';
import categoriesReducer from '../features/categoriesSlice';
import settingsReducer from '../features/settingsSlice';
import subtasksReducer from '../features/subtasksSlice';

export const store = configureStore({
  reducer: {
    tasks: tasksReducer,
    auth: authReducer,
    categories: categoriesReducer,
    settings: settingsReducer,
    subtasks: subtasksReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;