import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import API from "../../services/api";


export const getAllProducts = createAsyncThunk(
    'products/getAll',
    async (filters = {}, { rejectWithValue }) => {
        try {
            // Construct query parameters based on filters
            // URLSearchParams is a built-in utility to handle query strings
            // We check each filter and append(attach this) it to the params if it exists
            const params = new URLSearchParams;
            if (filters.category) params.append('category', filters.category);
            if (filters.minPrice) params.append('minprice', filters.minPrice);
            if (filters.maxPrice) params.append('maxprice', filters.maxPrice);
            if (filters.search) params.append('search', filters.search);
            if (filters.sort) params.append('sortby', filters.sort);
            if (filters.inStock) params.append('instock', filters.inStock);
            params.append('page', filters.page || 1);
            params.append('limit', filters.limit || 10);
            const { data } = await API.get(`/products?${params.toString()}`);
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to fetch products'
            );

        }
    }
)

export const getSingleProduct = createAsyncThunk(
    'products/getSingle',
    async (id, { rejectWithValue }) => {
        try {
            const { data } = await API.get(`/products/${id}`);
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to fetch product'
            );
        }
    }
)

export const createProduct = createAsyncThunk(
    'products/create',
    async (productData, { rejectWithValue }) => {
        try {
            const { data } = await API.post('/products', productData);
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to create product'
            );
        }
    }
)

export const updateProduct = createAsyncThunk(
    'products/update',
    async ({ id, productData }, { rejectWithValue }) => {
        try {
            const { data } = await API.put(`/products/${id}`, productData);
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to update product'
            );
        }
    }
)

export const deleteProduct = createAsyncThunk(
    'products/delete',
    async (id, { rejectWithValue }) => {
        try {
            await API.delete(`/products/${id}`);
            // We return the id of the deleted product so we can remove it from the state in the reducer
            return id;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to delete product'
            );
        }
    }
)

export const addReview = createAsyncThunk(
    'products/addReview',
    async ({ productId, reviewData }, { rejectWithValue }) => {
        try {
            const { data } = await API.post(`/products/${productId}/reviews`, reviewData);
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to add review'
            );
        }
    }
)


const initialState = {
    products: [],      // List of products on website
    product: null,    // single product details for product page
    loading: false,
    error: null,
    success: false,
    totalProducts: 0,
    currentPage: 1,
    totalPages: 1,
};

export const productSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        clearSuccess: (state) => {
            state.success = false;
        },
        clearError: (state) => {
            state.error = null;
        },
        clearProduct: (state) => {
            state.product = null;
        },
    },
    extraReducers: (builder) => {
       
       //getAllProducts action
        builder
            .addCase(getAllProducts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllProducts.fulfilled, (state, action) => {
                state.loading = false;
                state.products = action.payload.products;
                state.totalProducts = action.payload.total;
                state.currentPage = action.payload.page;
                state.totalPages = action.payload.pages;
            }
            )
            .addCase(getAllProducts.rejected,(state, action) =>{
                state.loading = false;
                state.error = action.payload;
            })



//getSingleProduct action
            builder
            .addCase(getSingleProduct.pending, (state)=>{
                state.loading = true;
                state.error = null;
                state.product = null;
            })
            .addCase(getSingleProduct.fulfilled,(state, action) => {
                state.loading = false;
                state.product = action.payload.product; 
            }
        )
            .addCase(getSingleProduct.rejected,(state, action) => {
                state.loading = false;
                state.error = action.payload;
            })



        //createProduct action
            builder
            .addCase(createProduct.pending,(state)=>{
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(createProduct.fulfilled,(state,action)=>{
                state.loading = false;
                state.success = true;
                state.products.push(action.payload.product);
            })  
            .addCase(createProduct.rejected,(state,action)=>{
                state.loading = false;
                state.error = action.payload;
            })


//updateProduct action
            builder
            .addCase(updateProduct.pending,(state)=>{
                state.loading = true;
                state.error = null;
                state.success = false;
            }
            )
            .addCase(updateProduct.fulfilled,(state,action)=>{
                state.loading = false;
                state.success = true;
                // map through the products and update the one that matches the updated product's id
                state.products = state.products.map(product =>
                    product._id === action.payload.product._id
                    ? action.payload.product //if the product id matches, we replace it with the updated product from the payload
                    : product //otherwise we keep the existing product
                )
            })
            .addCase(updateProduct.rejected,(state,action)=>{
                state.loading = false;
                state.error = action.payload;
            })



        //deleteProduct action
            builder
            .addCase(deleteProduct.pending,(state)=>{
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(deleteProduct.fulfilled,(state,action)=>{
                state.loading = false;
                state.success = true;
                // We filter out the deleted product from the products array in the state
                state.products = state.products.filter(product => product._id !== action.payload);
            })
            .addCase(deleteProduct.rejected,(state,action)=>{
                state.loading = false;
                state.error = action.payload;
            })
       

        //addReview action
         builder
      .addCase(addReview.pending, (state) => {
        state.loading = true;
      })
      .addCase(addReview.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(addReview.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      })
    },

});


export const { clearSuccess, clearError, clearProduct } = productSlice.actions;
export const selectProducts     = (state) => state.products.products;
export const selectProduct      = (state) => state.products.product;
export const selectLoading      = (state) => state.products.loading;
export const selectError        = (state) => state.products.error;
export const selectSuccess      = (state) => state.products.success;
export const selectTotalPages   = (state) => state.products.totalPages;
export const selectCurrentPage  = (state) => state.products.currentPage;
export const selectTotalProducts= (state) => state.products.totalProducts;

export default productSlice.reducer;