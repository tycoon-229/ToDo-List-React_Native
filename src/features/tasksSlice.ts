import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  due_date?: string;
  user_id?: string;
  category_id?: string | null;
  tags?: string;
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
    deleteTask: (state, action: PayloadAction<string>) => {
      state.tasksList = state.tasksList.filter(t => t.id !== action.payload);
    },
  },
});

export const { setTasks, addTask, updateTask, toggleTaskStatus, deleteTask } = tasksSlice.actions;
export default tasksSlice.reducer;