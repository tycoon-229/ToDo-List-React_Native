import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AppTheme = 'CYBER_DARK' | 'CYBER_LIGHT';
export type AppLanguage = 'VI' | 'EN';

interface SettingsState {
  notificationsEnabled: boolean;
  defaultOffsetMinutes: number;
  notifiedTaskIds: string[];
  theme: AppTheme;
  language: AppLanguage;
  timezone: string;
}

const initialState: SettingsState = {
  notificationsEnabled: true,
  defaultOffsetMinutes: 15,
  notifiedTaskIds: [],
  theme: 'CYBER_DARK',
  language: 'VI',
  timezone: 'Asia/Ho_Chi_Minh',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    toggleNotifications: (state) => {
      state.notificationsEnabled = !state.notificationsEnabled;
    },
    setDefaultOffset: (state, action: PayloadAction<number>) => {
      state.defaultOffsetMinutes = action.payload;
    },
    markTaskNotified: (state, action: PayloadAction<string>) => {
      if (!state.notifiedTaskIds.includes(action.payload)) {
        state.notifiedTaskIds.push(action.payload);
      }
    },
    setTheme: (state, action: PayloadAction<AppTheme>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<AppLanguage>) => {
      state.language = action.payload;
    },
    setTimezone: (state, action: PayloadAction<string>) => {
      state.timezone = action.payload;
    },
  },
});

export const { 
  toggleNotifications, 
  setDefaultOffset, 
  markTaskNotified, 
  setTheme, 
  setLanguage, 
  setTimezone 
} = settingsSlice.actions;

export default settingsSlice.reducer;