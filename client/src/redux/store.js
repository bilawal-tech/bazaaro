import {configureStore} from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import productReducer from './slices/productSlice';
import orderReducer from './slices/orderSlice';
import categoryReducer from './slices/categoryslice';

const store = configureStore({
  reducer: {
    auth: authReducer,  
    cart: cartReducer,
    products: productReducer,
    orders: orderReducer,
    categories : categoryReducer,
  },
});

export default store;