"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { isAdminEmail } from "@/lib/roles";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  const isAdmin = user && isAdminEmail(user.email);

  return (
    <header className="bg-[#1e40af] text-white sticky top-0 z-50 shadow">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-[#1e40af] font-bold text-sm">
            SR
          </div>
          <span className="font-bold text-xl">SaloneReviews</span>
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6 text-sm">
          <Link href="/explore" className="hover:underline">Find Businesses</Link>
          <Link href="/categories" className="hover:underline">Categories</Link>
          <Link href="/write-review" className="hover:underline">Write a Review</Link>
          <Link href="/about" className="hover:underline">About Us</Link>
          {user ? (
            <>
              {isAdmin && (
                <Link href="/admin" className="font-semibold hover:underline">Admin</Link>
              )}
              <span className="text-white/90 whitespace-nowrap">Hi {user.displayName?.split(" ")[0] || "there"}</span>
              <button onClick={() => signOut(auth)} className="hover:underline">Log out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">Log In</Link>
              <Link href="/signup" className="bg-white text-[#1e40af] font-semibold px-3 py-1 rounded-full">
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}