"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

const ADMIN_EMAILS = ["gdos87@hotmail.com"];

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const isAdmin = !!(user && ADMIN_EMAILS.includes(user.email || ""));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const firstName = user?.displayName?.trim()?.split(/\s+/)[0] || "User";

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 bg-[#006B3F] rounded-xl flex items-center justify-center text-white text-lg shrink-0">
            🇸🇱
          </div>
          <div className="truncate">
            <span className="font-bold text-xl text-[#006B3F]">Salone</span>
            <span className="font-bold text-xl text-gray-900">Reviews</span>
          </div>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {user ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-sm font-semibold text-white bg-[#006B3F] px-3 py-1.5 rounded-full hover:bg-[#005a35]"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/profile"
                className="text-sm font-medium text-gray-900 hover:underline max-w-[120px] sm:max-w-none truncate"
              >
                Hi, {firstName}
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-800 hover:text-[#006B3F]"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-800 hover:text-[#006B3F]"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium bg-[#006B3F] text-white px-4 py-2 rounded-full hover:bg-[#005a35]"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}