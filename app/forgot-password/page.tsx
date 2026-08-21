"use client";

import Link from "next/link";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(
        "If an account exists with this email, a password reset link has been sent. Please check your inbox and spam folder."
      );
      setEmail("");
    } catch (err: any) {
      if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setMessage(
          "If an account exists with this email, a password reset link has been sent. Please check your inbox and spam folder."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-[#006B3F] rounded-xl flex items-center justify-center text-white text-xl">
              🇸🇱
            </div>
            <div>
              <span className="font-bold text-2xl text-[#006B3F]">Salone</span>
              <span className="font-bold text-2xl text-gray-900">Reviews</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold">Reset your password</h1>
          <p className="text-gray-600 mt-1">
            Enter your email and we will send a reset link
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-xl px-4 py-3 outline-none focus:border-[#006B3F]"
                required
              />
            </div>

            {message && (
              <p className="text-green-600 text-sm bg-green-50 border border-green-100 rounded-xl p-3">
                {message}
              </p>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#006B3F] text-white font-semibold py-3 rounded-xl hover:bg-[#005a35] disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Remember your password?{" "}
            <Link href="/login" className="text-[#006B3F] font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}