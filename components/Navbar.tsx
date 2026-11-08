"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { isAdminEmail } from "@/lib/roles";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState(false);

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

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/explore" className="hover:underline">Find Businesses</Link>
          <Link href="/categories" className="hover:underline">Categories</Link>
          <Link href="/write-review" className="hover:underline">Write a Review</Link>
          <Link href="/about" className="hover:underline">About Us</Link>
          {user ? (
            <>
              {isAdmin && (
                <Link href="/admin" className="font-semibold hover:underline">Admin</Link>
              )}
              <span className="text-white/90">Hi {user.displayName?.split(" ")[0] || "there"}</span>
              <button onClick={() => signOut(auth)} className="hover:underline">Log out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">Log In</Link>
              <Link href="/signup" className="bg-white text-[#1e40af] font-semibold px-4 py-1.5 rounded-full">
                Sign Up
              </Link>
            </>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button className="md:hidden text-2xl" onClick={() => setOpen(!open)}>
          ☰
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#1e40af] border-t border-white/20 px-4 py-4 space-y-4">
          <Link href="/explore" className="block" onClick={() => setOpen(false)}>Find Businesses</Link>
          <Link href="/categories" className="block" onClick={() => setOpen(false)}>Categories</Link>
          <Link href="/write-review" className="block" onClick={() => setOpen(false)}>Write a Review</Link>
          <Link href="/about" className="block" onClick={() => setOpen(false)}>About Us</Link>
          {user ? (
            <>
              {isAdmin && (
                <Link href="/admin" className="block font-semibold" onClick={() => setOpen(false)}>Admin</Link>
              )}
              <span className="block">Hi {user.displayName?.split(" ")[0] || "there"}</span>
              <button onClick={() => { signOut(auth); setOpen(false); }} className="block">Log out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="block" onClick={() => setOpen(false)}>Log In</Link>
              <Link href="/signup" className="block bg-white text-[#1e40af] text-center font-semibold py-2 rounded-full" onClick={() => setOpen(false)}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}