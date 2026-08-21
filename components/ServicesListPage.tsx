"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";

const ADMIN_EMAILS = ["gdos87@hotmail.com"];

const DISTRICTS = [
  "Western Area Urban",
  "Western Area Rural",
  "Bo",
  "Bombali",
  "Bonthe",
  "Kailahun",
  "Kambia",
  "Kenema",
  "Koinadugu",
  "Kono",
  "Moyamba",
  "Port Loko",
  "Pujehun",
  "Tonkolili",
  "Karene",
  "Falaba",
];

type Props = {
  type: "government" | "financial" | "emergency";
  title: string;
  subtitle: string;
};

export default function ServicesListPage({ type, title, subtitle }: Props) {
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [district, setDistrict] = useState("Western Area Urban");
  const [loading, setLoading] = useState(true);

  const isAdmin = !!(user && ADMIN_EMAILS.includes(user.email || ""));

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const snap = await getDocs(collection(db, "essentialServices"));
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((x: any) => x.active !== false && x.type === type);
      data.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (isAdmin && district === "ALL") return items;
    return items.filter((x) => x.district === district);
  }, [items, district, isAdmin]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Link href="/" className="text-sm text-[#006B3F] font-medium">
            ← Back to Home
          </Link>

          <h1 className="text-2xl font-bold mt-4 mb-1">{title}</h1>
          <p className="text-gray-600 text-sm mb-6">{subtitle}</p>

          <div className="mb-6 max-w-sm">
            <label className="block text-sm font-medium mb-2">District</label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 bg-white"
            >
              {isAdmin && <option value="ALL">All Districts</option>}
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : filtered.length === 0 ? (
            <div className="bg-white border rounded-2xl p-6 text-gray-500">
              No services found for this district yet.
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => (
                <Link
                  key={item.id}
                  href={`/services/view?id=${item.id}`}
                  className="block bg-white border rounded-2xl p-4 hover:shadow-md transition"
                >
                  <div className="flex flex-wrap gap-2 mb-1">
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                      {item.type}
                    </span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      {item.district}
                    </span>
                  </div>
                  <h2 className="font-semibold text-lg">{item.name}</h2>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                    {item.description}
                  </p>
                  {item.area && (
                    <p className="text-xs text-[#006B3F] mt-2">{item.area}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}