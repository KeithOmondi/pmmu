import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "./store/hooks";
import { checkAuthStatus } from "./store/slices/authSlice";

// Pages & Components
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import ProtectedRoute from "./routes/ProtectedRoute";
import NotificationsListener from "./components/Notifications/NotificationsListener";

// SuperAdmin
import SuperAdminLayout from "./components/SuperAdmin/SuperAdminLayout";
import SuperAdminDashboard from "./pages/SuperAdmin/SuperAdminDashboard";
import SuperAdminIndicators from "./pages/SuperAdmin/SuperAdminIndicators";
import SuperAdminUser from "./pages/SuperAdmin/SupperAdminUser";
import SuperAdminApproved from "./pages/SuperAdmin/SuperAdminApproved";
import SuperAdminReports from "./pages/SuperAdmin/SuperAdminReports";
import SuperAdminNotificationComposer from "./pages/SuperAdmin/SuperAdminNotificationComposer";
import SuperAdminSettings from "./pages/SuperAdmin/SuperAdminSettings";
import SuperAdminLogs from "./pages/SuperAdmin/SuperAminLogs";
import SuperAdminRejected from "./pages/SuperAdmin/SuperAdminRejected";
import SuperAdminUserActivities from "./pages/SuperAdmin/SperAdminUserActivities";

// Admin
import AdminLayout from "./components/Admin/AdminLayout";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminIndicators from "./pages/Admin/AdminIndicators";
import AdminIndicatorDetail from "./pages/Admin/AdminIndicatorDetail";
import SubmittedIndicators from "./pages/Admin/SubmittedIndicators";
import SubmittedIndicatorDetail from "./pages/Admin/SubmittedIndicatorDetail";
import AdminReports from "./pages/Admin/AdminReports";
import AdminSettings from "./pages/Admin/AdminSettings";
import AdminUploadsPage from "./pages/Admin/AdminUploads";

// User
import UserLayout from "./components/User/UserLayout";
import UserDashboard from "./pages/User/UserDashboard";
import UserIndicators from "./pages/User/UserIndicators";
import UserIndicatorDetail from "./pages/User/UserIndicatorDetail";
import UserProfile from "./pages/User/UserProfile";
import UserReport from "./pages/User/UserReports";
import UserRejectionsPage from "./pages/User/UserRejections";
import AdminRejectionsPage from "./pages/Admin/AdminRejections";
import AdminApprovedIndicatorsPage from "./pages/Admin/AdminApprovedIndicators";

const App = () => {
  const dispatch = useAppDispatch();
  const { user, isCheckingAuth, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );

  // Session rehydration on mount
  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  // Request Notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Guard rendering while checking auth
  if (isCheckingAuth) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#F8F9FA]">
        <div className="w-8 h-8 border-4 border-[#C69214] border-t-transparent animate-spin rounded-full mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          Verifying Session...
        </p>
      </div>
    );
  }

  // Helper to get user dashboard path safely
  const getDashboardPath = () => {
    if (!user?.role) return "/login";
    return `/${user.role.toLowerCase()}/dashboard`;
  };

  return (
    <BrowserRouter>
      <NotificationsListener />
      <Routes>
        {/* PUBLIC */}
        <Route
          path="/login"
          element={
            isAuthenticated && user ? (
              <Navigate to={getDashboardPath()} replace />
            ) : (
              <Login />
            )
          }
        />
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
            <Route
              path="notifications"
              element={<SuperAdminNotificationComposer />}
            />
            <Route path="settings" element={<SuperAdminSettings />} />
            <Route path="logs" element={<SuperAdminLogs />} />
            <Route path="log" element={<SuperAdminUserActivities />} />
          </Route>
        </Route>

        {/* ADMIN */}
        <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="indicators" element={<AdminIndicators />} />
            <Route path="indicators/:id" element={<AdminIndicatorDetail />} />
            <Route path="submitted" element={<SubmittedIndicators />} />
            <Route
              path="submitted/:id"
              element={<SubmittedIndicatorDetail />}
            />
            <Route path="approved" element={<AdminApprovedIndicatorsPage />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="uploads" element={<AdminUploadsPage />} />
            <Route path="rejections" element={<AdminRejectionsPage />} />
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
            <Route path="rejections" element={<UserRejectionsPage />} />
          </Route>
        </Route>

        {/* ROOT REDIRECT */}
        <Route
          path="/"
          element={
            isAuthenticated && user ? (
              <Navigate to={getDashboardPath()} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* 404 */}
        <Route
          path="*"
          element={<div className="p-10">Page not found</div>}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
