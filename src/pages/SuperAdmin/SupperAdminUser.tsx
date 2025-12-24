import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchUsers,
  selectAllUsers,
  selectUsersLoading,
  selectUsersError,
  createUser,
  updateUser,
  deleteUser,
  type IUser,
} from "../../store/slices/userSlice";
import {
  Loader2,
  UserPlus,
  Edit3,
  Trash2,
  ShieldCheck,
  Mail,
  User as UserIcon,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

// Matches the exact string literals in your Slice/Backend
type RoleType = "SuperAdmin" | "Admin" | "User";

const SuperAdminUser: React.FC = () => {
  const dispatch = useAppDispatch();
  const users = useAppSelector(selectAllUsers);
  const usersLoading = useAppSelector(selectUsersLoading);
  const usersError = useAppSelector(selectUsersError);

  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<IUser | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleType>("User");

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (usersError) toast.error(usersError);
  }, [usersError]);

  useEffect(() => {
    if (editUser) {
      setName(editUser.name);
      setEmail(editUser.email);
      setRole(editUser.role);
    } else {
      setName("");
      setEmail("");
      setRole("User");
    }
  }, [editUser]);

  const handleDelete = (id: string) => {
    if (window.confirm("Confirm deletion of this judicial system user?")) {
      dispatch(deleteUser(id))
        .unwrap()
        .then(() => toast.success("User removed successfully"))
        .catch((err) => toast.error(err || "Failed to delete user"));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // MUST use FormData to match your Slice Thunk requirements
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("role", role);

    // Logic for Create vs Update
    const action = editUser
      ? dispatch(updateUser({ id: editUser._id, formData })) // key must be 'formData'
      : dispatch(createUser(formData));

    action
      .unwrap()
      .then(() => {
        toast.success(`User ${editUser ? "updated" : "created"} successfully`);
        setShowForm(false);
        setEditUser(null);
      })
      .catch((err) => toast.error(err || "Operation failed"));
  };

  if (usersLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#f8f9fa]">
        <Loader2 className="w-10 h-10 animate-spin text-[#1a3a32] mb-4" />
        <p className="text-[#8c94a4] font-bold uppercase tracking-widest text-xs">
          Authenticating Registry...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 lg:p-10 bg-[#f8f9fa] space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1a3a32] tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-[#c2a336]" />
            User Access Registry
          </h1>
          <p className="text-[#8c94a4] mt-1 font-medium">
            Manage system credentials and judicial roles
          </p>
        </div>
        <button
          onClick={() => {
            setEditUser(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-[#1a3a32] hover:bg-[#244d42] text-white rounded-xl font-bold transition-all shadow-lg active:scale-95"
        >
          <UserPlus size={18} />
          Add New Official
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#fcfcfc] text-[#8c94a4] uppercase text-[11px] tracking-widest border-b border-gray-100">
                <th className="px-6 py-4 text-left font-bold">
                  Official Details
                </th>
                <th className="px-6 py-4 text-left font-bold">Contact Email</th>
                <th className="px-6 py-4 text-left font-bold">Access Level</th>
                <th className="px-6 py-4 text-center font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr
                  key={user._id}
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#f4f0e6] flex items-center justify-center text-[#c2a336] font-bold border border-[#c2a336]/20">
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-bold text-[#1a3a32]">
                        {user.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <div className="flex items-center gap-2 italic">
                      <Mail size={14} className="text-[#8c94a4]" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter border
                      ${
                        user.role === "SuperAdmin"
                          ? "bg-[#1a3a32] text-white"
                          : user.role === "Admin"
                          ? "bg-amber-50 border-amber-200 text-amber-700"
                          : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditUser(user);
                          setShowForm(true);
                        }}
                        className="p-2 text-[#c2a336] hover:bg-[#f4f0e6] rounded-lg transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Side Drawer */}
      {showForm && (
        <div
          className="fixed inset-0 bg-[#1a3a32]/40 backdrop-blur-sm flex justify-center items-center z-50 p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#1a3a32] p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editUser ? "Edit Profile" : "New Registration"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="hover:rotate-90 transition-transform"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8c94a4] uppercase tracking-widest">
                  Full Legal Name
                </label>
                <div className="relative">
                  <UserIcon
                    className="absolute left-3 top-3 text-[#8c94a4]"
                    size={18}
                  />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                    placeholder="Hon. John Doe"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8c94a4] uppercase tracking-widest">
                  Judiciary Email
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-3 text-[#8c94a4]"
                    size={18}
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                    placeholder="official@judiciary.go.ke"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8c94a4] uppercase tracking-widest">
                  Administrative Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as RoleType)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                >
                  <option value="User">Registry User</option>
                  <option value="Admin">System Admin</option>
                  <option value="SuperAdmin">Super Administrator</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#c2a336] text-[#1a3a32] font-bold rounded-xl shadow-lg"
                >
                  {editUser ? "Save Changes" : "Confirm Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminUser;
