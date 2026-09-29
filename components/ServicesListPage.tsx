"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

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

type Props = {
  type: "government" | "emergency" | "financial";
  title: string;
  subtitle: string;
};

function waDigits(raw?: string) {
  const d = String(raw || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("232")) return d;
  if (d.startsWith("0")) return "232" + d.slice(1);
  return d;
}

function matchesType(item: any, type: Props["type"]) {
  if (type === "emergency") {
    return item.type === "emergency" || item.alsoEmergency === true;
  }
  if (type === "government") {
    return item.type === "government" || item.alsoGovernment === true;
  }
  return item.type === "financial";
}

export default function ServicesListPage({ type, title, subtitle }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [district, setDistrict] = useState("Western Area Urban");
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [essSnap, bizSnap] = await Promise.all([
          getDocs(collection(db, "essentialServices")),
          getDocs(collection(db, "businesses")),
        ]);
        const essentials = essSnap.docs
          .map((d) => ({ id: d.id, source: "essential", ...d.data() }))
          .filter((row: any) => row.active !== false && matchesType(row, type));

        const fromBiz = bizSnap.docs
          .map((d) => ({ id: d.id, source: "business", ...d.data() }))
          .filter((row: any) => {
            if (type === "emergency") return !!row.showOnEmergency;
            if (type === "government") return !!row.showOnGovernment;
            if (type === "financial") {
              const cat = String(row.category || "").toLowerCase();
              return row.showOnExplore !== false && cat.includes("money");
            }
            return false;
          })
          .map((row: any) => ({
            ...row,
            address: row.address || "",
            link: row.website || "",
          }));

        const seen = new Set<string>();
        const merged: any[] = [];
        [...essentials, ...fromBiz].forEach((row) => {
          const key = `${String(row.name || "").toLowerCase()}|${String(row.district || "")}|${String(row.phone || "")}`;
          if (seen.has(key)) return;
          seen.add(key);
          merged.push(row);
        });
        merged.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
        setItems(merged);
      } finally {
        setLoading(false);
      }
    })();
  }, [type]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((item) => {
      if (district !== "All" && item.district && item.district !== district) return false;
      if (!needle) return true;
      return [item.name, item.description, item.area, item.address, item.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [items, district, q]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-sm font-semibold text-[#006B3F]">
            ← Home
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-3">{title}</h1>
          <p className="text-sm text-gray-600 mt-1 mb-5">{subtitle}</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-5">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, area, number..."
              className="w-full border rounded-xl px-4 py-3 bg-white"
            />
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 bg-white"
            >
              <option value="All">All districts</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : visible.length === 0 ? (
            <div className="bg-white border rounded-2xl p-6 text-gray-500">
              No services found for this district.
            </div>
          ) : (
            <div className="space-y-3">
              {visible.map((item) => {
                const phone = String(item.phone || "").trim();
                const wa = waDigits(item.whatsapp || item.phone);
                const href = item.source === "business" ? `/business/${item.id}` : item.link || "";
                return (
                  <div key={`${item.source}-${item.id}`} className="bg-white border rounded-2xl p-4">
                    <div className="flex flex-wrap gap-2 mb-1">
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{item.district || "Sierra Leone"}</span>
                      {item.area ? <span className="text-xs text-gray-500">{item.area}</span> : null}
                    </div>
                    <h2 className="font-semibold text-gray-900">{item.name}</h2>
                    {item.description ? (
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{item.description}</p>
                    ) : null}
                    {item.address ? <p className="text-sm text-gray-500 mt-1">{item.address}</p> : null}
                    {item.hours ? <p className="text-sm text-gray-500">{item.hours}</p> : null}
                    <div className="flex flex-wrap gap-3 mt-3">
                      {phone ? (
                        <a href={`tel:${phone}`} className="text-sm font-semibold text-[#006B3F]">
                          Call
                        </a>
                      ) : null}
                      {wa ? (
                        <a
                          href={`https://wa.me/${wa}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-[#006B3F]"
                        >
                          WhatsApp
                        </a>
                      ) : null}
                      {href ? (
                        href.startsWith("http") ? (
                          <a href={href} target="_blank" rel="noreferrer" className="text-sm font-semibold text-gray-700">
                            Open →
                          </a>
                        ) : (
                          <Link href={href} className="text-sm font-semibold text-gray-700">
                            Open →
                          </Link>
                        )
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}