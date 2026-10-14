import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
}

interface SubtasksState {
  list: Subtask[];
  loading: boolean;
}

const initialState: SubtasksState = {
  list: [],
  loading: false,
};

const subtasksSlice = createSlice({
  name: 'subtasks',
  initialState,
  reducers: {
    setSubtasks: (state, action: PayloadAction<Subtask[]>) => {
      state.list = action.payload;
    },
    addSubtask: (state, action: PayloadAction<Subtask>) => {
      state.list.push(action.payload);
    },
    toggleSubtaskStatus: (state, action: PayloadAction<string>) => {
      const item = state.list.find(s => s.id === action.payload);
      if (item) {
        item.is_completed = !item.is_completed;
      }
    },
    deleteSubtask: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter(s => s.id !== action.payload);
    },
  },
});

export const { setSubtasks, addSubtask, toggleSubtaskStatus, deleteSubtask } = subtasksSlice.actions;
export default subtasksSlice.reducer;