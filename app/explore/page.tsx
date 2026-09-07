"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";

const ADMIN_EMAILS = ["gdos87@hotmail.com"];
const PAGE_SIZE = 10;
const districts = [
  "Western Area Urban",
  "Western Area Rural",
  "Bo",
  "Kenema",
  "Bombali",
  "Port Loko",
  "Kono",
  "Kailahun",
  "Tonkolili",
  "Kambia",
  "Moyamba",
  "Bonthe",
  "Pujehun",
  "Karene",
  "Falaba",
  "Koinadugu",
];

export default function ExplorePage() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("Western Area Urban");
  const [page, setPage] = useState(1);
  const isAdmin = !!(user && ADMIN_EMAILS.includes(user.email || ""));

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearch(params.get("q") || "");
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bSnap, rSnap] = await Promise.all([
        getDocs(collection(db, "businesses")),
        getDocs(collection(db, "reviews")),
      ]);
      setBusinesses(bSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setReviews(rSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } finally {
      setLoading(false);
    }
  };

  const getStats = (businessId: string) => {
    const list = reviews.filter((r) => r.businessId === businessId);
    if (list.length === 0) return { average: "0.0", count: 0 };
    const total = list.reduce((sum, r) => sum + Number(r.rating || 0), 0);
    return { average: (total / list.length).toFixed(1), count: list.length };
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return businesses.filter((b) => {
      const districtOk = isAdmin ? true : b.district === district;
      if (!districtOk && district !== "All") return false;
      if (!q) return isAdmin || b.district === district;
      const hay = [
        b.name,
        b.category,
        b.subcategory,
        b.area,
        b.district,
        b.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const match = hay.includes(q);
      if (isAdmin) return match;
      return match && b.district === district;
    });
  }, [businesses, search, district, isAdmin]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [search, district]);

  const goTo = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Explore businesses</h1>

          <div className="grid md:grid-cols-2 gap-3 mb-6">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, category, area..."
              className="w-full border rounded-xl px-4 py-3 bg-white"
            />
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 bg-white"
            >
              {isAdmin && <option value="All">All districts</option>}
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {authLoading || loading ? (
            <p>Loading...</p>
          ) : filtered.length === 0 ? (
            <div className="bg-white border rounded-2xl p-6 text-gray-500">
              No businesses found.
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="grid gap-4">
                {paged.map((b) => {
                  const stats = getStats(b.id);
                  return (
                    <Link
                      key={b.id}
                      href={`/business/${b.id}`}
                      className="bg-white border rounded-2xl p-5 hover:shadow-md transition"
                    >
                      <div className="flex gap-4">
                        {user && b.photos?.[0] ? (
                          <img
                            src={b.photos[0]}
                            alt=""
                            className="w-20 h-20 object-cover rounded-xl border shrink-0"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-xl bg-gray-100 border shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between gap-3 mb-2">
                            <h2 className="font-bold text-lg text-gray-900">
                              {user ? b.name : "Business name hidden"}
                            </h2>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full h-fit">
                              {b.subcategory || b.category}
                            </span>
                          </div>
                          {user ? (
                            <>
                              <p className="text-sm text-gray-700 mb-1">{b.area}</p>
                              <p className="text-sm text-[#006B3F] mb-3">{b.district}</p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-500 mb-3">
                              Location hidden · Register free to view
                            </p>
                          )}
                          <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                            {b.description}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <span className="text-amber-500">★</span>
                            <span className="font-semibold">{stats.average}</span>
                            <span className="text-gray-700">({stats.count} reviews)</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => goTo(currentPage - 1)}
                    className="px-4 py-2 rounded-xl border bg-white disabled:opacity-40"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => goTo(n)}
                      className={`w-10 h-10 rounded-xl border ${
                        n === currentPage
                          ? "bg-[#006B3F] text-white border-[#006B3F]"
                          : "bg-white"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => goTo(currentPage + 1)}
                    className="px-4 py-2 rounded-xl border bg-white disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}