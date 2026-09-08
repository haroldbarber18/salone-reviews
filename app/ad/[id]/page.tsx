"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function AdDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError("Missing id");
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "ads", id));
        if (snap.exists()) setAd({ id: snap.id, ...snap.data() });
        else setError("Item not found");
      } catch {
        setError("Failed to load item");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const photos: string[] = ad
    ? Array.isArray(ad.photos) && ad.photos.length
      ? ad.photos
      : ad.imageUrl
      ? [ad.imageUrl]
      : []
    : [];

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight" && photos.length) {
        setLightboxIndex((i) => (i === null ? 0 : (i + 1) % photos.length));
      }
      if (e.key === "ArrowLeft" && photos.length) {
        setLightboxIndex((i) => (i === null ? 0 : (i - 1 + photos.length) % photos.length));
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, photos.length]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading details...</div>;
  if (error || !ad) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p>{error || "Item not found"}</p>
        <Link href="/" className="text-[#006B3F] font-medium">Back home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-sm text-[#006B3F] font-medium">← Back home</Link>
          <div className="bg-white border rounded-2xl overflow-hidden mt-4">
            {photos.length > 0 && (
              <div className="bg-gray-100 space-y-3 p-3 sm:p-4">
                {photos.map((url, i) => (
                  <button
                    key={`${url}-${i}`}
                    type="button"
                    onClick={() => setLightboxIndex(i)}
                    className="block w-full bg-white rounded-xl overflow-hidden border"
                  >
                    <img
                      src={url}
                      alt={`${ad.title} flyer ${i + 1}`}
                      className="w-full max-h-[85vh] object-contain bg-white"
                    />
                  </button>
                ))}
                <p className="text-xs text-gray-500 text-center">Tap a flyer to view full size</p>
              </div>
            )}
            <div className="p-5">
              <div className="flex flex-wrap gap-2 mb-3">
                {ad.feeType === "free" && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Free</span>
                )}
                {ad.feeType === "paid" && (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                    Paid{ad.price ? ` · ${ad.price}` : ""}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold mb-3">{ad.title}</h1>
              {(ad.eventDate || ad.eventEndDate) && (
                <p className="text-sm text-gray-700 mb-1">
                  <span className="font-medium">Event date:</span>{" "}
                  {ad.eventDate && ad.eventEndDate
                    ? `${formatDate(ad.eventDate)} – ${formatDate(ad.eventEndDate)}`
                    : formatDate(ad.eventDate || ad.eventEndDate)}
                </p>
              )}
              {ad.district && <p className="text-sm text-[#006B3F] mb-4">{ad.district}</p>}
              <p className="text-gray-700 whitespace-pre-wrap mb-6">{ad.description}</p>
              <div className="flex flex-wrap gap-3">
                {ad.phone && (
                  <a href={`https://wa.me/${ad.phone}`} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-white font-semibold px-5 py-3 rounded-xl">
                    WhatsApp
                  </a>
                )}
                {ad.link && (
                  <a href={ad.link} target="_blank" rel="noopener noreferrer" className="bg-gray-900 text-white font-semibold px-5 py-3 rounded-xl">
                    Open link
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-3"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 text-white text-sm font-semibold bg-white/15 hover:bg-white/25 px-3 py-2 rounded-xl"
          >
            Close
          </button>
          <p className="absolute top-4 left-4 text-white text-sm">
            {lightboxIndex + 1} of {photos.length}
          </p>
          {photos.length > 1 && (
            <button
              type="button"
              aria-label="Previous flyer"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => (i === null ? 0 : (i - 1 + photos.length) % photos.length));
              }}
              className="absolute left-3 sm:left-6 text-white text-3xl bg-white/15 hover:bg-white/25 w-12 h-12 rounded-full"
            >
              ‹
            </button>
          )}
          <img
            src={photos[lightboxIndex]}
            alt={`Flyer ${lightboxIndex + 1}`}
            className="max-h-[90vh] max-w-[94vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {photos.length > 1 && (
            <button
              type="button"
              aria-label="Next flyer"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => (i === null ? 0 : (i + 1) % photos.length));
              }}
              className="absolute right-3 sm:right-6 text-white text-3xl bg-white/15 hover:bg-white/25 w-12 h-12 rounded-full"
            >
              ›
            </button>
          )}
        </div>
      )}
    </div>
  );
}
