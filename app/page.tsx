"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

const categories = [
  { name: "Tradesmen", desc: "Plumbers, electricians & more", icon: "🔧", q: "Tradesmen" },
  { name: "Auto", desc: "Mechanics & car services", icon: "🚗", q: "Auto" },
  { name: "Food", desc: "Restaurants & local food", icon: "🍲", q: "Food" },
  { name: "Hotels", desc: "Guest houses & stays", icon: "🏨", q: "Hotels" },
  { name: "Beauty", desc: "Salons & beauty services", icon: "💇", q: "Beauty" },
  { name: "Home", desc: "Cleaning & home help", icon: "🏠", q: "Home" },
];

function parseAdDate(dateStr?: string) {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function normalizePlacement(p?: string) {
  if (!p) return "";
  const s = String(p).trim().toLowerCase();
  const map: Record<string, string> = {
    top1: "top1",
    "top sponsor 1": "top1",
    "top-sponsor-1": "top1",
    top2: "top2",
    "top sponsor 2": "top2",
    "top-sponsor-2": "top2",
    r1: "r1",
    r2: "r2",
    r3: "r3",
    b1: "b1",
    b2: "b2",
    b3: "b3",
    b4: "b4",
    left: "left",
    events: "left",
  };
  return map[s] || s;
}

function isAdVisible(ad: any) {
  if (ad.active === false) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = parseAdDate(ad.startDate);
  if (start) {
    start.setHours(0, 0, 0, 0);
    if (today < start) return false;
  }

  const end = parseAdDate(ad.endDate);
  if (end) {
    end.setHours(23, 59, 59, 999);
    if (today > end) return false;
  }

  return true;
}

function isThisWeek(ad: any) {
  if (!ad.startDate && !ad.endDate) return true;
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  const start = parseAdDate(ad.startDate) || weekStart;
  const end = parseAdDate(ad.endDate) || start;
  return start <= weekEnd && end >= weekStart;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = parseAdDate(dateStr) || new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function EmptySlot() {
  return (
    <div className="min-h-[120px] border border-dashed border-gray-300 rounded-2xl bg-white flex items-center justify-center text-xs text-gray-500 p-3">
      Sponsor space available
    </div>
  );
}

function AdCard({ ad }: { ad?: any }) {
  if (!ad) return <EmptySlot />;
  return (
    <Link
      href={`/ad/${ad.id}`}
      className="block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition"
    >
      {ad.imageUrl && (
        <div className="bg-gray-50">
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="w-full h-40 object-contain"
          />
        </div>
      )}
      <div className="p-3 bg-white">
        <div className="flex items-center justify-between gap-2 mb-1">
          {ad.eventDate ? (
            <p className="text-xs text-gray-500">{formatDate(ad.eventDate)}</p>
          ) : (
            <span />
          )}
          {ad.feeType === "free" && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-green-100 text-green-800">
              Free
            </span>
          )}
          {ad.feeType === "paid" && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800">
              {ad.price || "Paid"}
            </span>
          )}
        </div>
        <h3 className="font-bold text-sm mb-1 leading-snug text-gray-900">
          {ad.title}
        </h3>
        <p className="text-xs text-gray-600 line-clamp-2">{ad.description}</p>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [ads, setAds] = useState<any[]>([]);
  const [eventFilter, setEventFilter] = useState<"all" | "week">("all");

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    const snap = await getDocs(collection(db, "ads"));
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setAds(data.filter(isAdVisible));
  };

  const byPlacement = (key: string) =>
    ads.find((a) => normalizePlacement(a.placement) === key);

  const leftFeed = useMemo(() => {
    const list = ads.filter((a) => {
      const p = normalizePlacement(a.placement);
      return !p || p === "left";
    });
    if (eventFilter === "week") return list.filter(isThisWeek);
    return list;
  }, [ads, eventFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/explore?q=${encodeURIComponent(q)}` : "/explore");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-[#006B3F] text-white px-3 sm:px-4 py-8 sm:py-12">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[200px_1fr_200px] gap-4 items-stretch">
            <div className="order-2 lg:order-1">
              <AdCard ad={byPlacement("top1")} />
            </div>
            <div className="order-1 lg:order-2 text-center">
              <h1 className="text-3xl sm:text-5xl font-bold mb-4">
                Find di best businesses in Salone.
              </h1>
              <p className="text-white/90 mb-6 max-w-2xl mx-auto text-sm sm:text-base">
                Real reviews from real people. Trusted plumbers, electricians,
                mechanics, restaurants and more across Sierra Leone.
              </p>
              <form
                onSubmit={handleSearch}
                className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto"
              >
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search plumbers, restaurants, mechanics..."
                  className="flex-1 rounded-2xl px-4 py-3 bg-white text-gray-900 outline-none"
                />
                <button
                  type="submit"
                  className="bg-white text-[#006B3F] font-semibold px-6 py-3 rounded-2xl"
                >
                  Search
                </button>
              </form>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-5">
                <Link
                  href="/explore"
                  className="bg-white text-[#006B3F] font-semibold px-6 py-3 rounded-2xl"
                >
                  View businesses
                </Link>
                <Link
                  href="/list-business"
                  className="bg-[#004d2e] text-white font-semibold px-6 py-3 rounded-2xl border border-white/30"
                >
                  List your business
                </Link>
                <Link
                  href="/contact"
                  className="bg-transparent text-white font-semibold px-6 py-3 rounded-2xl border border-white/40"
                >
                  Contact us
                </Link>
              </div>
            </div>
            <div className="order-3">
              <AdCard ad={byPlacement("top2")} />
            </div>
          </div>
        </section>

        <section className="px-3 sm:px-4 py-8 bg-gray-50">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr_240px] gap-4 items-start">
            <aside className="bg-white border border-gray-200 rounded-2xl p-3">
              <div className="mb-3">
                <p className="text-sm font-bold text-gray-900 mb-2">
                  Events & Flyers
                </p>
                <select
                  value={eventFilter}
                  onChange={(e) =>
                    setEventFilter(e.target.value as "all" | "week")
                  }
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none text-gray-900 bg-white"
                >
                  <option value="all">All</option>
                  <option value="week">This week</option>
                </select>
              </div>
              <div className="space-y-3 lg:max-h-[560px] lg:overflow-y-auto lg:pr-1">
                {leftFeed.length === 0 ? (
                  <EmptySlot />
                ) : (
                  leftFeed.map((ad) => <AdCard key={ad.id} ad={ad} />)
                )}
              </div>
            </aside>

            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Essential Services
                </h2>
                <p className="text-gray-600 text-sm mb-3">
                  Government, financial and emergency services by district.
                </p>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) router.push(e.target.value);
                  }}
                  className="w-full max-w-sm border rounded-xl px-4 py-3 bg-white text-gray-900"
                >
                  <option value="" disabled>
                    Choose a service type
                  </option>
                  <option value="/services/government">
                    Government Services
                  </option>
                  <option value="/services/financial">
                    Financial Services
                  </option>
                  <option value="/services/emergency">
                    Emergency Services
                  </option>
                </select>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Popular Categories
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                What are you looking for today?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <Link
                    key={cat.name}
                    href={`/explore?q=${encodeURIComponent(cat.q)}`}
                    className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-sm transition"
                  >
                    <div className="text-lg mb-1">{cat.icon}</div>
                    <h3 className="font-semibold text-sm text-gray-900">
                      {cat.name}
                    </h3>
                    <p className="text-[11px] text-gray-500 leading-snug">
                      {cat.desc}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            <aside className="space-y-3">
              <p className="text-sm font-bold text-gray-900 px-1">Sponsored</p>
              <AdCard ad={byPlacement("r1")} />
              <AdCard ad={byPlacement("r2")} />
              <AdCard ad={byPlacement("r3")} />
            </aside>
          </div>
        </section>

        <section className="px-3 sm:px-4 py-10">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
              Why SaloneReviews?
            </h2>
            <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto text-sm">
              Too many people rely only on “my friend recommended him.” We are
              building a place where real customers share real experiences so
              you can choose with confidence.
            </p>
            <div className="grid md:grid-cols-3 gap-3 mb-8">
              <Link
                href="/explore"
                className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition bg-white"
              >
                <h3 className="font-semibold mb-1 text-sm text-gray-900">
                  Real Reviews
                </h3>
                <p className="text-xs text-gray-600 mb-2">
                  Read honest feedback from people who actually used the service.
                </p>
                <span className="text-xs font-semibold text-[#006B3F]">
                  See latest reviews →
                </span>
              </Link>
              <Link
                href="/explore"
                className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition bg-white"
              >
                <h3 className="font-semibold mb-1 text-sm text-gray-900">
                  Easy Contact
                </h3>
                <p className="text-xs text-gray-600 mb-2">
                  Find businesses and contact them directly by call or WhatsApp.
                </p>
                <span className="text-xs font-semibold text-[#006B3F]">
                  Find & message businesses →
                </span>
              </Link>
              <Link
                href="/explore"
                className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition bg-white"
              >
                <h3 className="font-semibold mb-1 text-sm text-gray-900">
                  Built for Salone
                </h3>
                <p className="text-xs text-gray-600 mb-2">
                  Made for how people across Sierra Leone actually find trusted
                  local services.
                </p>
                <span className="text-xs font-semibold text-[#006B3F]">
                  Explore local services →
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <AdCard ad={byPlacement("b1")} />
              <AdCard ad={byPlacement("b2")} />
              <AdCard ad={byPlacement("b3")} />
              <AdCard ad={byPlacement("b4")} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}