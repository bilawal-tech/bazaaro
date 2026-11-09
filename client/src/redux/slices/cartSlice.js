import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

// get cart action
export const getCart = createAsyncThunk(
  'cart/getCart',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.get('/cart');
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch cart'
      );
    }
  }
);

// Add To Cart
export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async (itemData, { rejectWithValue }) => {
    try {
      const { data } = await API.post('/cart', itemData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to add to cart'
      );
    }
  }
);

// Update Cart Item
export const updateCartItem = createAsyncThunk(
  'cart/updateItem',
  async ({ itemId, updateData }, { rejectWithValue }) => {
    try {
      const { data } = await API.put(`/cart/${itemId}`, updateData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update cart'
      );
    }
  }
);

// Remove Cart Item 
export const removeCartItem = createAsyncThunk(
  'cart/removeItem',
  async (itemId, { rejectWithValue }) => {
    try {
      const { data } = await API.delete(`/cart/${itemId}`);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to remove item'
      );
    }
  }
);

// Clear Cart
export const clearCartAsync = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.delete('/cart');
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to clear cart'
      );
    }
  }
);

const initialState = {
  items:         [],   
  totalPrice:    0,    
  totalQuantity: 0,    
  loading:       false,
  error:         null,
  success:       false,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,

  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    // Cart state reset after successful checkout
    resetCart: (state) => {
      state.items         = [];
      state.totalPrice    = 0;
      state.totalQuantity = 0;
      state.error         = null;
    },
    updateItemLocally: (state, action) => {
      const { itemId, quantity } = action.payload;
      const item = state.items.find(i => i._id === itemId);
      if (item) {
        item.quantity = quantity;
        // total recalculate
        state.totalQuantity = state.items.reduce((acc, i) => acc + i.quantity, 0);
        state.totalPrice = state.items.reduce(
          (acc, i) => acc + i.currentProductPrice * i.quantity, 0
        );
      }
    }
  },

  extraReducers: (builder) => {
    // get cart action
    builder
      .addCase(getCart.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(getCart.fulfilled, (state, action) => {
        state.loading       = false;
        state.items         = action.payload.cart.items;
        state.totalPrice    = action.payload.cart.totalPrice;
        state.totalQuantity = action.payload.cart.totalQuantity;
      })
      .addCase(getCart.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      })

    // Add To Cart
    builder
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading       = false;
        state.success       = true;
        state.items         = action.payload.cart.items;
        state.totalPrice    = action.payload.cart.totalPrice;
        state.totalQuantity = action.payload.cart.totalQuantity;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      })

    // Update Cart Item
    builder
      .addCase(updateCartItem.pending, (state) => {
        state.error   = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.loading       = false;
        state.success       = true;
        state.items         = action.payload.cart.items;
        state.totalPrice    = action.payload.cart.totalPrice;
        state.totalQuantity = action.payload.cart.totalQuantity;
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      })

    // remove cart item action
    builder
      .addCase(removeCartItem.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.loading       = false;
        state.success       = true;
        state.items         = action.payload.cart.items;
        state.totalPrice    = action.payload.cart.totalPrice;
        state.totalQuantity = action.payload.cart.totalQuantity;
      })
      .addCase(removeCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      })

    // clear cart action
    builder
      .addCase(clearCartAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(clearCartAsync.fulfilled, (state) => {
        state.loading       = false;
        state.items         = [];
        state.totalPrice    = 0;
        state.totalQuantity = 0;
      })
      .addCase(clearCartAsync.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      })
  },
});

// actions export 
export const {
  clearError,
  clearSuccess,
  resetCart,
  updateItemLocally,
} = cartSlice.actions;

// Selectors export 
export const selectCartItems     = (state) => state.cart.items;
export const selectTotalPrice    = (state) => state.cart.totalPrice;
export const selectTotalQuantity = (state) => state.cart.totalQuantity;
export const selectCartLoading   = (state) => state.cart.loading;
export const selectCartError     = (state) => state.cart.error;

export default cartSlice.reducer;