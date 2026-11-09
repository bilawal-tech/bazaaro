import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

//register action
export const registerUser = createAsyncThunk(
    // key for the action type
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await API.post('/auth/register', userData)
      // Save user data to localStorage;
      //authuser me ek object hai jisme token aur user info hoti hai
      localStorage.setItem('authUser', JSON.stringify(data));
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Register failed'
      );
    }
  }
);

//login action
export const loginUser = createAsyncThunk(
  'auth/login',
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await API.post('/auth/login', userData);
      localStorage.setItem('authUser', JSON.stringify(data));
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Login failed'
      );
    }
  }
);

//getProfile action
export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.get('/auth/profile');
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to get profile'
      );
    }
  }
);

//updateProfile action
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await API.put('/auth/profile', userData);
      localStorage.setItem('authUser', JSON.stringify(data));
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Update failed'
      );
    }
  }
);


const initialState = {
  user:    JSON.parse(localStorage.getItem('authUser') || 'null'),
  loading: false,
  error:   null,
  success: false,
};


const authSlice = createSlice({
  name: 'auth',
  initialState,

  reducers: {

    
    logout: (state) => {
      state.user    = null;
      state.error   = null;
      state.success = false;
      localStorage.removeItem('authUser');
    },

    // Error clear
    clearError: (state) => {
      state.error = null;
    },

    // Success clear 
    clearSuccess: (state) => {
      state.success = false;
    },
  },

  //async actions
  extraReducers: (builder) => {
    builder
    //register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error   = null;
        state.success = false; // ✅ Naya Add Kiya: Purani success clear karna zaroori hai
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.user    = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
        state.success = false;
      })

    //Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error   = null;
        state.success = false; // ✅ Naya Add Kiya: Takay naye request par pichla impact khatam ho
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.user    = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
        state.success = false;
      })

    //Get Profile
    builder
      .addCase(getProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user    = action.payload.user;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      })

    //updated profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error   = null;
        state.success = false;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.user    = action.payload.user;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
        state.success = false;
      })
  },
});

//Actions Export for navbar and other components to dispatch
export const { logout, clearError, clearSuccess } = authSlice.actions;

//Selectors Export for different components to access the state
export const selectUser    = (state) => state.auth.user;
export const selectLoading = (state) => state.auth.loading;
export const selectError   = (state) => state.auth.error;
export const selectSuccess = (state) => state.auth.success;

export default authSlice.reducer;