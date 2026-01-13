import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api.js';

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
  }
);

// Load user on app startup (auth rehydration)
// This MUST be called on app mount to restore auth state from HttpOnly cookie
// Returns 200 with user data if cookie exists, 401 if not logged in
export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      // 401 is expected when not logged in - don't treat as error
      // Only reject for actual failures (network errors, etc.)
      return rejectWithValue(error.response?.data?.message || 'Failed to get user');
    }
  }
);

// Alias for consistency with requirements
export const loadUser = getCurrentUser;

// SINGLE SOURCE OF TRUTH for authentication state
// This slice manages the complete auth lifecycle:
// - On app startup: loadUser() is called to restore auth from HttpOnly cookie
// - While loading: authLoading = true (prevents premature redirects)
// - On success: user is set, isAuthenticated = true
// - On 401: user is cleared, isAuthenticated = false
// - authLoading is ALWAYS set to false after check completes
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    authLoading: true, // Start as true - we need to check auth on mount
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.authLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.authLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.authLoading = false;
        state.error = action.payload;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.authLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.authLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.authLoading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.authLoading = false;
        state.error = null;
      })
      // Get current user (auth rehydration on app startup)
      // This is called on every page refresh to restore auth state from HttpOnly cookie
      .addCase(getCurrentUser.pending, (state) => {
        state.authLoading = true; // Keep loading true while checking
        // DO NOT set isAuthenticated to false here - wait for response
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.authLoading = false; // Auth check completed
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.authLoading = false; // Auth check completed (even if failed)
        state.isAuthenticated = false;
        state.user = null;
        // Don't set error for 401 - it's expected when not logged in
        // Only set error for actual failures (network errors, etc.)
        state.error = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
