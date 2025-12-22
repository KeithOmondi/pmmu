import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import api from "../../api/axios";
import type { RootState } from "../store";

/* ============================================================
   📦 Types
============================================================ */

export interface ICategory {
  _id: string;
  code: string;
  title: string;
  parent?: string | null;
  parentCode?: string | null;
  level: 1 | 2 | 3 | 4;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryHierarchy {
  [code: string]: ICategory[];
}

interface CategoryState {
  categories: ICategory[];
  selected: ICategory | null;
  hierarchy: CategoryHierarchy;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

/* ============================================================
   🔸 Async Thunks
============================================================ */

// Fetch all categories
export const fetchCategories = createAsyncThunk<
  ICategory[],
  void,
  { rejectValue: string }
>("category/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/category/get");
    return data.categories ?? [];
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to load categories"
    );
  }
});

// Fetch category by ID
export const fetchCategoryById = createAsyncThunk<
  ICategory | null,
  string,
  { rejectValue: string }
>("category/fetchById", async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/category/get/${id}`);
    return data.category ?? null;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to load category"
    );
  }
});

// Fetch hierarchy by code
export const fetchCategoryHierarchy = createAsyncThunk<
  { code: string; hierarchy: ICategory[] },
  string,
  { rejectValue: string }
>("category/fetchHierarchy", async (code, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/category/sub/${code}`);
    return { code, hierarchy: data ?? [] };
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to load category hierarchy"
    );
  }
});

// Create category
export const createCategory = createAsyncThunk<
  ICategory | null,
  Partial<ICategory>,
  { rejectValue: string }
>("category/create", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/category/create", payload);
    return data.category ?? null;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to create category"
    );
  }
});

// Update category
export const updateCategory = createAsyncThunk<
  ICategory | null,
  { id: string; updates: Partial<ICategory> },
  { rejectValue: string }
>("category/update", async ({ id, updates }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/category/update/${id}`, updates);
    return data.category ?? null;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to update category"
    );
  }
});

// Delete category
export const deleteCategory = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("category/delete", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/category/delete/${id}`);
    return id;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to delete category"
    );
  }
});

/* ============================================================
   ⚙️ Slice
============================================================ */

const initialState: CategoryState = {
  categories: [],
  selected: null,
  hierarchy: {},
  loading: false,
  error: null,
  successMessage: null,
};

const categorySlice = createSlice({
  name: "category",
  initialState,
  reducers: {
    clearCategoryState(state) {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH ALL
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchCategories.fulfilled,
        (state, action: PayloadAction<ICategory[]>) => {
          state.loading = false;
          state.categories = action.payload;
        }
      )
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? null;
      })

      // FETCH BY ID
      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        state.selected = action.payload;
      })

      // FETCH HIERARCHY
      .addCase(fetchCategoryHierarchy.fulfilled, (state, action) => {
        state.hierarchy[action.payload.code] = action.payload.hierarchy;
      })
      .addCase(fetchCategoryHierarchy.rejected, (state, action) => {
        state.error = action.payload ?? null;
      })

      // CREATE
      .addCase(createCategory.fulfilled, (state, action) => {
        if (action.payload) {
          state.categories.push(action.payload);
        }
        state.successMessage = "Category created successfully";
      })

      // UPDATE
      .addCase(updateCategory.fulfilled, (state, action) => {
        if (!action.payload) return;

        state.categories = state.categories.map((c) =>
          c._id === action.payload!._id ? action.payload! : c
        );

        if (state.selected?._id === action.payload._id) {
          state.selected = action.payload;
        }

        state.successMessage = "Category updated successfully";
      })

      // DELETE
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(
          (c) => c._id !== action.payload
        );

        if (state.selected?._id === action.payload) {
          state.selected = null;
        }

        state.successMessage = "Category deleted successfully";
      });
  },
});

/* ============================================================
   🔍 Selectors (Typed)
============================================================ */

export const selectAllCategories = (state: RootState) =>
  state.category.categories;

export const selectCategoryHierarchy = (state: RootState) =>
  state.category.hierarchy;

export const selectSelectedCategory = (state: RootState) =>
  state.category.selected;

export const selectCategoriesLoading = (state: RootState) =>
  state.category.loading;

export const selectCategoriesError = (state: RootState) =>
  state.category.error;

export const selectCategorySuccess = (state: RootState) =>
  state.category.successMessage;

/* ============================================================
   🗑 Exports
============================================================ */

export const { clearCategoryState } = categorySlice.actions;
export default categorySlice.reducer;
