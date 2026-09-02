"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db, storage } from "@/lib/firebase";
import { addDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export default function ClaimPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [businessId, setBusinessId] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerWhatsapp, setOwnerWhatsapp] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [note, setNote] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getDocs(collection(db, "businesses")).then((snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((b: any) => (b.claimStatus || "Unclaimed") !== "Claimed")
        .sort((a: any, b: any) => String(a.name).localeCompare(String(b.name)));
      setBusinesses(data);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const biz = businesses.find((b) => b.id === businessId);
    if (!biz || !ownerName.trim() || !ownerWhatsapp.trim()) {
      setMessage("Please choose a business and enter your name and WhatsApp.");
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
        businessId: biz.id,
        businessName: biz.name,
        ownerName: ownerName.trim(),
        ownerWhatsapp: ownerWhatsapp.trim(),
        ownerEmail: ownerEmail.trim(),
        note: note.trim(),
        proofUrl,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setBusinessId("");
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
        <div className="max-w-2xl mx-auto px-4 py-10">
          <Link href="/" className="text-sm text-[#006B3F] font-medium">← Back to Home</Link>
          <h1 className="text-3xl font-bold mt-4 mb-2">Claim your business</h1>
          <p className="text-gray-600 mb-6">
            If your shop is already on SaloneReviews, send proof that you run it.
            After we approve, you can add the free photo and paid extra photos.
          </p>
          <form onSubmit={handleSubmit} className="bg-white border rounded-2xl p-6 space-y-4">
            <select
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
              required
            >
              <option value="">Select your business</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} — {b.area || b.district}
                </option>
              ))}
            </select>
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
              <p className={`text-sm ${message.toLowerCase().includes("fail") || message.toLowerCase().includes("please") ? "text-red-500" : "text-green-600"}`}>
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