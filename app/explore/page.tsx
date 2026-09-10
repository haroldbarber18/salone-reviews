"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";

const ADMIN_EMAILS = ["gdos87@hotmail.com"];

const DISTRICTS = [
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

const PAGE_SIZE = 10;

type Business = {
  id: string;
  name?: string;
  category?: string;
  subcategory?: string;
  area?: string;
  district?: string;
  description?: string;
  photos?: string[];
  featuredUntil?: string;
};

type Review = {
  id: string;
  businessId?: string;
  rating?: number;
  hidden?: boolean;
};

function isFeatured(biz?: Business) {
  if (!biz?.featuredUntil) return false;
  const until = new Date(biz.featuredUntil);
  if (Number.isNaN(until.getTime())) return false;
  until.setHours(23, 59, 59, 999);
  return until >= new Date();
}

function ratingFor(businessId: string, reviews: Review[]) {
  const list = reviews.filter((r) => r.businessId === businessId && !r.hidden);
  if (!list.length) return { average: "0.0", count: 0 };
  const sum = list.reduce((acc, r) => acc + Number(r.rating || 0), 0);
  return { average: (sum / list.length).toFixed(1), count: list.length };
}

function Stars({ average, count }: { average: string; count: number }) {
  if (!count) {
    return <p className="text-sm text-gray-500">No reviews yet</p>;
  }
  const filled = Math.max(0, Math.min(5, Math.round(Number(average))));
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex text-[15px] leading-none" aria-hidden>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={n <= filled ? "text-[#006B3F]" : "text-gray-300"}>
            ★
          </span>
        ))}
      </div>
      <span className="text-sm font-semibold text-gray-900">{average}</span>
      <span className="text-sm text-gray-500">
        ({count} {count === 1 ? "review" : "reviews"})
      </span>
    </div>
  );
}


function tradeLabel(biz: Business) {
  return biz.subcategory || biz.category || "businesses";
}

function rankMapFor(businesses: Business[], reviews: Review[]) {
  const groups: Record<string, Business[]> = {};
  businesses.forEach((biz) => {
    const key = `${biz.district || ""}|${tradeLabel(biz)}`.toLowerCase();
    (groups[key] ||= []).push(biz);
  });
  const map: Record<string, string> = {};
  Object.values(groups).forEach((list) => {
    const scored = list
      .map((biz) => ({ biz, stats: ratingFor(biz.id, reviews) }))
      .filter((row) => row.stats.count > 0)
      .sort(
        (a, b) =>
          b.stats.count - a.stats.count ||
          Number(b.stats.average) - Number(a.stats.average)
      );
    scored.forEach((row, i) => {
      const place = row.biz.district || "Sierra Leone";
      map[row.biz.id] = `#${i + 1} ${tradeLabel(row.biz)} in ${place}`;
    });
  });
  return map;
}

