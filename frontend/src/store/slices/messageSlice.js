import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api.js';

// Fetch messages for a gig
export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async (gigId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/messages/${gigId}`);
      return { gigId, messages: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

// Send a message
export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ gigId, content, type = 'text', fileUrl }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/messages/${gigId}`, {
        content,
        type,
        fileUrl,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

// Mark message as read
export const markMessageAsRead = createAsyncThunk(
  'messages/markMessageAsRead',
  async (messageId, { rejectWithValue }) => {
    try {
      await api.patch(`/messages/${messageId}/read`);
      return messageId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark message as read');
    }
  }
);

const messageSlice = createSlice({
  name: 'messages',
  initialState: {
    messagesByGigId: {}, // { gigId: [messages] }
    loading: false,
    error: null,
    typingUsers: {}, // { gigId: { userId: userName } }
  },
  reducers: {
    // Add message from Socket.io (real-time)
    addMessage: (state, action) => {
      const { gigId, message } = action.payload;
      if (!state.messagesByGigId[gigId]) {
        state.messagesByGigId[gigId] = [];
      }
      // Check if message already exists (prevent duplicates)
      const exists = state.messagesByGigId[gigId].some(m => m._id === message._id);
      if (!exists) {
        state.messagesByGigId[gigId].push(message);
      }
    },
    // Update message read status (from Socket.io)
    updateMessageRead: (state, action) => {
      const { gigId, messageId, readBy } = action.payload;
      const messages = state.messagesByGigId[gigId];
      if (messages) {
        const message = messages.find(m => m._id === messageId);
        if (message && !message.readBy.includes(readBy)) {
          message.readBy.push(readBy);
        }
      }
    },
    // Set typing user
    setTypingUser: (state, action) => {
      const { gigId, userId, userName } = action.payload;
      if (!state.typingUsers[gigId]) {
        state.typingUsers[gigId] = {};
      }
      state.typingUsers[gigId][userId] = userName;
    },
    // Remove typing user
    removeTypingUser: (state, action) => {
      const { gigId, userId } = action.payload;
      if (state.typingUsers[gigId]) {
        delete state.typingUsers[gigId][userId];
      }
    },
    // Clear messages for a gig
    clearMessages: (state, action) => {
      const gigId = action.payload;
      delete state.messagesByGigId[gigId];
      delete state.typingUsers[gigId];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        const { gigId, messages } = action.payload;
        state.messagesByGigId[gigId] = messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        const message = action.payload;
        const gigId = message.gigId;
        if (!state.messagesByGigId[gigId]) {
          state.messagesByGigId[gigId] = [];
        }
        // Check if message already exists (prevent duplicates)
        const exists = state.messagesByGigId[gigId].some(m => m._id === message._id);
        if (!exists) {
          state.messagesByGigId[gigId].push(message);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Mark message as read
      .addCase(markMessageAsRead.fulfilled, (state, action) => {
        // Message read status will be updated via Socket.io
        // This is just for the API call completion
      });
  },
});

export const {
  addMessage,
  updateMessageRead,
  setTypingUser,
  removeTypingUser,
  clearMessages,
  clearError,
} = messageSlice.actions;

export default messageSlice.reducer;

