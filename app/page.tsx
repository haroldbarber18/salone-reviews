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
  "List for free or find businesses.  salonereviews.sl  -  salonereviews.com  ·  WhatsApp +232 75 294 553  ·  Building materials for diaspora - 6-digit job code - pay in Freetown  ·  Shop numbers stay private  ·  ";

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

function EventBanner({ ad }: { ad?: any }) {
  if (!ad) return <EmptySlot />;
  const href = `/events/${ad.id}`;
  const dateLabel = formatEventRange(ad);
  return (
    <Link
      href={href}
      className="relative block h-[131px] md:h-[180px] rounded-2xl overflow-hidden bg-[#0E1B33] shadow-sm hover:shadow-md transition"
    >
      {ad.imageUrl ? (
        <img
          src={ad.imageUrl}
          alt={ad.title || "Event flyer"}
          className="absolute inset-0 w-full h-full object-cover object-[50%_28%]"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-[#060e20]/90 via-[#060e20]/55 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#060e20]/55 via-transparent to-transparent" />
      <div className="absolute left-3.5 bottom-3 right-[118px] flex flex-col gap-1">
        <h3 className="text-white font-extrabold text-[19px] leading-tight line-clamp-2 drop-shadow">
          {ad.title}
        </h3>
        {dateLabel ? <p className="text-white/90 text-[13px] font-medium">{dateLabel}</p> : null}
        {ad.feeType === "free" && (
          <span className="self-start text-[11px] px-2 py-0.5 rounded-full font-semibold bg-white/20 text-white backdrop-blur-sm">
            Free
          </span>
        )}
        {ad.feeType === "paid" && (
          <span className="self-start text-[11px] px-2 py-0.5 rounded-full font-semibold bg-amber-400 text-amber-950">
            {ad.price || "Paid"}
          </span>
        )}
      </div>
      <span className="absolute right-3 bottom-3 h-[34px] px-3.5 rounded-[10px] bg-[#1EB53A] text-white text-[13.5px] font-bold inline-flex items-center whitespace-nowrap">
        View event ›
      </span>
    </Link>
  );
}

function DiasporaCard() {
  return (
    <Link
      href="/materials"
      className="grid grid-cols-[45%_1fr] md:grid-cols-[360px_1fr] rounded-2xl border border-gray-800 bg-white overflow-hidden hover:shadow-md transition"
    >
      <img
        src="/materials-banner.jpg"
        alt="Cement, timber, gravel and sand"
        className="w-full h-full min-h-[150px] md:min-h-0 md:h-[190px] object-cover object-[35%_50%] bg-gray-100"
      />
      <div className="flex flex-col justify-center py-2.5 pl-3 pr-2.5 md:p-6">
        <p className="text-xs md:text-sm font-semibold text-[#006B3F]">Diaspora building</p>
        <h2 className="text-[15.5px] md:text-xl font-bold text-gray-900 leading-tight mt-0.5 mb-1">
          Building materials for diaspora
        </h2>
        <p className="text-xs md:text-sm text-gray-600 leading-snug mb-2">
          Pick Urban or Rural zone, get a 6-digit job code. Pay in Freetown.
        </p>
        <span className="self-start inline-flex items-center h-8 md:h-10 px-2.5 md:px-4 rounded-[10px] bg-[#006B3F] text-white text-[12.5px] md:text-sm font-bold whitespace-nowrap">
          Request materials quote ›
        </span>
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
    <div className="relative rounded-2xl bg-white border-2 border-amber-400 shadow-[0_0_0_1px_rgba(212,175,55,0.45)] hover:shadow-md transition h-full flex flex-col">
      <span className="absolute -top-2 -left-2 z-10 w-6 h-6 rounded-full bg-amber-400 text-white text-sm font-extrabold grid place-items-center">★</span>
      <div className="flex-1 min-h-[112px] bg-white flex items-center justify-center p-3 rounded-2xl overflow-hidden">
        {ad.imageUrl ? (
          <img src={ad.imageUrl} alt={title} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-xs text-gray-400">Ad</span>
        )}
      </div>
      <div className="px-3 pb-3 pt-1 text-center">
        <h3 className="font-semibold text-sm text-gray-900 leading-snug">{title}</h3>
      </div>
    </div>
  ) : (
    <div className="relative flex items-stretch gap-3 p-2 rounded-2xl bg-white border-2 border-amber-400 shadow-[0_0_0_1px_rgba(212,175,55,0.45)] hover:shadow-md transition h-full">
      <span className="absolute -top-2 -left-2 z-10 w-6 h-6 rounded-full bg-amber-400 text-white text-sm font-extrabold grid place-items-center">★</span>
      <div className="w-[96px] h-[96px] sm:w-[112px] sm:h-[112px] shrink-0 rounded-xl overflow-hidden bg-gray-50">
        {ad.imageUrl ? (
          <img src={ad.imageUrl} alt={title} className="w-full h-full object-contain bg-white" />
        ) : (
          <div className="w-full h-full grid place-items-center text-xs text-gray-400">Ad</div>
        )}
      </div>
      <div className="min-w-0 flex-1 py-1 pr-1">
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

function twoLetters(name?: string) {
  const chars = String(name || "SL").replace(/[^A-Za-z0-9]/g, "");
  if (!chars) return "SL";
  if (chars.length === 1) return chars[0].toUpperCase();
  return chars[0].toUpperCase() + chars[1];
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
      className="flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-sm"
    >
      {photo ? (
        <img
          src={photo}
          alt={biz.name || ""}
          className="w-full h-36 object-cover object-top bg-gray-100"
        />
      ) : (
        <div className="w-full h-36 bg-gray-100" />
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
      className="flex flex-col bg-white border border-amber-300 rounded-2xl overflow-hidden hover:shadow-sm"
    >
      {photo ? (
        <img src={photo} alt="" className="w-full h-36 object-cover object-top bg-gray-100" />
      ) : (
        <div className="w-full h-36 bg-white relative">
          <span className="absolute top-2 left-2 text-[10px] font-extrabold bg-[#006B3F] text-white px-1.5 py-0.5 rounded-sm">SL</span>
          <span className="absolute inset-0 grid place-items-center text-4xl font-bold text-[#006B3F]">
            {twoLetters(biz.name)}
          </span>
        </div>
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
          <div className="w-16 h-16 rounded-xl shrink-0 bg-white border-2 border-[#006B3F] relative overflow-hidden">
            <span className="absolute top-0.5 left-0.5 text-[8px] font-extrabold bg-[#006B3F] text-white px-1 rounded-sm">SL</span>
            <span className="absolute inset-0 grid place-items-center text-xl font-bold text-[#006B3F]">
              {twoLetters(biz.name)}
            </span>
          </div>
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
    const publicBiz = all.filter((b: any) => b.showOnExplore !== false);
    const featured = publicBiz.filter(isFeaturedBiz);
    setFeaturedAll(featured);
    setFeaturedBiz(featured.slice(0, 6));
    setProfiles(publicBiz.filter(isSliderProfile));
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
        href: `/events/${e.id}`,
        link: e.link || "",
        source: "event",
        active: true,
      }));
    const list = [...fromAds, ...fromEvents];
    const filtered = eventFilter === "week" ? list.filter(isThisWeek) : list;
    return [...filtered].sort((a, b) => getAdSortTime(a) - getAdSortTime(b));
  }, [ads, publicEvents, eventFilter]);

  // Collapsed: 1 banner on phones, 3 on wider screens (extra ones are hidden with CSS below md
  // so there is no flash before isMobile is known). Expanded: everything.
  const collapsedCount = isMobile ? 1 : 3;
  const visibleLeftFeed = showAllEvents ? leftFeed : leftFeed.slice(0, 3);
  const visibleCats = showAllCats ? categories : categories.slice(0, 8);
  const leftProfile = profiles.length ? profiles[slide % profiles.length] : null;
  const leftFeat = featuredAll.length ? featuredAll[featSlide % featuredAll.length] : null;

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
    <div className="min-h-screen bg-white flex flex-col pb-24">
      <Navbar />

<div className="relative bg-[#1B5FBF] text-white rounded-b-[24px] pb-3 lg:pb-8">
  <div className="max-w-7xl mx-auto px-4">
    {/* Brand row */}
    <div className="h-[42px] lg:h-14 flex items-center">
      <span className="inline-flex items-center gap-[7px] text-[19px] sm:text-2xl font-extrabold tracking-tight">
        SaloneReviews
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="sm:w-5 sm:h-5">
          <circle cx="12" cy="12" r="12" fill="#22C55E" />
          <path d="M6.8 12.4l3.4 3.4 7-7.2" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>

    {/* Headline (top1 / top2 sponsors either side on desktop) */}
    <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr_160px] gap-3 items-center">
      <div className="hidden lg:block">
        <SponsorCard ad={byPlacement("top1")} compact />
      </div>
      <div className="text-center">
        <h1 className="text-[25px] sm:text-4xl lg:text-5xl font-extrabold leading-[1.1] tracking-tight">
          Find di best businesses<br />in Salone
        </h1>
        <p className="mt-1 text-[13px] sm:text-base text-white/90 font-medium">
          Real reviews. Honest opinions. Better choices.
        </p>
      </div>
      <div className="hidden lg:block">
        <SponsorCard ad={byPlacement("top2")} compact />
      </div>
    </div>

    {/* Search inside the blue */}
    <form
      onSubmit={handleSearch}
      className="mt-2.5 lg:mt-6 max-w-3xl mx-auto flex items-center gap-2 bg-white rounded-xl p-1 pl-3 shadow-[0_8px_24px_rgba(11,40,100,0.18)]"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" className="text-gray-500 shrink-0" aria-hidden="true">
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search businesses..."
        className="flex-1 min-w-0 h-10 lg:h-12 bg-transparent text-[15px] text-gray-900 placeholder:text-gray-400 outline-none"
      />
      <button
        type="submit"
        className="shrink-0 h-10 lg:h-12 px-3.5 lg:px-6 rounded-[10px] bg-[#1EB53A] text-white text-[14.5px] font-bold inline-flex items-center gap-1.5"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2.4" />
          <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
        Search
      </button>
    </form>

    {/* Slim weather + marquee strip */}
    <div className="sr-strip mt-1.5 lg:mt-4 max-w-3xl lg:max-w-none mx-auto h-[30px] rounded-[10px] overflow-hidden flex items-center text-xs">
      <p className="shrink-0 h-full flex items-center gap-1.5 px-2.5 bg-white/15 font-bold whitespace-nowrap">
        <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
          <circle cx="19" cy="17" r="8" fill="#FDB813" />
          <path d="M15 38h22a7 7 0 0 0 0-14 10 10 0 0 0-19 3 5.5 5.5 0 0 0-3 11z" fill="#fff" />
        </svg>
        Freetown {freetownClock || "--:--"}
        {freetownTemp ? ` · ${freetownTemp}` : ""}
        {freetownSky ? ` ${freetownSky}` : ""}
      </p>
      <div className="flex-1 overflow-hidden">
        <div className="sr-marquee pl-3 text-[#E3ECFF] font-medium">
          {NEWS_LINE}
          {NEWS_LINE}
        </div>
      </div>
    </div>

    {/* Popular Categories on the blue */}
    <div className="mt-1 lg:mt-6">
      <div className="flex items-center justify-between mb-[5px]">
        <h2 className="text-lg lg:text-[22px] font-bold">Popular Categories</h2>
        <button
          type="button"
          onClick={() => setShowAllCats((v) => !v)}
          className="text-[13.5px] font-semibold text-white inline-flex items-center gap-0.5 min-h-[28px]"
        >
          {showAllCats ? "Show fewer" : "View all"}
          <span aria-hidden="true" className="text-base leading-none">›</span>
        </button>
      </div>
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-1.5 lg:gap-3">
        {visibleCats.map((cat) => (
          <Link
            key={cat.name}
            href={`/explore?q=${encodeURIComponent(cat.q)}`}
            className="bg-white rounded-xl min-h-[56px] lg:min-h-[88px] px-0.5 py-1.5 flex flex-col items-center justify-center gap-[3px] text-center shadow-[0_2px_8px_rgba(4,30,90,0.18)] hover:shadow-md active:scale-[0.97] transition"
          >
            <span className="text-xl lg:text-2xl leading-none">{cat.icon}</span>
            <span className="text-xs lg:text-[13px] font-semibold text-gray-900 leading-tight">{cat.name}</span>
          </Link>
        ))}
      </div>
    </div>
  </div>
</div>

      <main className="flex-1">
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
          .sr-strip {
            background: rgba(4, 30, 90, 0.45);
            border: 1px solid rgba(255, 255, 255, 0.18);
          }
          .sr-bluebar {
            background:
              linear-gradient(90deg, rgba(8,24,72,0.55), rgba(0,80,180,0.25), rgba(8,24,72,0.55)),
              repeating-linear-gradient(90deg, transparent, transparent 18px, rgba(80,180,255,0.12) 18px, rgba(80,180,255,0.12) 19px),
              repeating-linear-gradient(0deg, transparent, transparent 14px, rgba(80,180,255,0.1) 14px, rgba(80,180,255,0.1) 15px),
              linear-gradient(90deg, #06143a, #0b3d91, #06143a);
            border-top: 1px solid #3ec6ff;
            border-bottom: 1px solid #3ec6ff;
          }
        `}</style>

        {/* Events & Flyers + diaspora card, straight under the blue */}
        <section className="px-4 pt-1.5 pb-2 lg:pt-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-1.5 mb-1">
              <h2 className="text-base lg:text-[22px] font-bold text-gray-900 whitespace-nowrap">Events &amp; Flyers</h2>
              <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1B5FBF]">
                {leftFeed.length > collapsedCount && (
                  <button
                    type="button"
                    onClick={() => setShowAllEvents((v) => !v)}
                    aria-expanded={showAllEvents}
                    className="inline-flex items-center gap-0.5 min-h-[24px]"
                  >
                    {showAllEvents ? "Show fewer" : "View all"}
                    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" className={showAllEvents ? "rotate-180 transition" : "transition"}>
                      <path fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                )}
                {leftFeed.length > collapsedCount && <span className="w-px h-3.5 bg-gray-200" aria-hidden="true" />}
                <Link href="/events/new" className="whitespace-nowrap">+ Post a free event</Link>
              </div>
            </div>
            <div className="flex gap-1.5 mb-1">
              {(["all", "week"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    setEventFilter(f);
                    setShowAllEvents(false);
                  }}
                  aria-pressed={eventFilter === f}
                  className={
                    "h-6 px-3 rounded-full text-xs font-semibold border transition " +
                    (eventFilter === f
                      ? "bg-[#1B5FBF] border-[#1B5FBF] text-white"
                      : "bg-white border-gray-200 text-gray-500")
                  }
                >
                  {f === "all" ? "All" : "This week"}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
              {visibleLeftFeed.length === 0 ? (
                <EmptySlot />
              ) : (
                visibleLeftFeed.map((ad, i) => (
                  <div key={`${ad.source || "ad"}-${ad.id}`} className={!showAllEvents && i > 0 ? "hidden md:block" : ""}>
                    <EventBanner ad={ad} />
                  </div>
                ))
              )}
            </div>
            <div className="mt-[7px] md:mt-4">
              <DiasporaCard />
            </div>
          </div>
        </section>

        <section className="px-3 sm:px-4 py-8 bg-gray-50">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4 items-start">
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
              <form onSubmit={handleAreaFind} className="bg-white border border-gray-200 rounded-2xl px-3 py-2 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
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
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr_240px] gap-4 items-start mt-4">
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
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr_240px] gap-4 items-center mt-3">
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
    </div>
  );
}

