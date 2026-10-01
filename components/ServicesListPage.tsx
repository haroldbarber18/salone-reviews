"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

const DISTRICTS = [
  "All districts",
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

const PAGE_SIZE = 8;

type Item = {
  id: string;
  name: string;
  district: string;
  area: string;
  address: string;
  description: string;
  phone: string;
  whatsapp: string;
};

function digits(value?: string) {
  return String(value || "").replace(/\D/g, "");
}

function Card({ item, hideContact }: { item: Item; hideContact?: boolean }) {
  const tel = digits(item.phone);
  const wa = digits(item.whatsapp || item.phone);
  return (
    <div className="bg-white border rounded-2xl p-4">
      <div className="flex flex-wrap gap-2 mb-1">
        {item.district && (
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{item.district}</span>
        )}
        {item.area && (
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{item.area}</span>
        )}
      </div>
      <h3 className="font-semibold">{item.name}</h3>
      {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
      <div className="flex gap-3 mt-2 text-sm font-semibold text-[#006B3F]">
        {!hideContact && tel && <a href={`tel:${tel}`}>Call</a>}
        {!hideContact && wa && (
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">WhatsApp</a>
        )}
        {!item.id.startsWith("ess-") && <Link href={`/business/${item.id}`}>Open →</Link>}
      </div>
    </div>
  );
}

export default function ServicesListPage({
  type,
  title,
  subtitle,
  searchFirst = false,
}: {
  type: "government" | "emergency" | "financial";
  title: string;
  subtitle: string;
  searchFirst?: boolean;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [district, setDistrict] = useState("Western Area Urban");
  const [picked, setPicked] = useState<Item | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const [bizSnap, essSnap] = await Promise.all([
          getDocs(collection(db, "businesses")),
          getDocs(collection(db, "essentialServices")),
        ]);
        const fromBiz: Item[] = bizSnap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .filter((b) => {
            if (type === "government") return b.showOnGovernment === true;
            if (type === "emergency") return b.showOnEmergency === true;
            return false;
          })
          .map((b) => ({
            id: b.id,
            name: b.name || "",
            district: b.district || "",
            area: b.area || "",
            address: b.address || "",
            description: b.description || "",
            phone: b.phone || "",
            whatsapp: b.whatsapp || "",
          }));
        const fromEss: Item[] = essSnap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .filter((s) => String(s.type || "").toLowerCase() === type)
          .map((s) => ({
            id: `ess-${s.id}`,
            name: s.name || "",
            district: s.district || "",
            area: s.area || "",
            address: s.address || "",
            description: s.description || "",
            phone: s.phone || "",
            whatsapp: s.whatsapp || "",
          }));
        const seen = new Set(fromBiz.map((b) => b.name.trim().toLowerCase()));
        const merged = [
          ...fromBiz,
          ...fromEss.filter((s) => !seen.has(s.name.trim().toLowerCase())),
        ].filter((x) => x.name);
        merged.sort((a, b) => a.name.localeCompare(b.name));
        setItems(merged);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [type]);

  const query = q.trim().toLowerCase();
  const inDistrict = items.filter(
    (item) => district === "All districts" || item.district === district
  );
  const matches = useMemo(() => {
    if (query.length < 1) return [];
    return inDistrict
      .filter((item) => {
        const blob = `${item.name} ${item.area} ${item.address}`.toLowerCase();
        return blob.includes(query);
      })
      .slice(0, 8);
  }, [inDistrict, query]);

  const filtered = useMemo(() => {
    return inDistrict.filter((item) => {
      if (!query) return true;
      const blob = `${item.name} ${item.area} ${item.address} ${item.description} ${item.phone}`.toLowerCase();
      return blob.includes(query);
    });
  }, [inDistrict, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [q, district]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link href="/" className="text-sm text-[#006B3F] font-medium">← Home</Link>
          <h1 className="text-3xl font-bold mt-3">{title}</h1>
          <p className="text-gray-600 mt-1 mb-4">{subtitle}</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPicked(null);
              }}
              placeholder="Type a name..."
              className="border rounded-xl px-4 py-3 bg-white"
            />
            <select
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                setPicked(null);
              }}
              className="border rounded-xl px-4 py-3 bg-white"
            >
              {DISTRICTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : searchFirst ? (
            <>
              {query.length < 1 && (
                <div className="bg-white border rounded-2xl p-4 text-sm text-gray-600">
                  Type the first letter, then pick the name.
                </div>
              )}
              {query.length >= 1 && matches.length === 0 && (
                <div className="bg-white border rounded-2xl p-4 text-sm text-gray-500">No match.</div>
              )}
              {query.length >= 1 && matches.length > 0 && !picked && (
                <div className="bg-white border rounded-2xl overflow-hidden">
                  {matches.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setPicked(item);
                        setQ(item.name);
                      }}
                      className="w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-gray-50"
                    >
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.area || item.district}</div>
                    </button>
                  ))}
                </div>
              )}
              {picked && (
                <div className="mt-3">
                  <Card item={picked} hideContact />
                </div>
              )}
            </>
          ) : visible.length === 0 ? (
            <div className="bg-white border rounded-2xl p-4 text-sm text-gray-500">No match.</div>
          ) : (
            <div className="space-y-3">
              {visible.map((item) => (
                <Card key={item.id} item={item} />
              ))}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    disabled={safePage === 1}
                    onClick={() => setPage(safePage - 1)}
                    className="px-3 py-2 rounded-xl border bg-white disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">{safePage} / {totalPages}</span>
                  <button
                    type="button"
                    disabled={safePage === totalPages}
                    onClick={() => setPage(safePage + 1)}
                    className="px-3 py-2 rounded-xl border bg-white disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}