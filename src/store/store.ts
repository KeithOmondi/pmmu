import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import categoryReducer from "./slices/categoriesSlice";
import indicatorsReducer from "./slices/indicatorsSlice";
import usersReducer from "./slices/userSlice";
import notificationsindicatorsReducer from "./slices/notificationsSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    category: categoryReducer,
    indicators: indicatorsReducer,
    notifications: notificationsindicatorsReducer,
    users: usersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

// ---------- TYPES ----------
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
