import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Category {
  id: string;
  name: string;
  color: string;
}

interface CategoriesState {
  list: Category[];
}

const initialState: CategoriesState = { list: [] };

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    setCategories: (state, action: PayloadAction<Category[]>) => {
      state.list = action.payload;
    },
    addCategory: (state, action: PayloadAction<Category>) => {
      state.list.push(action.payload);
    },
    updateCategory: (state, action: PayloadAction<Category>) => {
      const index = state.list.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.list[index] = action.payload;
      }
    },
    deleteCategory: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter(c => c.id !== action.payload);
    },
  },
});

export const { setCategories, addCategory, updateCategory, deleteCategory } = categoriesSlice.actions;
export default categoriesSlice.reducer;