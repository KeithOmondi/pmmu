import { Navigate, Outlet } from "react-router-dom";
import type { Role } from "../store/slices/authSlice";
import { useAppSelector } from "../store/hooks";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user, accessToken, loading } = useAppSelector(
    (state) => state.auth
  );

  // Auth still resolving
  if (loading) return <div>Loading...</div>;

  // Not authenticated or token missing
  if (!isAuthenticated || !user || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  // Role not allowed
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
