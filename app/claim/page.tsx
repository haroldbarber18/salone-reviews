"use client";

/**
 * DROP-IN: replace app/claim/page.tsx
 * Type 2+ letters → list of shops appears. Tap one to lock the official name.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db, storage } from "@/lib/firebase";
import { addDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

type Biz = { id: string; name: string; area?: string; district?: string };

function normName(s: string) {
  return String(s || "")
    .toLowerCase()
    .replace(/['’`´]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function ClaimPage() {
  const [list, setList] = useState<Biz[]>([]);
  const [businessName, setBusinessName] = useState("");
  const [picked, setPicked] = useState<Biz | null>(null);
  const [showSuggest, setShowSuggest] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [ownerWhatsapp, setOwnerWhatsapp] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [note, setNote] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getDocs(collection(db, "businesses")).then((snap) => {
      setList(
        snap.docs
          .map((d) => {
            const x = d.data() as any;
            return {
              id: d.id,
              name: String(x.name || ""),
              area: x.area || "",
              district: x.district || "",
            };
          })
          .filter((b) => b.name)
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    });
  }, []);

  const suggestions = useMemo(() => {
    const q = normName(businessName);
    if (q.length < 2) return [];
    return list
      .filter((b) => {
        const n = normName(b.name);
        const place = normName(`${b.area} ${b.district}`);
        return n.includes(q) || place.includes(q);
      })
      .slice(0, 8);
  }, [businessName, list]);

  const pick = (b: Biz) => {
    setPicked(b);
    setBusinessName(b.name);
    setShowSuggest(false);
    setMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim() || !ownerWhatsapp.trim()) {
      setMessage("Please enter your name and WhatsApp.");
      return;
    }
    const typed = normName(businessName);
    let match = picked && normName(picked.name) === typed ? picked : null;
    if (!match) {
      const exact = list.filter((b) => normName(b.name) === typed);
      if (exact.length === 1) match = exact[0];
      else if (exact.length > 1) {
        setMessage("More than one shop has that name. Type more or pick from the list.");
        setShowSuggest(true);
        return;
      }
    }
    if (!match && typed.length >= 3) {
      const close = list.filter(
        (b) => normName(b.name).includes(typed) || typed.includes(normName(b.name))
      );
      if (close.length === 1) match = close[0];
      else if (close.length > 1) {
        setMessage("Pick the shop from the list under the name box.");
        setShowSuggest(true);
        return;
      }
    }
    if (!match) {
      setMessage("Type 2 letters and tap your shop in the list.");
      setShowSuggest(true);
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      let proofUrl = "";
      if (proof) {
        const fileRef = ref(storage, `claim-proofs/${Date.now()}-${proof.name}`);
        await uploadBytes(fileRef, proof);
        proofUrl = await getDownloadURL(fileRef);
      }
      await addDoc(collection(db, "claimRequests"), {
        businessId: match.id,
        businessName: match.name,
        ownerName: ownerName.trim(),
        ownerWhatsapp: ownerWhatsapp.trim(),
        ownerEmail: ownerEmail.trim(),
        note: note.trim(),
        proofUrl,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setBusinessName("");
      setPicked(null);
      setOwnerName("");
      setOwnerWhatsapp("");
      setOwnerEmail("");
      setNote("");
      setProof(null);
      setMessage("Claim sent. We will check your proof and contact you on WhatsApp.");
    } catch (err) {
      console.log(err);
      setMessage("Failed to send claim. WhatsApp +232 75 294 553 instead.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Claim your business</h1>
          <p className="text-sm text-gray-600 mb-6">
            Type part of the name (even “rabie”) and tap the shop. You do not need the exact spelling.
          </p>
          <form onSubmit={handleSubmit} className="bg-white border rounded-2xl p-5 space-y-3">
            <div className="relative">
              <input
                value={businessName}
                onChange={(e) => {
                  setBusinessName(e.target.value);
                  setPicked(null);
                  setShowSuggest(true);
                }}
                onFocus={() => setShowSuggest(true)}
                placeholder="Start typing the shop name"
                className="w-full border rounded-xl px-4 py-3"
                autoComplete="off"
                required
              />
              {picked && (
                <p className="text-xs text-[#006B3F] mt-1">
                  Selected: {picked.name}
                  {picked.district ? ` · ${picked.district}` : ""}
                </p>
              )}
              {showSuggest && suggestions.length > 0 && !picked && (
                <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border rounded-xl shadow-md max-h-56 overflow-y-auto">
                  {suggestions.map((b) => (
                    <li key={b.id}>
                      <button
                        type="button"
                        onClick={() => pick(b)}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <span className="block text-sm font-medium text-gray-900">{b.name}</span>
                        <span className="block text-xs text-gray-500">
                          {[b.area, b.district].filter(Boolean).join(" · ")}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <input
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Your full name"
              className="w-full border rounded-xl px-4 py-3"
              required
            />
            <input
              value={ownerWhatsapp}
              onChange={(e) => setOwnerWhatsapp(e.target.value)}
              placeholder="WhatsApp number"
              className="w-full border rounded-xl px-4 py-3"
              required
            />
            <input
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="Email (optional)"
              className="w-full border rounded-xl px-4 py-3"
            />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="How can we check this is your business?"
              rows={3}
              className="w-full border rounded-xl px-4 py-3"
            />
            <div>
              <label className="block text-sm font-medium mb-1">Proof photo (shop, sign, or registration)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProof(e.target.files?.[0] || null)}
                className="w-full border rounded-xl px-4 py-3 bg-white"
              />
            </div>
            {message && (
              <p
                className={`text-sm ${
                  message.toLowerCase().includes("fail") ||
                  message.toLowerCase().includes("please") ||
                  message.toLowerCase().includes("could not") ||
                  message.toLowerCase().includes("more than") ||
                  message.toLowerCase().includes("type 2") ||
                  message.toLowerCase().includes("pick the")
                    ? "text-red-500"
                    : "text-green-600"
                }`}
              >
                {message}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-[#006B3F] text-white font-semibold px-6 py-3 rounded-xl disabled:opacity-60"
            >
              {loading ? "Sending..." : "Submit claim"}
            </button>
          </form>
          <p className="text-sm text-gray-600 mt-6">
            Or WhatsApp{" "}
            <a className="text-[#006B3F] font-medium" href="https://wa.me/23275294553" target="_blank" rel="noreferrer">
              +232 75 294 553
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}