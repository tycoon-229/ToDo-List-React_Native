import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  email: string;
}

export interface Profile {
  username: string;
  bio: string;
  avatar_url: string;
  cover_url: string;
}

interface AuthState {
  user: User | null;
  profile: Profile;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  profile: {
    username: '',
    bio: '',
    avatar_url: 'https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif',
    cover_url: 'https://media.giphy.com/media/3o7TKTDnUxE0g2fSE8/giphy.gif',
  },
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    setProfile: (state, action: PayloadAction<Partial<Profile>>) => {
      state.profile = { ...state.profile, ...action.payload };
    },
    clearSession: (state) => {
      state.user = null;
      state.profile = initialState.profile;
      state.isAuthenticated = false;
    },
  },
});

export const { setSession, setProfile, clearSession } = authSlice.actions;
export default authSlice.reducer;