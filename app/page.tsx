"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

const categories = [
  { name: "Tradesmen", desc: "All trades", icon: "🔧", q: "Tradesmen" },
  { name: "Electrician", desc: "Wiring & power", icon: "💡", q: "Electrician" },
  { name: "Painter", desc: "Painting", icon: "🎨", q: "Painter" },
  { name: "Tiler", desc: "Tiles", icon: "🧱", q: "Tiler" },
  { name: "Welder", desc: "Welding", icon: "🛠️", q: "Welder" },
  { name: "Carpenter", desc: "Woodwork", icon: "🪚", q: "Carpenter" },
  { name: "Plumber", desc: "Pipes & water", icon: "🚿", q: "Plumber" },
  { name: "Auto", desc: "Mechanics", icon: "🚗", q: "Auto" },
  { name: "Food", desc: "Restaurants & bars", icon: "🍲", q: "Food" },
  { name: "Hotels", desc: "Stays", icon: "🏨", q: "Hotels" },
  { name: "Beauty", desc: "Salons", icon: "💇", q: "Beauty" },
  { name: "Home", desc: "Home help", icon: "🏠", q: "Home" },
  { name: "Cleaning", desc: "Cleaners", icon: "🧹", q: "Cleaning" },
  { name: "Security", desc: "Guards", icon: "🛡️", q: "Security" },
  { name: "Pharmacy", desc: "Chemist", icon: "💊", q: "Pharmacy" },
  { name: "Lawyer", desc: "Legal", icon: "⚖️", q: "Lawyer" },
];

const districts = [
  "Western Area Urban","Western Area Rural","Bo","Kenema","Bombali","Port Loko","Kono",
  "Kailahun","Tonkolili","Kambia","Moyamba","Bonthe","Pujehun","Karene","Falaba","Koinadugu",
];

const FIND_TRADES = [
  "Electrician", "Painter", "Tiler", "Welder", "Carpenter", "Plumber", "Mason", "Builder",
];

function SponsorCard({ ad }: { ad: any }) {
  if (!ad) return null;
  const img = ad.photos?.[0] || ad.imageUrl;
  return (
    <a href={ad.link || "#"} target="_blank" rel="noreferrer" className="block bg-white border rounded-2xl overflow-hidden hover:shadow-md">
      {img && <img src={img} alt="" className="w-full h-32 object-cover" />}
      <div className="p-3">
        <p className="font-semibold text-sm">{ad.title}</p>
        <p className="text-xs text-gray-500 line-clamp-2">{ad.description}</p>
      </div>
    </a>
  );
}

function FlyerCard({ ad }: { ad: any }) {
  const img = ad.photos?.[0] || ad.imageUrl;
  return (
    <Link href={`/events/${ad.id}`} className="block bg-white border rounded-xl overflow-hidden">
      {img && <img src={img} alt="" className="w-full h-24 object-cover" />}
      <div className="p-2">
        <p className="text-xs font-semibold line-clamp-2">{ad.title || ad.name}</p>
        <p className="text-[10px] text-gray-500">{ad.eventDate || ad.date}</p>
      </div>
    </Link>
  );
}

function EmptySlot() {
  return <div className="text-xs text-gray-400 text-center py-4">No events</div>;
}

