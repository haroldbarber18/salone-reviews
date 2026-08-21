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

function formatShortDate(dateStr?: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return {
    day: d.getDate(),
    month: d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase(),
  };
}

export default function AdDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading details...</div>;
  }

  if (error || !ad) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p>{error || "Item not found"}</p>
        <Link href="/" className="text-[#006B3F] font-medium">
          ← Back to Home
        </Link>
      </div>
    );
  }

  const shortDate = formatShortDate(ad.eventDate);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link href="/" className="text-sm text-[#006B3F] font-medium">
            ← Back to Home
          </Link>

          <div className="bg-white border rounded-2xl overflow-hidden mt-4">
            {ad.imageUrl && (
              <div className="bg-gray-50">
                <img
                  src={ad.imageUrl}
                  alt={ad.title}
                  className="w-full max-h-[360px] object-contain"
                />
              </div>
            )}

            <div className="p-5 sm:p-6">
              <div className="flex gap-4 mb-4">
                {shortDate && (
                  <div className="w-16 h-16 rounded-xl bg-[#006B3F] text-white flex flex-col items-center justify-center shrink-0">
                    <span className="text-[11px] font-semibold">{shortDate.month}</span>
                    <span className="text-2xl font-bold leading-none">{shortDate.day}</span>
                  </div>
                )}

                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                    {ad.type === "event"
                      ? "Event"
                      : ad.type === "flyer"
                      ? "Flyer"
                      : "Sponsored"}
                  </p>
                  <h1 className="text-2xl font-bold leading-snug">{ad.title}</h1>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                {ad.feeType === "free" && (
                  <span className="text-xs bg-green-100 text-green-800 px-2.5 py-1 rounded-full font-semibold">
                    Free
                  </span>
                )}
                {ad.feeType === "paid" && (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-semibold">
                    Paid{ad.price ? ` · ${ad.price}` : ""}
                  </span>
                )}
                {ad.district && (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                    {ad.district}
                  </span>
                )}
              </div>

              <div className="space-y-3 mb-6">
                {ad.eventDate && (
                  <div className="flex gap-3 items-start">
                    <span className="text-lg">🕒</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">When</p>
                      <p className="text-sm text-gray-800">{formatDate(ad.eventDate)}</p>
                    </div>
                  </div>
                )}

                {ad.district && (
                  <div className="flex gap-3 items-start">
                    <span className="text-lg">📍</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Where</p>
                      <p className="text-sm text-gray-800">{ad.district}</p>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-gray-700 whitespace-pre-wrap mb-6">{ad.description}</p>

              <div className="flex flex-wrap gap-3">
                {ad.phone && (
                  <a
                    href={`https://wa.me/${ad.phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#25D366] text-white font-semibold px-5 py-3 rounded-xl"
                  >
                    WhatsApp / RSVP
                  </a>
                )}
                {ad.link && (
                  <a
                    href={ad.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-900 text-white font-semibold px-5 py-3 rounded-xl"
                  >
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