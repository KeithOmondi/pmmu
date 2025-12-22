import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import categoryReducer from "./slices/categoriesSlice";
import indicatorsReducer from "./slices/indicatorsSlice";
import usersReducer from "./slices/userSlice";
import { injectTokenGetter } from "../api/axios";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    category: categoryReducer,
    indicators: indicatorsReducer,
    users: usersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

// 🔑 Inject token getter AFTER store is ready
injectTokenGetter(() => store.getState().auth.accessToken);

// ---------- TYPES ----------
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
