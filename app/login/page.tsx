"use client";
import Link from "next/link";
import { useState } from "react";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/explore");
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/explore");
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user") {
        setError("Google sign-in was cancelled.");
      } else {
        setError("Google sign-in failed. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebook = async () => {
    setFacebookLoading(true);
    setError("");
    try {
      const provider = new FacebookAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/explore");
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user") {
        setError("Facebook sign-in was cancelled.");
      } else if (err?.code === "auth/account-exists-with-different-credential") {
        setError("This email is already registered with another login method.");
      } else {
        setError("Facebook sign-in failed. Please try again.");
      }
    } finally {
      setFacebookLoading(false);
    }
  };

  const busy = loading || googleLoading || facebookLoading;

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
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-600 text-sm mt-1">Log in to your account</p>
        </div>

        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-xl px-4 py-3 outline-none focus:border-[#006B3F] text-gray-900"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-900">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-[#006B3F] font-medium hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-xl px-4 py-3 outline-none focus:border-[#006B3F] text-gray-900"
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-[#006B3F] text-white font-semibold py-3 rounded-xl hover:bg-[#005a35] disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-500">Or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 bg-white text-gray-800 font-medium py-3 rounded-xl hover:bg-gray-50 disabled:opacity-60"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.2 6.5 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.2 6.5 29.4 4 24 4 16.1 4 9.2 8.5 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.1 39.5 16 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l.1.1 6.2 5.2C39.2 36.9 44 31.5 44 24c0-1.3-.1-2.5-.4-3.5z" />
              </svg>
              {googleLoading ? "Connecting..." : "Log in with Google"}
            </button>

            <button
              type="button"
              onClick={handleFacebook}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 bg-[#1877F2] text-white font-medium py-3 rounded-xl hover:bg-[#166fe5] disabled:opacity-60"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.95.93-1.95 1.89v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z" />
              </svg>
              {facebookLoading ? "Connecting..." : "Log in with Facebook"}
            </button>
          </div>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don’t have an account?{" "}
            <Link href="/signup" className="text-[#006B3F] font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}