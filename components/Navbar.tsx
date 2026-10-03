"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { isAdminEmail, isHardcodedStaff, normEmail } from "@/lib/roles";

function Logo() {
  return (
    <svg width="36" height="36" viewBox="0 0 46 46" aria-hidden="true" className="shrink-0">
      <path
        d="M23 3a18 18 0 0 1 0 36c-1.2 0-2.4-.1-3.5-.4L10 43l2.2-7.2A18 18 0 0 1 23 3z"
        fill="#006B3F"
      />
      <rect x="13" y="14" width="20" height="14" rx="3" fill="#fff" />
      <path d="M16 18.5h10" stroke="#1b5fbf" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M16 23.5h7" stroke="#1b5fbf" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M26 23.5l3-2v4z" fill="#1b5fbf" />
    </svg>
  );
}

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [staffEmails, setStaffEmails] = useState<string[]>([]);
  const router = useRouter();
  const email = normEmail(user?.email);
  const isAdmin = isAdminEmail(email);
  const isStaff = !!(email && (isHardcodedStaff(email) || staffEmails.includes(email)));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "staffHelpers"));
        setStaffEmails(snap.docs.map((d) => normEmail((d.data() as any).email)));
      } catch {
        setStaffEmails([]);
      }
    })();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const firstName = user?.displayName?.trim()?.split(/\s+/)[0] || "User";

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <Logo />
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
              {isStaff && !isAdmin && (
                <Link
                  href="/staff"
                  className="text-sm font-semibold text-white bg-[#006B3F] px-3 py-1.5 rounded-full hover:bg-[#005a35]"
                >
                  IT staff
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