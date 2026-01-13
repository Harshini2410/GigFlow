import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api.js';

export const createBid = createAsyncThunk(
  'bids/createBid',
  async (bidData, { rejectWithValue }) => {
    try {
      const response = await api.post('/bids', bidData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create bid');
    }
  }
);

export const fetchBidsByGig = createAsyncThunk(
  'bids/fetchBidsByGig',
  async (gigId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/bids/${gigId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bids');
    }
  }
);

export const fetchMyBids = createAsyncThunk(
  'bids/fetchMyBids',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/bids/my-bids');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch your bids');
    }
  }
);

export const hireFreelancer = createAsyncThunk(
  'bids/hireFreelancer',
  async (bidId, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/bids/${bidId}/hire`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to hire freelancer');
    }
  }
);

const bidSlice = createSlice({
  name: 'bids',
  initialState: {
    bids: [],
    myBids: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    clearBids: (state) => {
      state.bids = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBid.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBid.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myBids.unshift(action.payload);
      })
      .addCase(createBid.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchBidsByGig.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBidsByGig.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bids = action.payload;
      })
      .addCase(fetchBidsByGig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchMyBids.fulfilled, (state, action) => {
        state.myBids = action.payload;
      })
      .addCase(hireFreelancer.fulfilled, (state, action) => {
        // Update bid status in bids array
        const index = state.bids.findIndex(bid => bid._id === action.payload.bid._id);
        if (index !== -1) {
          state.bids[index] = action.payload.bid;
        }
      });
  },
});

export const { clearBids, clearError } = bidSlice.actions;
export default bidSlice.reducer;
