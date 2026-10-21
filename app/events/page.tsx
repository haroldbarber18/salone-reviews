"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function EventsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "ads"));
      setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    })();
  }, []);

  const live = useMemo(
    () => rows.filter((e) => e.active !== false && e.type === "event"),
    [rows]
  );

  return (
    <div className="min-h-screen bg-[#F7F8F5] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-bold">Events</h1>
            <p className="text-sm text-gray-600">Free flyers. Taken down after the event date.</p>
          </div>
          <Link href="/events/new" className="bg-[#006B3F] text-white font-semibold px-4 py-2 rounded-xl">
            Post an event
          </Link>
        </div>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <div className="space-y-8">
            {live.map((e) => (
              <Link key={e.id} href={`/events/${e.id}`} className="block bg-white border rounded-2xl overflow-hidden">
                {(e.photos?.[0] || e.imageUrl) && (
                  <img src={e.photos?.[0] || e.imageUrl} alt="" className="w-full object-contain" />
                )}
                <div className="p-4">
                  <h2 className="font-semibold text-lg">{e.title}</h2>
                  <p className="text-sm text-gray-600 mt-1">{e.eventDate} · {e.district}</p>
                  <p className="text-sm font-semibold text-[#006B3F] mt-2">View details →</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}