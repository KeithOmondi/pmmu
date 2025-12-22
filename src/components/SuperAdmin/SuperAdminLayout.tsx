import { Outlet } from "react-router-dom";
import SuperAdminSidebar from "./SuperAdminSidebar";

const SuperAdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <SuperAdminSidebar />

      {/* Main Content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default SuperAdminLayout;
