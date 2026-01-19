import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import type { Role } from "../store/slices/authSlice";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { refreshUser } from "../store/slices/authSlice";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, loading } = useAppSelector((state) => state.auth);

  const [refreshAttempted, setRefreshAttempted] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);

  useEffect(() => {
    const tryRefresh = async () => {
      if (!isAuthenticated && !refreshAttempted) {
        setRefreshLoading(true);
        setRefreshAttempted(true);

        try {
          // Dispatch refresh thunk to get user and access token
          await dispatch(refreshUser()).unwrap();
        } catch (err) {
          console.warn("Refresh token failed or expired", err);
        } finally {
          setRefreshLoading(false);
        }
      }
    };

    tryRefresh();
  }, [isAuthenticated, refreshAttempted, dispatch]);

  if (loading || refreshLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
        Authenticating…
      </div>
    );
  }

  // ❌ NOT authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // ❌ Role not allowed
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ✅ Authenticated & authorized
  return <Outlet />;
};

export default ProtectedRoute;
