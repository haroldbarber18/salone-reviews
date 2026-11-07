"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/explore?q=${encodeURIComponent(q)}` : "/explore");
    setOpen(false);
  };

  return (
    <header className="bg-[#1B5FBF] text-white sticky top-0 z-50 shadow">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-xl font-bold tracking-tight text-white">SaloneReviews</span>
        </Link>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search businesses..."
            className="w-full rounded-l-xl px-4 py-2 text-gray-900 outline-none"
          />
          <button
            type="submit"
            className="bg-[#006B3F] text-white font-semibold px-4 py-2 rounded-r-xl"
          >
            Search
          </button>
        </form>

        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-white">
          <Link href="/explore" className="hover:text-white/90 text-white">
            Explore
          </Link>
          <Link href="/list-business" className="hover:text-white/90 text-white">
            List Business
          </Link>
          <Link href="/events" className="hover:text-white/90 text-white">
            Events
          </Link>
          <Link href="/contact" className="hover:text-white/90 text-white">
            Contact
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="md:hidden text-white"
          aria-label="Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-[#1B5FBF] border-t border-white/20 px-4 py-4 space-y-4">
          <form onSubmit={handleSearch} className="flex">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="flex-1 rounded-l-xl px-3 py-2 text-gray-900 outline-none"
            />
            <button type="submit" className="bg-[#006B3F] text-white px-3 py-2 rounded-r-xl font-semibold">
              Go
            </button>
          </form>

          <div className="flex flex-col gap-3 text-sm text-white">
            <Link href="/explore" onClick={() => setOpen(false)} className="text-white hover:text-white/90">
              Explore
            </Link>
            <Link href="/list-business" onClick={() => setOpen(false)} className="text-white hover:text-white/90">
              List Business
            </Link>
            <Link href="/events" onClick={() => setOpen(false)} className="text-white hover:text-white/90">
              Events
            </Link>
            <Link href="/contact" onClick={() => setOpen(false)} className="text-white hover:text-white/90">
              Contact
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}