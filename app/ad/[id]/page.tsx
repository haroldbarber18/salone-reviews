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
  const [activePhoto, setActivePhoto] = useState(0);

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

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading details...</div>;
  if (error || !ad) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p>{error || "Item not found"}</p>
        <Link href="/" className="text-[#006B3F] font-medium">Back home</Link>
      </div>
    );
  }

  const photos: string[] =
    Array.isArray(ad.photos) && ad.photos.length
      ? ad.photos
      : ad.imageUrl
      ? [ad.imageUrl]
      : [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-sm text-[#006B3F] font-medium">← Back home</Link>
          <div className="bg-white border rounded-2xl overflow-hidden mt-4">
            {photos.length > 0 && (
              <div className="bg-gray-100">
                <img
                  src={photos[activePhoto]}
                  alt={ad.title}
                  className="w-full h-[280px] sm:h-[360px] md:h-[420px] object-cover"
                />
                {photos.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto bg-white">
                    {photos.map((url, i) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setActivePhoto(i)}
                        className={`w-16 h-16 rounded-lg overflow-hidden border shrink-0 ${
                          i === activePhoto ? "border-[#006B3F] border-2" : "border-gray-200"
                        }`}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
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
    </div>
  );
}