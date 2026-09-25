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
  "Mason","Electrician","Plumber","Painter","Tiler","Welder","Carpenter","Auto","Surveyor","Mastic",
];
const NEWS_LINE =
  "Building materials for diaspora — 6-digit job code — pay in Freetown   ·   Request a quote on /materials   ·   Shop numbers stay private   ·   ";
function weatherWord(code?: number) {
  if (code == null) return "";
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Fog";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Showers";
  if (code <= 82) return "Rain";
  if (code <= 99) return "Storm";
  return "";
}
function parseAdDate(dateStr?: string) {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
function getAdSortTime(ad: any) {
  const d = parseAdDate(ad.eventDate) || parseAdDate(ad.startDate);
  return d ? d.getTime() : Number.MAX_SAFE_INTEGER;
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
  if (!ad.startDate && !ad.endDate && !ad.eventDate) return true;
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  const start = parseAdDate(ad.startDate) || parseAdDate(ad.eventDate) || weekStart;
  const end = parseAdDate(ad.endDate) || parseAdDate(ad.eventDate) || start;
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
function formatEventRange(ad: any) {
  if (ad.eventDate && ad.eventEndDate) {
    return `${formatDate(ad.eventDate)} - ${formatDate(ad.eventEndDate)}`;
  }
  return formatDate(ad.eventDate || ad.eventEndDate);
}
function EmptySlot() {
  return (
    <div className="min-h-[112px] border-2 border-dashed border-amber-300 rounded-2xl bg-white flex items-center justify-center text-xs text-gray-500 p-3">
      Sponsor space available
    </div>
  );
}
function FlyerCard({ ad }: { ad?: any }) {
  if (!ad) return <EmptySlot />;
  const href = ad.link || ad.href || `/ad/${ad.id}`;
  const dateLabel = formatEventRange(ad);
  const showRegister = !!(ad.link && String(ad.link).startsWith("http"));
  return (
    <Link
      href={href}
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex items-stretch gap-3 p-2 hover:shadow-sm transition"
    >
      <div className="w-[112px] h-[112px] shrink-0 rounded-xl overflow-hidden bg-gray-100">
        {ad.imageUrl ? (
          <img src={ad.imageUrl} alt={ad.title || "Flyer"} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-xs text-gray-400">Flyer</div>
        )}
      </div>
      <div className="min-w-0 flex-1 py-1 pr-1">
        {dateLabel ? <p className="text-xs text-gray-500 mb-1">{dateLabel}</p> : null}
        <h3 className="font-semibold text-sm text-gray-900 leading-snug line-clamp-3">{ad.title}</h3>
        {ad.feeType === "free" && (
          <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-green-100 text-green-800">
            Free
          </span>
        )}
        {ad.feeType === "paid" && (
          <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800">
            {ad.price || "Paid"}
          </span>
        )}
        {showRegister && (
          <span className="inline-block mt-2 ml-1 text-[11px] font-semibold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
            Register to Join
          </span>
        )}
      </div>
    </Link>
  );
}
function SponsorCard({ ad, compact = false }: { ad?: any; compact?: boolean }) {
  if (!ad) return <EmptySlot />;
  const href = ad.link || ad.href || `/ad/${ad.id}`;
  const title = ad.title || "Sponsor";
  const extra = String(ad.description || ad.caption || "").trim();
  const showExtra = !compact && extra && extra.toLowerCase() !== title.toLowerCase();
  const inner = compact ? (
    <div className="rounded-2xl bg-white border-2 border-amber-400 shadow-[0_0_0_1px_rgba(212,175,55,0.45)] hover:shadow-md transition overflow-hidden h-full flex flex-col">
      <div className="flex-1 min-h-[112px] bg-white flex items-center justify-center p-3">
        {ad.imageUrl ? (
          <img src={ad.imageUrl} alt={title} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-xs text-gray-400">Ad</span>
        )}
      </div>
      <div className="px-3 pb-3 pt-1 text-center">
        <p className="text-xs font-extrabold uppercase tracking-wide text-amber-500">★ Sponsored</p>
        <h3 className="font-semibold text-sm text-gray-900 leading-snug mt-0.5">{title}</h3>
      </div>
    </div>
  ) : (
    <div className="flex items-stretch gap-3 p-2 rounded-2xl bg-white border-2 border-amber-400 shadow-[0_0_0_1px_rgba(212,175,55,0.45)] hover:shadow-md transition h-full">
      <div className="w-[96px] h-[96px] sm:w-[112px] sm:h-[112px] shrink-0 rounded-xl overflow-hidden bg-gray-50">
        {ad.imageUrl ? (
          <img src={ad.imageUrl} alt={title} className="w-full h-full object-contain bg-white" />
        ) : (
          <div className="w-full h-full grid place-items-center text-xs text-gray-400">Ad</div>
        )}
      </div>
      <div className="min-w-0 flex-1 py-1 pr-1">
        <p className="text-xs font-extrabold uppercase tracking-wide text-amber-500 mb-1">★ Sponsored</p>
        <h3 className="font-semibold text-[15px] text-gray-900 leading-snug">{title}</h3>
        {showExtra ? <p className="text-xs text-gray-500 mt-1 line-clamp-2">{extra}</p> : null}
      </div>
    </div>
  );
  if (String(href).startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="block h-full">
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className="block h-full">
      {inner}
    </Link>
  );
}
function isFeaturedBiz(biz: any) {
  if (!biz?.featuredUntil) return false;
  const until = new Date(biz.featuredUntil);
  if (Number.isNaN(until.getTime())) return false;
  until.setHours(23, 59, 59, 999);
  return until >= new Date();
}
function isDateLive(value?: string) {
  if (!value) return false;
  const until = new Date(value);
  if (Number.isNaN(until.getTime())) return false;
  until.setHours(23, 59, 59, 999);
  return until >= new Date();
}
function isSliderProfile(biz: any) {
  if (!biz?.showOnSlider) return false;
  if (!isDateLive(biz.profileUntil || biz.featuredUntil)) return false;
  return !!(biz.profilePhoto || biz.photos?.[0]);
}
function profileImage(biz: any) {
  return biz.profilePhoto || biz.photos?.[0] || "";
}
function formatUntil(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function waDigits(raw?: string) {
  const d = String(raw || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("232")) return d;
  if (d.startsWith("0")) return "232" + d.slice(1);
  return d;
}
function ProfileCard({ biz }: { biz: any }) {
  if (!biz) return null;
  const photo = profileImage(biz);
  const until = formatUntil(biz.profileUntil || biz.featuredUntil);
  return (
    <Link
      href={`/business/${biz.id}`}
      className="flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-sm h-full min-h-[200px]"
    >
      {photo ? (
        <img
          src={photo}
          alt={biz.name || ""}
          className="w-full flex-1 min-h-[140px] object-cover object-top bg-gray-100"
        />
      ) : (
        <div className="w-full flex-1 min-h-[140px] bg-gray-100" />
      )}
      <div className="p-3 shrink-0">
        <p className="font-semibold text-sm text-gray-900 leading-snug">{biz.name}</p>
        <p className="text-xs text-[#006B3F] mt-0.5">{biz.subcategory || biz.category}</p>
        <p className="text-xs text-gray-500 mt-0.5">{[biz.area, biz.district].filter(Boolean).join(" · ")}</p>
        {until ? <p className="text-xs text-gray-700 mt-1">Until {until}</p> : null}
      </div>
    </Link>
  );
}
function SideFeaturedCard({ biz }: { biz: any }) {
  if (!biz) return null;
  const photo = biz.photos?.[0] || biz.profilePhoto || "";
  return (
    <Link
      href={`/business/${biz.id}`}
      className="flex flex-col bg-white border border-amber-300 rounded-2xl overflow-hidden hover:shadow-sm h-full min-h-[200px]"
    >
      {photo ? (
        <img src={photo} alt="" className="w-full flex-1 min-h-[140px] object-cover object-top bg-gray-100" />
      ) : (
        <div className="w-full flex-1 min-h-[140px] bg-gray-100" />
      )}
      <div className="p-3 shrink-0">
        <p className="font-semibold text-sm text-gray-900 leading-snug">{biz.name}</p>
        <p className="text-xs text-[#006B3F] mt-0.5">{biz.subcategory || biz.category}</p>
        <p className="text-xs text-gray-500 mt-0.5">{[biz.area, biz.district].filter(Boolean).join(" · ")}</p>
      </div>
    </Link>
  );
}
function HomeBizCard({ biz }: { biz: any }) {
  const photo = biz.photos?.[0];
  const category = biz.subcategory || biz.category;
  const wa = waDigits(biz.whatsapp || biz.phone);
  return (
    <Link
      href={`/business/${biz.id}`}
      className="block h-full min-h-[132px] bg-white border border-amber-300 rounded-2xl p-3 hover:shadow-md transition overflow-hidden"
    >
      <div className="flex gap-3">
        {photo ? (
          <img src={photo} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0 bg-gray-100" />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-gray-100 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-gray-900 line-clamp-2">{biz.name || "Business"}</p>
          {category && <p className="text-xs text-[#006B3F] mt-0.5 truncate">{category}</p>}
          <p className="text-xs text-gray-500 mt-0.5 truncate">{[biz.area, biz.district].filter(Boolean).join(" · ")}</p>
        </div>
        {wa ? (
          <span
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(`https://wa.me/${wa}`, "_blank");
            }}
            className="shrink-0 w-8 h-8 rounded-full bg-[#25D366] text-white grid place-items-center text-[10px] font-bold"
            title="WhatsApp"
          >
            WA
          </span>
        ) : null}
      </div>
    </Link>
  );
}
export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [ads, setAds] = useState<any[]>([]);
  const [publicEvents, setPublicEvents] = useState<any[]>([]);
  const [eventFilter, setEventFilter] = useState<"all" | "week">("all");
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showAllCats, setShowAllCats] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [featuredBiz, setFeaturedBiz] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [slide, setSlide] = useState(0);
  const [featSlide, setFeatSlide] = useState(0);
  const [featuredAll, setFeaturedAll] = useState<any[]>([]);
  const [findTrade, setFindTrade] = useState("");
  const [findArea, setFindArea] = useState("");
  const [freetownClock, setFreetownClock] = useState("");
  const [freetownTemp, setFreetownTemp] = useState<string>("");
  const [freetownSky, setFreetownSky] = useState("");
  useEffect(() => {
    loadAds();
    loadPublicEvents();
    loadFeaturedBiz();
  }, []);
  useEffect(() => {
    const tick = () => {
      const t = new Date().toLocaleTimeString("en-GB", {
        timeZone: "Africa/Freetown",
        hour: "2-digit",
        minute: "2-digit",
      });
      setFreetownClock(t);
    };
    tick();
    const id = setInterval(tick, 30 * 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=8.484&longitude=-13.23&current=temperature_2m,weather_code"
    )
      .then((r) => r.json())
      .then((d) => {
        const temp = d?.current?.temperature_2m;
        if (typeof temp === "number") setFreetownTemp(`${Math.round(temp)}°C`);
        setFreetownSky(weatherWord(d?.current?.weather_code));
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  useEffect(() => {
    if (profiles.length <= 2) return;
    const id = setInterval(() => setSlide((n) => n + 1), 5000);
    return () => clearInterval(id);
  }, [profiles.length]);
  useEffect(() => {
    if (featuredAll.length <= 2) return;
    const id = setInterval(() => setFeatSlide((n) => n + 1), 5000);
    return () => clearInterval(id);
  }, [featuredAll.length]);
  const loadAds = async () => {
    const snap = await getDocs(collection(db, "ads"));
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setAds(data.filter(isAdVisible));
  };
  const loadPublicEvents = async () => {
    const snap = await getDocs(collection(db, "events"));
    setPublicEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };
  const loadFeaturedBiz = async () => {
    const snap = await getDocs(collection(db, "businesses"));
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const featured = all.filter(isFeaturedBiz);
    setFeaturedAll(featured);
    setFeaturedBiz(featured.slice(0, 6));
    setProfiles(all.filter(isSliderProfile));
  };
  const byPlacement = (key: string) =>
    ads.find((a) => normalizePlacement(a.placement) === key);
  const leftFeed = useMemo(() => {
    const fromAds = ads.filter((a) => {
      const p = normalizePlacement(a.placement);
      return !p || p === "left";
    });
    const fromEvents = publicEvents
      .filter((e) => e.status === "approved" && e.date)
      .filter((e) => {
        const d = new Date(String(e.date) + "T23:59:59");
        return !isNaN(d.getTime()) && d >= new Date();
      })
      .map((e) => ({
        id: e.id,
        title: e.name,
        imageUrl: e.photos?.[0] || "",
        eventDate: e.date,
        startDate: e.date,
        endDate: e.date,
        feeType: e.price || e.fee === "paid" ? "paid" : "free",
        price: e.price || e.feeAmount || "",
        placement: "left",
        href: e.link || "/events",
        link: e.link || "",
        source: "event",
        active: true,
      }));
    const list = [...fromAds, ...fromEvents];
    const filtered = eventFilter === "week" ? list.filter(isThisWeek) : list;
    return [...filtered].sort((a, b) => getAdSortTime(a) - getAdSortTime(b));
  }, [ads, publicEvents, eventFilter]);
  const visibleLeftFeed =
    !isMobile || showAllEvents ? leftFeed : leftFeed.slice(0, 10);
  const visibleCats = showAllCats ? categories : categories.slice(0, 8);
  const leftProfile = profiles.length ? profiles[slide % profiles.length] : null;
  const rightProfile =
    profiles.length > 1
      ? profiles[(slide + 1) % profiles.length]
      : profiles.length === 1
      ? profiles[0]
      : null;
  const leftFeat = featuredAll.length ? featuredAll[featSlide % featuredAll.length] : null;
  const rightFeat =
    featuredAll.length > 1
      ? featuredAll[(featSlide + 1) % featuredAll.length]
      : featuredAll.length === 1
      ? featuredAll[0]
      : null;
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/explore?q=${encodeURIComponent(q)}` : "/explore");
  };
  const handleAreaFind = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = [findTrade, findArea].map((s) => s.trim()).filter(Boolean);
    router.push(parts.length ? `/explore?q=${encodeURIComponent(parts.join(" "))}` : "/explore");
  };
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-[#006B3F] text-white px-3 sm:px-4 py-8 sm:py-12">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr_260px] gap-4 items-stretch">
            <div className="order-2 lg:order-1 h-full">
              <SponsorCard ad={byPlacement("top1")} compact />
            </div>
            <div className="order-1 lg:order-2 text-center">
              <h1 className="text-3xl sm:text-5xl font-bold mb-4">
                Find di best businesses in Salone.
              </h1>
              <p className="text-white/90 mb-6 max-w-2xl mx-auto text-sm sm:text-base">
                Real reviews from real people. Trusted plumbers, electricians,
                mechanics, restaurants and more across Sierra Leone.
              </p>
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search plumbers, restaurants, mechanics..."
                  className="flex-1 rounded-2xl px-4 py-3 bg-white text-gray-900 outline-none"
                />
                <button type="submit" className="bg-white text-[#006B3F] font-semibold px-6 py-3 rounded-2xl">
                  Search
                </button>
              </form>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-5">
                <Link href="/explore" className="bg-white text-[#006B3F] font-semibold px-6 py-3 rounded-2xl">
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
            <div className="order-3 h-full">
              <SponsorCard ad={byPlacement("top2")} compact />
            </div>
          </div>
        </section>
        <div className="bg-[#004d2e] text-white">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center gap-3">
            <p className="shrink-0 text-xs sm:text-sm font-semibold">
              Freetown {freetownClock || "--:--"}
              {freetownTemp ? ` · ${freetownTemp}` : ""}
              {freetownSky ? ` ${freetownSky}` : ""}
            </p>
            <div className="flex-1 overflow-hidden">
              <div className="sr-marquee text-xs sm:text-sm text-white/90">
                {NEWS_LINE}
                {NEWS_LINE}
              </div>
            </div>
          </div>
        </div>
        <style>{`
          @keyframes sr-marquee {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          .sr-marquee {
            display: inline-block;
            white-space: nowrap;
            animation: sr-marquee 28s linear infinite;
          }
        `}</style>
        <section className="px-3 sm:px-4 py-8 bg-gray-50">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr_240px] gap-4 items-start">
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
                  Government, financial and emergency services by district.
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
                  <option value="/services/financial">Financial Services</option>
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
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr_240px] gap-4 items-stretch mt-4">
            <div className="h-full flex flex-col gap-3">
              {leftProfile ? <ProfileCard biz={leftProfile} /> : <div className="hidden lg:block flex-1" />}
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
            <div className="h-full flex flex-col gap-3">
              {rightProfile ? <ProfileCard biz={rightProfile} /> : <div className="hidden lg:block flex-1" />}
              {rightFeat ? <SideFeaturedCard biz={rightFeat} /> : null}
            </div>
          </div>
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr_240px] gap-4 items-center mt-3">
            <Link
              href="/list-business"
              className="flex items-center justify-center gap-2 border rounded-xl px-3 py-3 text-sm font-semibold text-[#006B3F] bg-white"
            >
              QR List your business
            </Link>
            <div />
            <a
              href="https://wa.me/23275294553"
              target="_blank"
              rel="noreferrer"
              className="block border-2 border-dashed border-amber-300 rounded-2xl p-4 text-center bg-white"
            >
              <p className="font-semibold text-sm text-gray-900">Advertise here</p>
              <p className="text-xs text-[#006B3F] mt-1">WhatsApp</p>
            </a>
          </div>
        </section>
        <section className="px-3 sm:px-4 py-10">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Why SaloneReviews?</h2>
            <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto text-sm">
              Too many people rely only on “my friend recommended him.” We are building a place
              where real customers share real experiences so you can choose with confidence.
            </p>
            <div className="grid md:grid-cols-3 gap-3 mb-8">
              <Link href="/explore" className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition bg-white">
                <h3 className="font-semibold mb-1 text-sm text-gray-900">Real Reviews</h3>
                <p className="text-xs text-gray-600 mb-2">
                  Read honest feedback from people who actually used the service.
                </p>
                <span className="text-xs font-semibold text-[#006B3F]">See latest reviews →</span>
              </Link>
              <Link href="/explore" className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition bg-white">
                <h3 className="font-semibold mb-1 text-sm text-gray-900">Easy Contact</h3>
                <p className="text-xs text-gray-600 mb-2">
                  Find businesses and contact them directly by call or WhatsApp.
                </p>
                <span className="text-xs font-semibold text-[#006B3F]">Find & message businesses →</span>
              </Link>
              <Link href="/explore" className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition bg-white">
                <h3 className="font-semibold mb-1 text-sm text-gray-900">Built for Salone</h3>
                <p className="text-xs text-gray-600 mb-2">
                  Made for how people across Sierra Leone actually find trusted local services.
                </p>
                <span className="text-xs font-semibold text-[#006B3F]">Explore local services →</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-stretch">
              <SponsorCard ad={byPlacement("b1")} />
              <SponsorCard ad={byPlacement("b2")} />
              <SponsorCard ad={byPlacement("b3")} />
              <SponsorCard ad={byPlacement("b4")} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}