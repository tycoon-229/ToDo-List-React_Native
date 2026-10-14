import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  due_date?: string;
  reminder_time?: string;
  category_id?: string | null;
  tags?: string;
  recurrence?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  streak?: number;
  is_deleted?: boolean;      // Đánh dấu nằm trong thùng rác
  deleted_at?: string | null; // Thời điểm xóa mềm
  user_id?: string;
}

interface TasksState {
  tasksList: Task[];
  loading: boolean;
}

const initialState: TasksState = {
  tasksList: [],
  loading: false,
};

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasksList = action.payload;
    },
    addTask: (state, action: PayloadAction<Task>) => {
      state.tasksList.unshift(action.payload);
    },
    updateTask: (state, action: PayloadAction<Task>) => {
      const index = state.tasksList.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.tasksList[index] = action.payload;
      }
    },
    toggleTaskStatus: (state, action: PayloadAction<string>) => {
      const task = state.tasksList.find(t => t.id === action.payload);
      if (task) {
        task.status = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
      }
    },
    // Xóa mềm: đưa vào thùng rác
    softDeleteTask: (state, action: PayloadAction<{ id: string; deleted_at: string }>) => {
      const task = state.tasksList.find(t => t.id === action.payload.id);
      if (task) {
        task.is_deleted = true;
        task.deleted_at = action.payload.deleted_at;
      }
    },
    // Khôi phục từ thùng rác
    restoreTask: (state, action: PayloadAction<string>) => {
      const task = state.tasksList.find(t => t.id === action.payload);
      if (task) {
        task.is_deleted = false;
        task.deleted_at = null;
      }
    },
    // Xóa vĩnh viễn 1 task
    purgeTask: (state, action: PayloadAction<string>) => {
      state.tasksList = state.tasksList.filter(t => t.id !== action.payload);
    },
    // Dọn sạch thùng rác
    purgeAllDeleted: (state) => {
      state.tasksList = state.tasksList.filter(t => !t.is_deleted);
    },
  },
});

export const { 
  setTasks, 
  addTask, 
  updateTask, 
  toggleTaskStatus, 
  softDeleteTask, 
  restoreTask, 
  purgeTask, 
  purgeAllDeleted 
} = tasksSlice.actions;

export default tasksSlice.reducer;