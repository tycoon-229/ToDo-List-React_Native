import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  notificationsEnabled: boolean;
  defaultOffsetMinutes: number; // Số phút báo trước deadline: 15, 30, 60
  notifiedTaskIds: string[];    // Lưu ID các task đã bắn thông báo
}

const initialState: SettingsState = {
  notificationsEnabled: true,
  defaultOffsetMinutes: 15,
  notifiedTaskIds: [],
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
    clearNotifiedHistory: (state) => {
      state.notifiedTaskIds = [];
    },
  },
});

export const { toggleNotifications, setDefaultOffset, markTaskNotified, clearNotifiedHistory } = settingsSlice.actions;
export default settingsSlice.reducer;