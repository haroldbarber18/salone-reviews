"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";

const ADMIN_EMAILS = ["gdos87@hotmail.com"];

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
  const isAdmin = !!(user && ADMIN_EMAILS.includes(user.email || ""));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearch(params.get("q") || "");
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const businessSnap = await getDocs(collection(db, "businesses"));
      setBusinesses(businessSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      const reviewSnap = await getDocs(collection(db, "reviews"));
      setReviews(reviewSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.log(error);
      setBusinesses([]);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const getStats = (businessId: string) => {
    const list = reviews.filter((r) => r.businessId === businessId);
    if (list.length === 0) return { average: "0.0", count: 0 };
    const average = (
      list.reduce((sum, r) => sum + (r.rating || 0), 0) / list.length
    ).toFixed(1);
    return { average, count: list.length };
  };

  const filtered = businesses.filter((b) => {
    const text = `${b.name || ""} ${b.category || ""} ${b.subcategory || ""} ${b.area || ""} ${
      b.district || ""
    } ${b.description || ""}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const matchesDistrict = isAdmin
      ? district === "All Districts" || b.district === district
      : b.district === district;
    return matchesSearch && matchesDistrict;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-900">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Businesses</h1>
          <p className="text-gray-700 mb-4">Find trusted services across Sierra Leone</p>

          {!user && (
            <div className="bg-[#006B3F]/5 border border-[#006B3F]/20 rounded-2xl p-4 mb-6">
              <p className="text-sm text-gray-900 font-medium mb-1">
                Log in or register free to access full benefits
              </p>
              <p className="text-xs text-gray-700 mb-3">
                Business names, photos, addresses and contact details are visible after login.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/login" className="bg-[#006B3F] text-white text-sm font-semibold px-5 py-2.5 rounded-xl">
                  Log in
                </Link>
                <Link href="/signup" className="bg-white border border-[#006B3F] text-[#006B3F] text-sm font-semibold px-5 py-2.5 rounded-xl">
                  Register free
                </Link>
              </div>
            </div>
          )}

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by category, area or description..."
            className="w-full border border-gray-300 rounded-2xl px-4 py-3 mb-4 outline-none focus:border-[#006B3F] text-gray-900 bg-white"
          />

          <div className="mb-6">
            <p className="text-sm font-medium text-gray-800 mb-2">Filter by District</p>
            <div className="flex flex-wrap gap-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setDistrict("All Districts")}
                  className={`px-3 py-1.5 rounded-full text-sm border ${
                    district === "All Districts"
                      ? "bg-[#006B3F] text-white border-[#006B3F]"
                      : "bg-white text-gray-800 border-gray-300"
                  }`}
                >
                  All Districts
                </button>
              )}
              {districts.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDistrict(d)}
                  className={`px-3 py-1.5 rounded-full text-sm border ${
                    district === d
                      ? "bg-[#006B3F] text-white border-[#006B3F]"
                      : "bg-white text-gray-800 border-gray-300"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-gray-700">Loading businesses...</p>
          ) : (
            <>
              {isAdmin && (
                <p className="text-sm text-gray-700 mb-4">{filtered.length} businesses found</p>
              )}
              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-lg font-medium text-gray-900 mb-1">No businesses found.</p>
                  <p className="text-gray-700">Try a different district or search term.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((b) => {
                    const stats = getStats(b.id);
                    const label = b.subcategory || b.category;
                    const photo = user && b.photos?.[0] ? b.photos[0] : null;
                    return (
                      <Link
                        key={b.id}
                        href={`/business/${b.id}`}
                        className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition"
                      >
                        {photo ? (
                          <img src={photo} alt="" className="w-full h-36 object-cover" />
                        ) : (
                          <div className="w-full h-36 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                            {user ? "No photo" : "Photo hidden"}
                          </div>
                        )}
                        <div className="p-5">
                          <div className="flex justify-between gap-3 mb-2">
                            <h2 className={`font-bold text-lg ${user ? "text-gray-900" : "text-gray-500"}`}>
                              {user ? b.name : "Business name hidden"}
                            </h2>
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full h-fit">
                              {label}
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
                          <p className="text-sm text-gray-700 line-clamp-2 mb-3">{b.description}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <span className="text-amber-500">★</span>
                            <span className="font-semibold">{stats.average}</span>
                            <span className="text-gray-700">({stats.count} reviews)</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
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