export default function HomePage() {
  const router = useRouter();
  const [ads, setAds] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [eventFilter, setEventFilter] = useState<"all" | "week">("all");
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showAllCats, setShowAllCats] = useState(false);
  const [findTrade, setFindTrade] = useState("");
  const [findArea, setFindArea] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    (async () => {
      const [adsSnap, eventsSnap, bizSnap] = await Promise.all([
        getDocs(collection(db, "ads")),
        getDocs(collection(db, "events")),
        getDocs(collection(db, "businesses")),
      ]);
      setAds(adsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setEvents(eventsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setBusinesses(bizSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    })();
  }, []);

  const byPlacement = (p: string) => ads.find((a) => a.placement === p && a.active !== false);

  const leftFeed = useMemo(() => {
    const list = [...ads.filter((a) => a.placement === "left" && a.active !== false), ...events.filter((e) => e.status === "approved")];
    return list;
  }, [ads, events]);

  const visibleLeftFeed = showAllEvents || !isMobile ? leftFeed : leftFeed.slice(0, 10);
  const visibleCats = showAllCats ? categories : categories.slice(0, 8);

  const featuredBiz = businesses.filter((b) => b.featuredUntil && new Date(b.featuredUntil) >= new Date()).slice(0, 4);
  const leftProfile = businesses.find((b) => b.category === "Tradesmen");
  const leftFeat = businesses.find((b) => b.featuredUntil);

  function handleAreaFind(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (findTrade) params.set("q", findTrade);
    if (findArea) params.set("district", findArea);
    router.push(`/explore?${params.toString()}`);
  }

  function ProfileCard({ biz }: { biz: any }) {
    return (
      <Link href={`/business/${biz.id}`} className="block bg-white border rounded-xl p-3">
        <p className="font-semibold text-sm">{biz.name}</p>
        <p className="text-xs text-gray-500">{biz.category}</p>
      </Link>
    );
  }

  function SideFeaturedCard({ biz }: { biz: any }) {
    return (
      <Link href={`/business/${biz.id}`} className="block bg-white border rounded-xl p-3 mt-2">
        <p className="font-semibold text-sm">{biz.name}</p>
      </Link>
    );
  }

  function HomeBizCard({ biz }: { biz: any }) {
    return (
      <Link href={`/business/${biz.id}`} className="block bg-white border rounded-2xl overflow-hidden">
        {biz.photos?.[0] && <img src={biz.photos[0]} alt="" className="w-full h-32 object-cover" />}
        <div className="p-3">
          <p className="font-semibold">{biz.name}</p>
          <p className="text-xs text-gray-500">{biz.category} · {biz.district}</p>
        </div>
      </Link>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 pb-20">
        <section className="bg-[#1B5FBF] text-white text-center px-4 py-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Find di best businesses in Salone</h1>
          <p className="max-w-xl mx-auto text-white/90 text-sm sm:text-base">
            Real reviews from real people. Trusted plumbers, electricians, mechanics, restaurants and more across Sierra Leone.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value;
              router.push(`/explore?q=${encodeURIComponent(q)}`);
            }}
            className="mt-6 max-w-lg mx-auto flex gap-2"
          >
            <input
              name="q"
              placeholder="Search plumbers, restaurants, mechanics..."
              className="flex-1 rounded-xl px-4 py-3 text-gray-900 outline-none"
            />
            <button type="submit" className="bg-[#006B3F] text-white font-semibold px-5 rounded-xl">
              Search
            </button>
          </form>
        </section>

        <section className="px-3 sm:px-4 py-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {/* Top sponsors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <SponsorCard ad={byPlacement("top1")} />
              <SponsorCard ad={byPlacement("top2")} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_240px] gap-4 items-start">
              <aside className="bg-white border border-gray-200 rounded-2xl p-3">
                <div className="mb-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-sm font-bold text-gray-900">Events & Flyers</p>
                    <Link href="/events/new" className="text-xs font-semibold text-[#006B3F] shrink-0">
                      Post a free event
                    </Link>
                  </div>
                  <select
                    value={eventFilter}
                    onChange={(e) => {
                      setEventFilter(e.target.value as "all" | "week");
                      setShowAllEvents(false);
                    }}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none text-gray-900 bg-white"
                  >
                    <option value="all">All</option>
                    <option value="week">This week</option>
                  </select>
                </div>
                <div className="space-y-3 lg:max-h-[560px] lg:overflow-y-auto lg:pr-1">
                  {visibleLeftFeed.length === 0 ? (
                    <EmptySlot />
                  ) : (
                    visibleLeftFeed.map((ad) => (
                      <FlyerCard key={`${ad.source || "ad"}-${ad.id}`} ad={ad} />
                    ))
                  )}
                </div>
                {isMobile && leftFeed.length > 10 && !showAllEvents && (
                  <button
                    type="button"
                    onClick={() => setShowAllEvents(true)}
                    className="w-full mt-3 border border-[#006B3F] text-[#006B3F] font-semibold py-3 rounded-xl bg-white"
                  >
                    See more ({leftFeed.length - 10} more)
                  </button>
                )}
                {isMobile && showAllEvents && leftFeed.length > 10 && (
                  <button
                    type="button"
                    onClick={() => setShowAllEvents(false)}
                    className="w-full mt-2 text-sm text-gray-600 py-2"
                  >
                    Show less
                  </button>
                )}
              </aside>

              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Essential Services</h2>
                  <p className="text-gray-600 text-sm mb-3">
                    Government and emergency services by district. Banks sit on Explore.
                  </p>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) router.push(e.target.value);
                    }}
                    className="w-full border rounded-xl px-4 py-3 bg-white text-gray-900"
                  >
                    <option value="" disabled>
                      Choose a service type
                    </option>
                    <option value="/services/government">Government Services</option>
                    <option value="/explore?category=Money%20%26%20Insurance">Financial Services</option>
                    <option value="/services/emergency">Emergency Services</option>
                  </select>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Popular Categories</h2>
                <p className="text-gray-600 text-sm mb-3">What are you looking for today?</p>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 items-stretch">
                  {visibleCats.map((cat) => (
                    <Link
                      key={cat.name}
                      href={`/explore?q=${encodeURIComponent(cat.q)}`}
                      className="bg-white border border-gray-200 rounded-2xl p-2 hover:shadow-sm transition h-full min-h-[76px]"
                    >
                      <div className="text-base mb-0.5">{cat.icon}</div>
                      <h3 className="font-semibold text-xs text-gray-900 leading-tight">{cat.name}</h3>
                      <p className="text-[10px] text-gray-500 leading-tight">{cat.desc}</p>
                    </Link>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllCats((v) => !v)}
                  className="mt-2 text-sm font-semibold text-[#006B3F]"
                >
                  {showAllCats ? "See less" : "See more"}
                </button>
                <Link
                  href="/materials"
                  className="mt-6 block rounded-2xl border bg-white overflow-hidden hover:shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row">
                    <img
                      src="/materials-banner.jpg"
                      alt="Cement and building materials"
                      className="w-full sm:w-44 h-36 sm:h-auto object-cover shrink-0 bg-gray-100"
                    />
                    <div className="p-4 sm:p-5">
                      <p className="text-sm font-semibold text-[#006B3F]">Diaspora building</p>
                      <h2 className="text-lg font-bold text-gray-900 mt-0.5">
                        Building materials for diaspora
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Pick Urban or Rural zone, get a 6-digit job code. Payment in Freetown.
                      </p>
                      <span className="inline-block mt-3 px-4 py-2 rounded-xl bg-[#006B3F] text-white text-sm font-medium">
                        Request materials quote
                      </span>
                    </div>
                  </div>
                </Link>
                <form onSubmit={handleAreaFind} className="mt-4 bg-white border border-gray-200 rounded-2xl px-3 py-2 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <p className="text-sm font-bold text-black shrink-0">Looking in your area</p>
                  <span className="hidden sm:inline text-[#006B3F]">📍</span>
                  <select
                    value={findTrade}
                    onChange={(e) => setFindTrade(e.target.value)}
                    className="flex-1 border-0 bg-transparent text-sm text-gray-800 outline-none"
                  >
                    <option value="">Trade</option>
                    {FIND_TRADES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <select
                    value={findArea}
                    onChange={(e) => setFindArea(e.target.value)}
                    className="flex-1 border-0 bg-transparent text-sm text-gray-800 outline-none"
                  >
                    <option value="">Area</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <button type="submit" className="bg-[#006B3F] text-white font-semibold px-4 py-2 rounded-xl inline-flex items-center justify-center gap-1">
                    Find
                  </button>
                </form>
              </div>

              <aside className="space-y-3">
                <p className="text-sm font-bold text-gray-900 px-1">Sponsored</p>
                <SponsorCard ad={byPlacement("r1")} />
                <SponsorCard ad={byPlacement("r2")} />
                <SponsorCard ad={byPlacement("r3")} />
              </aside>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_240px] gap-4 items-start mt-4">
              <div className="flex flex-col gap-2">
                {leftProfile && (
                  <p className="text-sm font-bold text-gray-900 px-1">Featured tradesmen</p>
                )}
                {leftProfile ? <ProfileCard biz={leftProfile} /> : null}
                {leftFeat ? <SideFeaturedCard biz={leftFeat} /> : null}
              </div>
              <div>
                {featuredBiz.length > 0 && (
                  <div>
                    <div className="flex items-end justify-between gap-3 mb-3">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-1">Featured businesses</h2>
                        <p className="text-gray-600 text-sm">Tap a card for the full listing.</p>
                      </div>
                      <Link href="/explore" className="text-sm font-semibold text-[#006B3F] shrink-0">
                        See all
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
                      {featuredBiz.map((biz) => (
                        <HomeBizCard key={biz.id} biz={biz} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-3">
                <p className="text-sm font-bold text-gray-900 mb-2">Real work videos</p>
                <div className="space-y-2">
                  <a
                    href="https://www.facebook.com/share/v/1DyHufThqs/"
                    target="_blank"
                    rel="noreferrer"
                    className="relative block rounded-xl overflow-hidden bg-gray-100 h-28"
                  >
                    <img src="https://www.image2url.com/r2/default/images/1792246500071-e62c4cd6-a37b-4f08-b013-8d9d6523e08d.jpeg" alt="Work video 1" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="w-10 h-10 rounded-full bg-black/60 text-white grid place-items-center text-lg">▶</div>
                    </div>
                  </a>
                  <a
                    href="https://www.facebook.com/share/r/1DJ9VNweYe/"
                    target="_blank"
                    rel="noreferrer"
                    className="relative block rounded-xl overflow-hidden bg-gray-100 h-28"
                  >
                    <img src="https://www.image2url.com/r2/default/images/1792246795538-71b74a72-f752-4a76-aa8e-10ff6121ab46.jpeg" alt="Work video 2" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="w-10 h-10 rounded-full bg-black/60 text-white grid place-items-center text-lg">▶</div>
                    </div>
                  </a>
                  <a
                    href="https://www.facebook.com/share/r/19hJLcEdzH/"
                    target="_blank"
                    rel="noreferrer"
                    className="relative block rounded-xl overflow-hidden bg-gray-100 h-28"
                  >
                    <img src="https://www.image2url.com/r2/default/images/1792246857308-4d381a95-14ca-467c-8215-450c6ffa4c56.png" alt="Work video 3" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="w-10 h-10 rounded-full bg-black/60 text-white grid place-items-center text-lg">▶</div>
                    </div>
                  </a>
                </div>
                <a
                  href="https://www.facebook.com/salonereviews"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block bg-[#1877F2] text-white text-center font-semibold py-2 rounded-xl text-sm"
                >
                  Watch more on Facebook
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_240px] gap-4 items-center mt-3">
              <Link
                href="/list-business"
                className="flex items-center justify-center border rounded-xl px-2 py-1.5 text-xs font-semibold text-[#006B3F] bg-white"
              >
                QR List your business
              </Link>
              <div />
              <a
                href="https://wa.me/23275294553"
                target="_blank"
                rel="noreferrer"
                className="block border border-dashed border-amber-300 rounded-xl px-2 py-1.5 text-center bg-white"
              >
                <p className="font-semibold text-xs text-gray-900">Advertise here</p>
                <p className="text-[10px] text-[#006B3F]">WhatsApp</p>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Fixed bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1B5FBF] text-white z-50 shadow-lg">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-2">
          <Link href="/" className="flex flex-col items-center text-xs py-1">
            <span className="text-xl">🏠</span>
            <span>Home</span>
          </Link>
          <Link href="/explore" className="flex flex-col items-center text-xs py-1">
            <span className="text-xl">🔍</span>
            <span>Search</span>
          </Link>
          <Link href="/list-business" className="flex flex-col items-center text-xs py-1 -mt-4">
            <span className="bg-white text-[#1B5FBF] rounded-full w-12 h-12 grid place-items-center text-2xl font-bold shadow">+</span>
            <span className="mt-1">Add</span>
          </Link>
          <Link href="/events" className="flex flex-col items-center text-xs py-1">
            <span className="text-xl">📅</span>
            <span>Events</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center text-xs py-1">
            <span className="text-xl">👤</span>
            <span>Hi</span>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}