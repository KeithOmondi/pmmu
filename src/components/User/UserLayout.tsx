import { Outlet } from "react-router-dom";
import UserSidebar from "./UserSidebar";
import UserHeader from "./UserHeader";

const UserLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <UserSidebar />
      <main className="flex-1 p-6">
        <UserHeader  />
        <Outlet />
      </main>
    </div>
  );
};

export default UserLayout;
