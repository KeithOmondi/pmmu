import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppSelector } from "./store/hooks";

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

const App = () => {
  const { user, loading: authLoading } = useAppSelector((state) => state.auth);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* SuperAdmin */}
        <Route element={<ProtectedRoute allowedRoles={["SuperAdmin"]} />}>
          <Route path="/superadmin" element={<SuperAdminLayout />}>
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="indicators" element={<SuperAdminIndicators />} />
            <Route path="users" element={<SuperAdminUser />} />
            <Route path="approved" element={<SuperAdminApproved />} />
            <Route path="reports" element={<SuperAdminReports />} />
          </Route>
        </Route>

        {/* Admin */}
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
          </Route>
        </Route>

        {/* User */}
        <Route element={<ProtectedRoute allowedRoles={["User"]} />}>
          <Route path="/user" element={<UserLayout />}>
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="indicators" element={<UserIndicators />} />
            <Route path="indicators/:id" element={<UserIndicatorDetail />} />
            <Route path="profile" element={<UserProfile />} />
          </Route>
        </Route>

        {/* Default route */}
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
