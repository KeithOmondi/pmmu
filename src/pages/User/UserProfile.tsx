import React, { useState, useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import {
  Loader2,
  User,
  Mail,
  Shield,
  Save,
  BadgeCheck,
  Camera,
} from "lucide-react";
import { updateProfile } from "../../store/slices/authSlice";
import type { RootState } from "../../store/store";
import toast from "react-hot-toast";

const UserProfile: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: RootState) => state.auth.user);

  const [formData, setFormData] = useState({ name: "", email: "", role: "" });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync form data with Redux user state
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "",
      });
    }
  }, [user]);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setSelectedFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("email", formData.email);

      // Note: We do NOT append 'role' here as the backend handles
      // role security and potential enum casing fixes.

      if (selectedFile) {
        data.append("avatar", selectedFile);
      }

      // 1. Dispatch and wait for the Redux state to be updated with the backend response
      await dispatch(updateProfile(data)).unwrap();

      toast.success("Personnel credentials updated successfully");

      // 2. CRITICAL: Reset local file states
      // This triggers the JSX to switch from 'avatarPreview' back to 'user.avatar'
      setSelectedFile(null);
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
        setAvatarPreview(null);
      }
    } catch (err: any) {
      toast.error(err || "Failed to synchronize profile with registry");
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
        <div className="mb-10">
          <div className="flex items-center gap-2 text-[#c2a336] text-[10px] font-black uppercase tracking-[0.3em] mb-2">
            <Shield size={14} />
            Secure Registry
          </div>
          <h1 className="text-3xl font-black text-[#1a3a32] tracking-tighter">
            User Profile
          </h1>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-black/[0.03] border border-gray-100 overflow-hidden">
          {/* Header Card */}
          <div className="bg-[#1a3a32] p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 md:w-32 md:h-32 bg-[#c2a336] rounded-[2rem] flex items-center justify-center text-[#1a3a32] shadow-2xl transform -rotate-3 overflow-hidden cursor-pointer hover:rotate-0 transition-all duration-500"
              >
                {/* PRIORITY RENDER LOGIC */}
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : user.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={48} />
                )}

                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white" size={24} />
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />

              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full border-4 border-[#1a3a32]">
                <BadgeCheck size={20} />
              </div>
            </div>

            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {user.name}
              </h2>
              <p className="text-[#c2a336] text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                {user.role}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 text-white/60 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                System Online
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                  required
                />
              </div>

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
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <Shield size={12} className="text-[#c2a336]" />
                  Assigned Clearance Level
                </label>
                <input
                  type="text"
                  value={formData.role}
                  className="w-full bg-gray-50 border border-dashed border-gray-200 rounded-2xl px-5 py-4 text-sm font-black text-gray-400 cursor-not-allowed uppercase tracking-widest"
                  disabled
                />
              </div>
            </div>

            <div className="pt-8 border-t border-gray-50 flex flex-col md:flex-row items-center gap-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto flex items-center justify-center gap-3 bg-[#1a3a32] text-[#c2a336] font-black uppercase tracking-widest text-[11px] py-4 px-10 rounded-2xl hover:bg-[#254d43] active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save size={16} /> Commit Changes
                  </>
                )}
              </button>
              <p className="text-[10px] font-bold text-gray-400 italic">
                * Uploading a new avatar will update your identity across all
                departments.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
