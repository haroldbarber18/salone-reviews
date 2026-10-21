"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const snap = await getDoc(doc(db, "events", String(id)));
      setEvent(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center">Event not found.</div>;

  const cover = event.photos?.[0];

  return (
    <div className="min-h-screen bg-[#F7F8F5] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <Link href="/events" className="text-sm text-[#006B3F]">← Back to Events</Link>
        {cover && <img src={cover} alt="" className="w-full h-64 object-cover rounded-2xl mt-4" />}
        <h1 className="text-3xl font-bold mt-4">{event.name}</h1>
        <p className="text-gray-600 mt-1">
          {event.date} · {event.venue || event.place} · {event.district}
        </p>
        {event.description && <p className="mt-4 whitespace-pre-line">{event.description}</p>}
        <div className="flex gap-3 mt-6">
          {event.contact && (
            <a
              href={`https://wa.me/${String(event.contact).replace(/\D/g, "")}`}
              className="bg-[#25D366] text-white font-semibold px-5 py-3 rounded-xl"
            >
              WhatsApp
            </a>
          )}
          {event.link && (
            <a
              href={event.link}
              target="_blank"
              rel="noreferrer"
              className="bg-[#006B3F] text-white font-semibold px-5 py-3 rounded-xl"
            >
              Visit website
            </a>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}