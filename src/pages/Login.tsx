import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";

import {
  requestLoginOtp,
  resendLoginOtp,
  verifyLoginOtp,
} from "../store/slices/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { getSocket } from "../utils/socket";

const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    loading,
    error,
    isAuthenticated,
    user,
    otpMessage,
    otpSent,
  } = useAppSelector((state) => state.auth);

  const hasRedirected = useRef(false);

  const [pjNumber, setPjNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"PJ" | "OTP">("PJ");

  /* =========================
     REQUEST OTP
  ========================= */
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();

    if (!pjNumber.trim()) {
      toast.error("PJ Number is required");
      return;
    }

    dispatch(requestLoginOtp({ pjNumber }));
  };

  /* =========================
     VERIFY OTP
  ========================= */
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp.trim()) {
      toast.error("OTP is required");
      return;
    }

    dispatch(verifyLoginOtp({ otp }));
  };

  /* =========================
     RESEND OTP
  ========================= */
  const handleResendOtp = () => {
    dispatch(resendLoginOtp());
  };

  /* =========================
     ERROR HANDLING
  ========================= */
  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  /* =========================
     OTP SENT
  ========================= */
  useEffect(() => {
    if (otpMessage && otpSent) {
      toast.success(otpMessage);
      setStep("OTP");
    }
  }, [otpMessage, otpSent]);

  /* =========================
     LOGIN SUCCESS
  ========================= */
  useEffect(() => {
    if (isAuthenticated && user && !hasRedirected.current) {
      hasRedirected.current = true;

      toast.success(`Welcome back, ${user.name}`);

      const socket = getSocket();
      socket.emit("join", user._id);

      if (user.role === "SuperAdmin") {
        navigate("/superadmin/dashboard", { replace: true });
      } else if (user.role === "Admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/user/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  /* =========================
     UI
  ========================= */
  return (
    <>
      <Toaster position="top-right" />

      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative overflow-hidden">
        {/* WATERMARK */}
        <img
          src="https://judiciary.go.ke/wp-content/uploads/2023/05/logo1-Copy-2.png"
          alt="Judiciary Watermark"
          className="
            pointer-events-none
            absolute
            inset-0
            m-auto
            w-[70%]
            max-w-xl
            opacity-[0.04]
            grayscale
            select-none
          "
        />

        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-white shadow-2xl rounded-2xl overflow-hidden relative z-10">
          {/* LEFT — BRANDING */}
          <div className="hidden md:flex flex-col items-center justify-center bg-[#1a3a32] text-white p-10 relative">
            <div className="text-center space-y-6 z-10">
              <h2 className="text-2xl font-bold tracking-wide">
                OFFICE OF THE REGISTRAR{" "}
                <span className="text-[#c2a336]">HIGH COURT</span>
              </h2>
              <p className="text-emerald-100/70 text-sm max-w-md mx-auto leading-relaxed">
                Performance Management and Measurement Understandings.
              </p>
            </div>

            <img
              src="https://judiciary.go.ke/wp-content/uploads/2023/05/logo1-Copy-2.png"
              alt="Judiciary Logo"
              className="w-3/4 mt-8 opacity-90"
            />

            <div className="absolute bottom-6 text-[10px] text-emerald-100/40 tracking-widest uppercase">
              © {new Date().getFullYear()} Judiciary of Kenya
            </div>
          </div>

          {/* RIGHT — FORM */}
          <div className="p-8 md:p-16 flex flex-col justify-center bg-white">
            <div className="mb-10">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                {step === "PJ" ? "Sign in with PJ Number" : "Enter OTP"}
              </h1>
              <p className="text-gray-500 text-sm">
                {step === "PJ"
                  ? "Enter your PJ Number to receive a login OTP."
                  : "Enter the OTP sent to your email."}
              </p>
            </div>

            {step === "PJ" ? (
              <form onSubmit={handleRequestOtp} className="space-y-6">
                <input
                  type="text"
                  value={pjNumber}
                  onChange={(e) => setPjNumber(e.target.value)}
                  placeholder="PJ Number"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#c2a336] focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1a3a32] text-white py-4 rounded-xl font-bold hover:bg-[#142d26] transition"
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="OTP"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#c2a336] focus:outline-none"
                />

                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-[#c2a336] text-sm font-bold hover:underline"
                >
                  Resend OTP
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1a3a32] text-white py-4 rounded-xl font-bold hover:bg-[#142d26] transition"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
