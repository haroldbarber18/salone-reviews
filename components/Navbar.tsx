"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { isAdminEmail } from "@/lib/roles";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await signOut(auth);
    router.push("/");
  };

  const isAdmin = isAdminEmail(user?.email);

  return (
    <header className="bg-white border-b sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-[#006B3F]">SaloneReviews</span>
        </Link>

        <div className="flex items-center gap-4">
          {loading ? (
            <span className="text-sm text-gray-400">...</span>
          ) : user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-[#006B3F]"
              >
                <span className="w-8 h-8 rounded-full bg-[#006B3F] text-white grid place-items-center text-xs font-bold">
                  {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:inline">
                  {user.displayName?.split(" ")[0] || "Account"}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-xl shadow-lg py-2 z-50">
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    href="/staff"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    IT Staff
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm font-semibold text-[#006B3F] hover:underline"
            >
              Sign in / Sign up
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}