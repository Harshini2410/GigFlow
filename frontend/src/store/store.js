import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import gigReducer from './slices/gigSlice.js';
import bidReducer from './slices/bidSlice.js';
import notificationReducer from './slices/notificationSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    gigs: gigReducer,
    bids: bidReducer,
    notifications: notificationReducer,
  },
});
