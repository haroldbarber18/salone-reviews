"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function ServiceViewPage() {
  const [id, setId] = useState<string | null>(null);
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setId(params.get("id"));
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError("Missing service id");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "essentialServices", id));
        if (snap.exists()) {
          setItem({ id: snap.id, ...snap.data() });
          setError("");
        } else {
          setError("Service not found");
          setItem(null);
        }
      } catch {
        setError("Failed to load service");
        setItem(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p>{error || "Service not found"}</p>
        <Link href="/services/government" className="text-[#006B3F] font-medium">
          ← Back to list
        </Link>
      </div>
    );
  }

  const backHref =
    item.type === "financial"
      ? "/services/financial"
      : item.type === "emergency"
      ? "/services/emergency"
      : "/services/government";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link href={backHref} className="text-sm text-[#006B3F] font-medium">
            ← Back to list
          </Link>

          <div className="bg-white border rounded-2xl p-6 mt-4">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                {item.type}
              </span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                {item.district}
              </span>
            </div>

            <h1 className="text-2xl font-bold mb-2">{item.name}</h1>

            {item.area && (
              <p className="text-sm text-[#006B3F] mb-3">{item.area}</p>
            )}

            <p className="text-gray-700 whitespace-pre-wrap mb-5">
              {item.description}
            </p>

            {item.address && (
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Address:</span> {item.address}
              </p>
            )}

            {item.hours && (
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-medium">Hours:</span> {item.hours}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              {item.phone && (
                <a
                  href={`tel:${item.phone}`}
                  className="bg-[#006B3F] text-white font-semibold px-5 py-3 rounded-xl"
                >
                  Call
                </a>
              )}
              {item.whatsapp && (
                <a
                  href={`https://wa.me/${item.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] text-white font-semibold px-5 py-3 rounded-xl"
                >
                  WhatsApp
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