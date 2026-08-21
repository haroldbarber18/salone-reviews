"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

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

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-[#006B3F] rounded-xl flex items-center justify-center text-white text-lg">
            🇸🇱
          </div>
          <div>
            <span className="font-bold text-xl text-[#006B3F]">Salone</span>
            <span className="font-bold text-xl text-gray-900">Reviews</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-gray-600 hidden sm:inline">
                <Link href="/profile" className="hover:underline">
  Hi, {user.displayName || "User"}
</Link>
              </span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-700 hover:text-[#006B3F]"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-[#006B3F]"
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