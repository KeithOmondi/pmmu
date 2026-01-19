import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "./store/hooks";
import { refreshUser } from "./store/slices/authSlice";

// Pages
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";

// Protected route wrapper
import ProtectedRoute from "./routes/ProtectedRoute";

// SuperAdmin
import SuperAdminLayout from "./components/SuperAdmin/SuperAdminLayout";
import SuperAdminDashboard from "./pages/SuperAdmin/SuperAdminDashboard";
import SuperAdminIndicators from "./pages/SuperAdmin/SuperAdminIndicators";
import SuperAdminUser from "./pages/SuperAdmin/SupperAdminUser";
import SuperAdminApproved from "./pages/SuperAdmin/SuperAdminApproved";
import SuperAdminReports from "./pages/SuperAdmin/SuperAdminReports";

// Admin
import AdminLayout from "./components/Admin/AdminLayout";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminIndicators from "./pages/Admin/AdminIndicators";
import AdminIndicatorDetail from "./pages/Admin/AdminIndicatorDetail";
import SubmittedIndicators from "./pages/Admin/SubmittedIndicators";
import SubmittedIndicatorDetail from "./pages/Admin/SubmittedIndicatorDetail";

// User
import UserLayout from "./components/User/UserLayout";
import UserDashboard from "./pages/User/UserDashboard";
import UserIndicators from "./pages/User/UserIndicators";
import UserIndicatorDetail from "./pages/User/UserIndicatorDetail";
import UserProfile from "./pages/User/UserProfile";
import SuperAdminNotificationComposer from "./pages/SuperAdmin/SuperAdminNotificationComposer";
import NotificationsListener from "./components/Notifications/NotificationsListener";
import UserReport from "./pages/User/UserReports";
import AdminReports from "./pages/Admin/AdminReports";
import AdminSettings from "./pages/Admin/AdminSettings";
import SuperAdminSettings from "./pages/SuperAdmin/SuperAdminSettings";
import SuperAdminLogs from "./pages/SuperAdmin/SuperAminLogs";
import SuperAdminRejected from "./pages/SuperAdmin/SuperAdminRejected";

const App = () => {
  const dispatch = useAppDispatch();
  const { user, loading: authLoading, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );

  /* =========================
     RESTORE SESSION ON LOAD
  ========================= */
  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (token && !isAuthenticated) {
            dispatch(refreshUser());
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }
}, []);


  /* =========================
     BLOCK ROUTING WHILE AUTH CHECKS
  ========================= */
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
    <NotificationsListener />
      <Routes>
        {/* PUBLIC */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* SUPER ADMIN */}
        <Route element={<ProtectedRoute allowedRoles={["SuperAdmin"]} />}>
          <Route path="/superadmin" element={<SuperAdminLayout />}>
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="indicators" element={<SuperAdminIndicators />} />
            <Route path="users" element={<SuperAdminUser />} />
            <Route path="approved" element={<SuperAdminApproved />} />
            <Route path="rejected" element={<SuperAdminRejected />} />
            <Route path="reports" element={<SuperAdminReports />} />
            <Route path="notifications" element={<SuperAdminNotificationComposer />} />
            <Route path="settings" element={<SuperAdminSettings />} />
            <Route path="logs" element={<SuperAdminLogs />} />
          </Route>
        </Route>

        {/* ADMIN */}
        <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="indicators" element={<AdminIndicators />} />
            <Route path="indicators/:id" element={<AdminIndicatorDetail />} />
            <Route path="submitted" element={<SubmittedIndicators />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route
              path="submitted/:id"
              element={<SubmittedIndicatorDetail />}
            />
          </Route>
        </Route>

        {/* USER */}
        <Route element={<ProtectedRoute allowedRoles={["User"]} />}>
          <Route path="/user" element={<UserLayout />}>
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="indicators" element={<UserIndicators />} />
            <Route path="indicators/:id" element={<UserIndicatorDetail />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="reports" element={<UserReport />} />
          </Route>
        </Route>

        {/* ROOT REDIRECT */}
        <Route
          path="/"
          element={
            <Navigate
              to={user ? `/${user.role.toLowerCase()}` : "/login"}
              replace
            />
          }
        />

        {/* 404 */}
        <Route path="*" element={<div>Page not found</div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
