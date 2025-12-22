// src/pages/User/UserProfile.tsx
import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { Loader2, User, Mail, Shield, Save, BadgeCheck } from "lucide-react";
import { updateUser } from "../../store/slices/userSlice";
import type { RootState } from "../../store/store";
import toast from "react-hot-toast";

const UserProfile: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: RootState) => state.auth.user);

  const [formData, setFormData] = useState({ name: "", email: "", role: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await dispatch(updateUser({ id: user._id, updates: formData })).unwrap();
      toast.success("Personnel credentials updated");
    } catch (err) {
      toast.error("Failed to synchronize profile with registry");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#f8f9fa]">
        <Loader2 className="w-10 h-10 animate-spin text-[#1a3a32] mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          Verifying Identity...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-6 lg:p-12">
      <div className="max-w-3xl mx-auto">
        {/* Page Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-[#c2a336] text-[10px] font-black uppercase tracking-[0.3em] mb-2">
            <Shield size={14} />
            Secure Registry
          </div>
          <h1 className="text-4xl font-black text-[#1a3a32] tracking-tighter">
            Personnel Profile
          </h1>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-black/[0.03] border border-gray-100 overflow-hidden">
          {/* Credential Header Card */}
          <div className="bg-[#1a3a32] p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-[#c2a336] rounded-[2rem] flex items-center justify-center text-[#1a3a32] shadow-2xl transform -rotate-3">
                <User size={48} />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full border-4 border-[#1a3a32]">
                <BadgeCheck size={20} />
              </div>
            </div>

            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {user.name}
              </h2>
              <p className="text-[#c2a336] text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                Official {user.role} Account
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 text-white/60 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Registry Connected
              </div>
            </div>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Name Field */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <User size={12} className="text-[#c2a336]" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-[#f8f9fa] border-none rounded-2xl px-5 py-4 text-sm font-bold text-[#1a3a32] focus:ring-2 focus:ring-[#c2a336] transition-all"
                  placeholder="Enter legal name"
                  required
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <Mail size={12} className="text-[#c2a336]" />
                  Official Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-[#f8f9fa] border-none rounded-2xl px-5 py-4 text-sm font-bold text-[#1a3a32] focus:ring-2 focus:ring-[#c2a336] transition-all"
                  placeholder="name@judiciary.gov"
                  required
                />
              </div>

              {/* Role Field (Disabled) */}
              <div className="space-y-2 md:col-span-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <Shield size={12} className="text-[#c2a336]" />
                  Assigned Clearance Level
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    className="w-full bg-gray-50 border border-dashed border-gray-200 rounded-2xl px-5 py-4 text-sm font-black text-gray-400 cursor-not-allowed uppercase tracking-widest"
                    disabled
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-[9px] px-2 py-1 rounded">
                    Role locked by SuperAdmin
                  </div>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="pt-8 border-t border-gray-50 flex flex-col md:flex-row items-center gap-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto flex items-center justify-center gap-3 bg-[#1a3a32] text-[#c2a336] font-black uppercase tracking-widest text-[11px] py-4 px-10 rounded-2xl hover:bg-[#254d43] active:scale-95 transition-all disabled:opacity-50 shadow-xl shadow-[#1a3a32]/10"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save size={16} />
                    Commit Changes
                  </>
                )}
              </button>
              <p className="text-[10px] font-bold text-gray-400 italic text-center md:text-left">
                * Note: Changing official credentials may require departmental
                re-verification.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