function BusinessCard({
  biz,
  loggedIn,
  stats,
  featured,
  rankLine,
}: {
  biz: Business;
  loggedIn: boolean;
  stats: { average: string; count: number };
  featured: boolean;
  rankLine?: string;
}) {
  const photo = loggedIn ? biz.photos?.[0] : undefined;
  const category = biz.subcategory || biz.category;

  return (
    <Link
      href={`/business/${biz.id}`}
      className={`block bg-white rounded-2xl p-4 sm:p-5 hover:shadow-md transition ${
        featured ? "border-2 border-amber-300 bg-amber-50/70" : "border border-gray-200"
      }`}
    >
      <div className="flex gap-3.5 sm:gap-4">
        {photo ? (
          <img
            src={photo}
            alt=""
            className="w-[88px] h-[88px] sm:w-28 sm:h-28 rounded-xl object-cover shrink-0 bg-gray-100"
          />
        ) : (
          <div className="w-[88px] h-[88px] sm:w-28 sm:h-28 rounded-xl bg-gray-100 shrink-0" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h2 className="font-semibold text-[16px] sm:text-[17px] leading-snug text-gray-900 line-clamp-2">
              {loggedIn ? biz.name || "Untitled" : "Business name hidden"}
            </h2>
            {featured && (
              <span className="shrink-0 mt-0.5 text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                Featured
              </span>
            )}
          </div>

          {category && <p className="text-sm text-[#006B3F] mt-0.5">{category}</p>}
          {rankLine && (
            <p className="text-xs font-semibold text-gray-700 mt-0.5">{rankLine}</p>
          )}

          {loggedIn ? (
            <p className="text-sm text-gray-500 mt-0.5 truncate">
              {[biz.area, biz.district].filter(Boolean).join(" · ")}
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-0.5">
              Location hidden · Register free to view
            </p>
          )}

          {biz.description && (
            <p className="hidden sm:block text-sm text-gray-600 mt-1.5 line-clamp-2">
              {biz.description}
            </p>
          )}

          <div className="mt-2">
            <Stars average={stats.average} count={stats.count} />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ExplorePage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("Western Area Urban");
  const [page, setPage] = useState(1);

  const isAdmin = !!(user && ADMIN_EMAILS.includes(user.email || ""));
  const loggedIn = !!user;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (next) => {
      setUser(next);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (isAdmin) setDistrict("All");
  }, [isAdmin]);

  useEffect(() => {
    setQuery(new URLSearchParams(window.location.search).get("q") || "");
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [bizSnap, reviewSnap] = await Promise.all([
          getDocs(collection(db, "businesses")),
          getDocs(collection(db, "reviews")),
        ]);
        setBusinesses(bizSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })));
        setReviews(reviewSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })));
      } finally {
        setDataLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return businesses.filter((biz) => {
      const districtOk = (isAdmin && district === "All") || biz.district === district;
      if (!districtOk) return false;
      if (!q) return true;
      return [biz.name, biz.category, biz.subcategory, biz.area, biz.district, biz.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [businesses, query, district, isAdmin]);

  const ranks = useMemo(() => rankMapFor(businesses, reviews), [businesses, reviews]);
  const featured = filtered.filter((biz) => isFeatured(biz));
  const rest = filtered
    .filter((biz) => !isFeatured(biz))
    .slice()
    .sort((a, b) => {
      const sa = ratingFor(a.id, reviews);
      const sb = ratingFor(b.id, reviews);
      return sb.count - sa.count || Number(sb.average) - Number(sa.average) || String(a.name || "").localeCompare(String(b.name || ""));
    });

  const totalPages = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = rest.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, district]);

  const goTo = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Explore businesses</h1>
          <p className="flex items-center gap-1.5 text-sm text-[#006B3F] mt-1 mb-4">
            <span aria-hidden>📍</span>
            {district === "All" ? "All districts" : district}
          </p>

          <div className="grid md:grid-cols-2 gap-3 mb-6">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, category, area..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white"
            />
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white"
            >
              {isAdmin && <option value="All">All districts</option>}
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {authLoading || dataLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : filtered.length === 0 ? (
            <div className="bg-white border rounded-2xl p-6 text-gray-500">No businesses found.</div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                {featured.length} featured · {rest.length} more
              </p>

              {featured.length > 0 && (
                <section className="mb-8">
                  <div className="grid md:grid-cols-2 gap-4">
                    {featured.map((biz) => (
                      <BusinessCard
                        key={biz.id}
                        biz={biz}
                        loggedIn={loggedIn}
                        featured
                        stats={ratingFor(biz.id, reviews)}
                        rankLine={ranks[biz.id]}
                      />
                    ))}
                  </div>
                </section>
              )}

              {pageItems.length > 0 && (
                <section>
                  {featured.length > 0 && (
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-px flex-1 bg-gray-200" />
                      <p className="text-sm text-gray-500">More businesses</p>
                      <div className="h-px flex-1 bg-gray-200" />
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    {pageItems.map((biz) => (
                      <BusinessCard
                        key={biz.id}
                        biz={biz}
                        loggedIn={loggedIn}
                        featured={false}
                        stats={ratingFor(biz.id, reviews)}
                        rankLine={ranks[biz.id]}
                      />
                    ))}
                  </div>
                </section>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
                  <button
                    type="button"
                    disabled={safePage === 1}
                    onClick={() => goTo(safePage - 1)}
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
                        n === safePage
                          ? "bg-[#006B3F] text-white border-[#006B3F]"
                          : "bg-white"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={safePage === totalPages}
                    onClick={() => goTo(safePage + 1)}
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
