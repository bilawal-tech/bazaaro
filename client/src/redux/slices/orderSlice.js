import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';


//create order
export const createOrder = createAsyncThunk(
  'orders/create',
  async (orderData, { rejectWithValue }) => {
    try {
      const { data } = await API.post('/orders', orderData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create order'
      );
    }
  }
);

//get my orders
export const getMyOrders = createAsyncThunk(
  'orders/getMyOrders',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10 } = params;
      const { data } = await API.get(
        `/orders/my?page=${page}&limit=${limit}`
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch orders'
      );
    }
  }
);

//get single order
export const getSingleOrder = createAsyncThunk(
  'orders/getSingle',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await API.get(`/orders/${id}`);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch order'
      );
    }
  }
);

//cancel order
export const cancelOrder = createAsyncThunk(
  'orders/cancel',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await API.put(`/orders/${id}/cancel`);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to cancel order'
      );
    }
  }
);

//get all orders - admin
export const getAllOrders = createAsyncThunk(
  'orders/getAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, status } = params;
      let url = `/orders?page=${page}&limit=${limit}`;
      if (status) url += `&status=${status}`;
      const { data } = await API.get(url);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch orders'
      );
    }
  }
);

//update order status - admin
export const updateOrderStatus = createAsyncThunk(
  'orders/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const { data } = await API.put(
        `/orders/${id}/status`,
        { status }
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update status'
      );
    }
  }
);


const initialState = {
  orders:       [],    //orders list (my orders or all orders for admin)
  order:        null,  // Single order detail
  loading:      false,
  error:        null,
  success:      false,
  totalOrders:  0,
  totalPages:   1,
  currentPage:  1,
  totalRevenue: 0,     // Admin ke liye
};



const orderSlice = createSlice({
  name: 'orders',
  initialState,


  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    clearOrder: (state) => {
      state.order = null;
    },
  },

  extraReducers: (builder) => {

    //create order
    builder
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.order   = action.payload.order;
       //unshift array ka start meein new order add karo
       //latest order sabse pehle dikhe
        state.orders.unshift(action.payload.order);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      })

    //Get My Orders 
    builder
      .addCase(getMyOrders.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(getMyOrders.fulfilled, (state, action) => {
        state.loading     = false;
        state.orders      = action.payload.orders;
        state.totalOrders = action.payload.total;
        state.totalPages  = action.payload.pages;
        state.currentPage = action.payload.page;
      })
      .addCase(getMyOrders.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      })

    //Get Single Order
    builder
      .addCase(getSingleOrder.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(getSingleOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.order   = action.payload.order;
      })
      .addCase(getSingleOrder.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      })

    // Cancel Order
    builder
      .addCase(cancelOrder.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // DSA: Array.map O(n) — cancelled order update karo
        //order list mein se jis order ko cancel kiya usko update karo
        state.orders  = state.orders.map(order =>
          order._id === action.payload.order._id
            ? action.payload.order
            : order
        );
        state.order = action.payload.order;
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      })

    // Get All Orders — Admin
    builder
      .addCase(getAllOrders.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(getAllOrders.fulfilled, (state, action) => {
        state.loading      = false;
        state.orders       = action.payload.orders;
        state.totalOrders  = action.payload.total;
        state.totalPages   = action.payload.pages;
        state.currentPage  = action.payload.page;
        state.totalRevenue = action.payload.totalRevenue;
      })
      .addCase(getAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      })

    // Update Order Status — Admin
    builder
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // DSA: Array.map O(n) — updated order replace karo
        state.orders  = state.orders.map(order =>
          order._id === action.payload.order._id
            ? action.payload.order
            : order
        );
        state.order = action.payload.order;
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      })
  },
});


export const {
  clearError,
  clearSuccess,
  clearOrder,
} = orderSlice.actions;


export const selectOrders      = (state) => state.orders.orders;
export const selectOrder       = (state) => state.orders.order;
export const selectOrderLoading= (state) => state.orders.loading;
export const selectOrderError  = (state) => state.orders.error;
export const selectOrderSuccess= (state) => state.orders.success;
export const selectTotalOrders = (state) => state.orders.totalOrders;
export const selectTotalPages  = (state) => state.orders.totalPages;
export const selectTotalRevenue= (state) => state.orders.totalRevenue;
export const selectCurrentPage = (state) => state.orders.currentPage;

export default orderSlice.reducer;