import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import api from "../../api/axios";
import type { RootState } from "../store";

/* =========================
   TYPES
========================= */

export interface IUser {
  _id: string;
  name: string;
  email: string;
  pjNumber: string; // Matches your Backend Model
  role: "SuperAdmin" | "Admin" | "User";
  accountVerified?: boolean;
  avatar?: string; // We'll store the URL string returned by the backend
  department?: string;
}

interface UserState {
  users: IUser[];
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  users: [],
  loading: false,
  error: null,
};

/* =========================
   THUNKS
========================= */

// GET ALL USERS
export const fetchUsers = createAsyncThunk<IUser[], void, { rejectValue: string }>(
  "users/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/users/get");
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch users");
    }
  }
);

// CREATE USER (Supports Avatar Upload)
export const createUser = createAsyncThunk<IUser, FormData, { rejectValue: string }>(
  "users/createUser",
  async (formData, { rejectWithValue }) => {
    try {
      // Note: No "Content-Type" header needed; Axios sets it automatically for FormData
      const res = await api.post("/users/create", formData);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to create user");
    }
  }
);

// UPDATE USER (Supports Avatar Upload)
export const updateUser = createAsyncThunk<IUser, { id: string; formData: FormData }, { rejectValue: string }>(
  "users/updateUser",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/users/update/${id}`, formData);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to update user");
    }
  }
);

// DELETE USER
export const deleteUser = createAsyncThunk<string, string, { rejectValue: string }>(
  "users/deleteUser",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/users/delete/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete user");
    }
  }
);


// =========================
// UPDATE USER PROFILE (Self)
// =========================
export const updateUserProfile = createAsyncThunk<
  IUser,
  FormData,
  { rejectValue: string }
>(
  "users/updateUserProfile",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await api.put("/users/profile", formData);
      return res.data.user; // backend returns { success, user }
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to update profile");
    }
  }
);


/* =========================
   SLICE
========================= */
const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearUserError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* FETCH USERS */
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<IUser[]>) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* CREATE USER */
      .addCase(createUser.fulfilled, (state, action) => {
        state.users.unshift(action.payload); // Add to top of list
      })

      /* UPDATE USER */
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(u => u._id === action.payload._id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })

      .addCase(updateUserProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(updateUserProfile.fulfilled, (state, action: PayloadAction<IUser>) => {
      state.loading = false;

      // Update user in the list if exists
      const index = state.users.findIndex(u => u._id === action.payload._id);
      if (index !== -1) {
        state.users[index] = action.payload;
      } else {
        // Otherwise, add to the list (optional)
        state.users.unshift(action.payload);
      }
    })
    .addCase(updateUserProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    })

      /* DELETE USER */
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter(u => u._id !== action.payload);
      });
  },
});

export const { clearUserError } = userSlice.actions;
export default userSlice.reducer;

/* =========================
   SELECTORS
========================= */
export const selectAllUsers = (state: RootState) => state.users.users;
export const selectUsersLoading = (state: RootState) => state.users.loading;
export const selectUsersError = (state: RootState) => state.users.error;