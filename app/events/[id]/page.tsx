"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "ads", String(id))).then((snap) => {
      setEvent(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center">Not found</div>;

  const cover = event.photos?.[0] || event.imageUrl;

  return (
    <div className="min-h-screen bg-[#F7F8F5] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        <Link href="/events" className="text-sm text-[#006B3F]">← Back to Events</Link>
        <div className="bg-white border rounded-2xl overflow-hidden mt-4">
          {cover && <img src={cover} alt="" className="w-full object-contain" />}
          <div className="p-4">
            <h1 className="text-xl font-bold">{event.title}</h1>
            <p className="text-sm text-gray-600 mt-1">Event date: {event.eventDate}</p>
            <p className="text-sm text-gray-600">{event.district}</p>
            {event.description && <p className="text-sm mt-2 whitespace-pre-line">{event.description}</p>}
            <div className="flex flex-col gap-2 mt-4">
              {event.phone && (
                <a href={`https://wa.me/${String(event.phone).replace(/\D/g, "")}`} className="bg-[#25D366] text-white text-center font-semibold py-3 rounded-xl">
                  WhatsApp
                </a>
              )}
              {event.link && (
                <a href={event.link} target="_blank" rel="noreferrer" className="bg-[#006B3F] text-white text-center font-semibold py-3 rounded-xl">
                  Visit website
                </a>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}