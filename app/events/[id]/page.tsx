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
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "ads", String(id))).then((snap) => {
      setEvent(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center">Not found</div>;

  const photos = event.photos?.length ? event.photos : event.imageUrl ? [event.imageUrl] : [];
  const cover = photos[photoIndex] || photos[0];
  const dateRange = event.eventDate && event.eventEndDate
    ? `${event.eventDate} – ${event.eventEndDate}`
    : event.eventDate || "";

  return (
    <div className="min-h-screen bg-[#F7F8F5] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        <Link href="/events" className="text-sm text-[#006B3F]">← Back to Events</Link>
        <div className="bg-white border rounded-2xl overflow-hidden mt-4">
          {cover && (
            <div className="relative">
              <img src={cover} alt="" className="w-full object-contain" />
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoIndex((i) => (i + 1) % photos.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full"
                  >
                    ›
                  </button>
                  <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white text-xs bg-black/40 px-2 py-0.5 rounded-full">
                    {photoIndex + 1} / {photos.length}
                  </p>
                </>
              )}
            </div>
          )}
          <div className="p-4">
            <h1 className="text-xl font-bold">{event.title}</h1>
            {dateRange && (
              <p className="text-sm font-semibold text-[#006B3F] mt-1">Event date: {dateRange}</p>
            )}
            {event.district && (
              <p className="text-sm font-semibold text-gray-700 mt-0.5">{event.district}</p>
            )}
            {event.feeType === "paid" && (
              <p className="text-sm font-semibold text-amber-700 mt-1">
                Paid · {event.price || "Paid"}
              </p>
            )}
            {event.feeType === "free" && (
              <p className="text-sm font-semibold text-green-700 mt-1">Free</p>
            )}
            {event.description && (
              <p className="text-sm mt-3 whitespace-pre-line">{event.description}</p>
            )}
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