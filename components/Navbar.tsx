"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-[#1E40AF] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="bg-white text-[#1E40AF] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
              SR
            </span>
            SaloneReviews
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/explore" className="hover:text-green-300">Find Businesses</Link>
            <Link href="/categories" className="hover:text-green-300">Categories</Link>
            <Link href="/write-review" className="hover:text-green-300">Write a Review</Link>
            <Link href="/about" className="hover:text-green-300">About Us</Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm">Log In</Link>
            <Link
              href="/signup"
              className="bg-white text-[#1E40AF] px-4 py-2 rounded-xl text-sm font-semibold"
            >
              Sign Up
            </Link>
          </div>

          <button className="md:hidden" onClick={() => setOpen(!open)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden px-4 pb-4 space-y-3 bg-[#1E40AF]">
          <Link href="/explore" className="block py-2">Find Businesses</Link>
          <Link href="/categories" className="block py-2">Categories</Link>
          <Link href="/write-review" className="block py-2">Write a Review</Link>
          <Link href="/about" className="block py-2">About Us</Link>
          <Link href="/login" className="block py-2">Log In</Link>
          <Link
            href="/signup"
            className="block py-2 bg-white text-[#1E40AF] text-center rounded-xl font-semibold"
          >
            Sign Up
          </Link>
        </div>
      )}
    </header>
  );
}