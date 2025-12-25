import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";

import { login } from "../store/slices/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { getSocket } from "../utils/socket";

const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { loading, error, isAuthenticated, user } = useAppSelector(
    (state) => state.auth
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const hasRedirected = useRef(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }

    dispatch(login({ email, password }));
  };

  /* =========================
     ERROR HANDLING
  ========================= */
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  /* =========================
     SUCCESS HANDLING
  ========================= */
  useEffect(() => {
    if (isAuthenticated && user && !hasRedirected.current) {
      hasRedirected.current = true;

      toast.success(`Welcome back, ${user.name}`);

      // ✅ Socket join AFTER successful auth
      const socket = getSocket();
      socket.emit("join", user._id);

      // ✅ Role-based redirect
      if (user.role === "SuperAdmin") {
        navigate("/superadmin/dashboard", { replace: true });
      } else if (user.role === "Admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/user/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <>
      <Toaster position="top-right" />

      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-white shadow-2xl rounded-2xl overflow-hidden">
          
          {/* LEFT — BRANDING */}
          <div className="hidden md:flex flex-col items-center justify-center bg-[#1a3a32] text-white p-10 relative">
            <div className="text-center space-y-6 z-10">
              <h2 className="text-3xl font-bold tracking-wide">
                Welcome to the <span className="text-[#c2a336]">ORHC</span>
              </h2>
              <p className="text-emerald-100/70 text-sm max-w-md mx-auto leading-relaxed">
                Access the official Judiciary Registry system to manage and
                track tasks securely.
              </p>
            </div>

            <img
              src="https://judiciary.go.ke/wp-content/uploads/2023/05/logo1-Copy-2.png"
              alt="Judiciary Logo"
              className="w-3/4 mt-8 opacity-90 filter brightness-110"
            />

            <div className="absolute bottom-6 text-[10px] text-emerald-100/40 font-medium tracking-widest uppercase">
              © {new Date().getFullYear()} Judiciary of Kenya — All rights reserved.
            </div>
          </div>

          {/* RIGHT — LOGIN FORM */}
          <div className="p-8 md:p-16 flex flex-col justify-center bg-white">
            <div className="mb-10 text-center md:text-left">
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight mb-2">
                Sign in to your account
              </h1>
              <p className="text-gray-500 text-sm">
                Enter your credentials to access the secure registry.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c2a336] bg-gray-50/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c2a336] bg-gray-50/50"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-[#1a3a32]"
                  />
                  <span className="ml-2">Remember me</span>
                </label>

                <Link
                  to="/forgot-password"
                  className="font-bold text-[#c2a336] hover:text-[#1a3a32]"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-[#1a3a32] text-white font-bold py-4 rounded-xl hover:bg-[#142d26] transition-all flex items-center justify-center gap-3 ${
                  loading ? "opacity-75 cursor-not-allowed" : ""
                }`}
              >
                {loading ? (
                  <span className="uppercase tracking-[0.2em] text-xs">
                    Signing in...
                  </span>
                ) : (
                  <span className="uppercase tracking-[0.2em] text-xs">
                    Sign In
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
