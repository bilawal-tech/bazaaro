import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import API from '../../services/api';

//get all category
export const getAllCategories = createAsyncThunk(
    'categories/getAll',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await API.get('/category/all'); 
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to fetch categories'
            );
        }
    }
);

//get single catgeory
export const getSingleCategory = createAsyncThunk(
    'categories/getSingle',
    async (slug, { rejectWithValue }) => {
        try {
            const { data } = await API.get(`/category/${slug}`);
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to fetch category"
            );
        }
    }
);

//create category
export const createCategory = createAsyncThunk(
    'categories/createCategory',
    async (categoryData, { rejectWithValue }) => {
        try {
            const { data } = await API.post('/category/create', categoryData);
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to create the category"
            );
        }
    }
);

//delete catgrory
export const deleteCategory = createAsyncThunk(
    'categories/delete',
    async (id, { rejectWithValue }) => {
        try {
            await API.delete(`/category/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to delete category'
            );
        }
    }
);

const initialState = {
    categories: [],
    category: null,
    loading: false,
    error: null,
    success: false,
};

const categorySlice = createSlice({
    name: 'categories',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearSuccess: (state) => { 
            state.success = false; 
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getAllCategories.pending, (state) => {
                state.loading = true;
            })
            .addCase(getAllCategories.fulfilled, (state, action) => {
                state.loading = false;
               state.categories = action.payload.AllCategories || action.payload.categories || [];
            })
            .addCase(getAllCategories.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        builder
            .addCase(getSingleCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getSingleCategory.fulfilled, (state, action) => {
                state.loading = false;
                state.category = action.payload.category || action.payload;
            })
            .addCase(getSingleCategory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        builder
            .addCase(createCategory.pending, (state) => {
                state.loading = true;
            })
            .addCase(createCategory.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                const newCat = action.payload.category || action.payload;
                if (newCat) state.categories.push(newCat);
            })
            .addCase(createCategory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        builder
            .addCase(deleteCategory.pending, (state) => {
                state.loading = true;
            })
            .addCase(deleteCategory.fulfilled, (state, action) => {
                state.loading = false;
                state.categories = state.categories.filter(
                    cat => cat._id !== action.payload
                );
                state.success = true;
            })
            .addCase(deleteCategory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearError, clearSuccess } = categorySlice.actions;

export const selectCategories = (state) => state.categories.categories;
export const selectCategory = (state) => state.categories.category;
export const selectCatLoading = (state) => state.categories.loading;
export const selectCatError = (state) => state.categories.error;

export default categorySlice.reducer;