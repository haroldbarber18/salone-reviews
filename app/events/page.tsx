"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

type Ev = {
  id: string;
  name?: string;
  date?: string;
  venue?: string;
  place?: string;
  district?: string;
  fee?: string;
  feeAmount?: string;
  contact?: string;
  link?: string;
  description?: string;
  photos?: string[];
  status?: string;
};

function stillOn(dateStr?: string) {
  if (!dateStr) return false;
  const d = new Date(dateStr + "T23:59:59");
  return !isNaN(d.getTime()) && d >= new Date();
}

export default function EventsPage() {
  const [rows, setRows] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "events"));
      setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      setLoading(false);
    })();
  }, []);

  const live = useMemo(
    () =>
      rows
        .filter((e) => e.status === "approved" && stillOn(e.date))
        .sort((a, b) => String(a.date).localeCompare(String(b.date))),
    [rows]
  );

  return (
    <div className="min-h-screen bg-[#F7F8F5] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Events</h1>
            <p className="text-sm text-gray-600 mt-1">
              Free flyers. Taken down automatically after the event date.
            </p>
          </div>
          <Link href="/events/new" className="bg-[#006B3F] text-white font-semibold px-4 py-2 rounded-xl">
            Post an event
          </Link>
        </div>
        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : live.length === 0 ? (
          <div className="bg-white border rounded-2xl p-6 text-gray-500">
            No upcoming events yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {live.map((e) => {
              const cover = e.photos?.[0];
              const feeLabel =
                e.fee === "paid" ? (e.feeAmount ? `Paid · ${e.feeAmount}` : "Paid") : "Free";
              return (
                <article key={e.id} className="bg-white border rounded-2xl overflow-hidden">
                  {cover && <img src={cover} alt="" className="w-full h-48 object-cover" />}
                  <div className="p-4">
                    <div className="flex justify-between gap-2">
                      <h2 className="font-semibold text-lg">{e.name}</h2>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-[#006B3F] shrink-0">
                        {feeLabel}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {e.date} · {e.venue || e.place} · {e.district}
                    </p>
                    {e.description && <p className="text-sm mt-2 line-clamp-3">{e.description}</p>}
                    <div className="flex gap-3 mt-3 text-sm font-semibold text-[#006B3F]">
                      {e.contact && (
                        <a href={`https://wa.me/${String(e.contact).replace(/\D/g, "")}`}>WhatsApp</a>
                      )}
                      {e.link && (
                        <a href={e.link} target="_blank" rel="noreferrer">
                          Link
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}