import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../store/hooks";

interface Props {
  allowedRoles: string[];
}

const ProtectedRoute = ({ allowedRoles }: Props) => {
  const { isAuthenticated, isCheckingAuth, user } = useAppSelector(
    (state) => state.auth
  );

  // 🔹 While checking auth (refresh in progress), show nothing or a loader
  if (isCheckingAuth) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // 🔹 Not authenticated → redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 🔹 Authenticated but role not allowed → redirect to unauthorized page
  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 🔹 All good → render nested routes
  return <Outlet />;
};

export default ProtectedRoute;
