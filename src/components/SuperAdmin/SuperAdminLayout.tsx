import { Outlet } from "react-router-dom";
import SuperAdminSidebar from "./SuperAdminSidebar";
import SuperAdminHeader from "./SuperAdminHeader";

const SuperAdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <SuperAdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Sticky Header */}
        <SuperAdminHeader />

        {/* Page Content */}
        <main className="flex-1 p-6 mt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
