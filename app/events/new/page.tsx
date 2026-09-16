"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db, storage } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

const DISTRICTS = [
  "Western Area Urban","Western Area Rural","Bo","Kenema","Bombali","Port Loko","Kono",
  "Kailahun","Tonkolili","Kambia","Moyamba","Bonthe","Pujehun","Karene","Falaba","Koinadugu",
];
const ORANGE = "075294553";

async function uploadOne(folder: string, file: File) {
  const r = ref(storage, `${folder}/${Date.now()}-${file.name}`);
  await uploadBytes(r, file);
  return getDownloadURL(r);
}

export default function NewEventPage() {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [place, setPlace] = useState("");
  const [district, setDistrict] = useState("Western Area Urban");
  const [price, setPrice] = useState("");
  const [contact, setContact] = useState("");
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");
  const [pack, setPack] = useState<"free1" | "paid3">("free1");
  const [files, setFiles] = useState<File[]>([]);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const maxPhotos = pack === "paid3" ? 3 : 1;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!name.trim() || !date || !venue.trim() || !contact.trim()) {
      return setErr("Name, date, venue and sender WhatsApp are required.");
    }
    if (files.length === 0) return setErr("Add the flyer photo.");
    if (files.length > maxPhotos) {
      return setErr(pack === "free1" ? "Free pack is 1 photo." : "Maximum 3 photos.");
    }
    if (pack === "paid3" && !receipt) {
      return setErr("Attach the Orange Money screenshot for NLe 200.");
    }
    setBusy(true);
    try {
      const photos: string[] = [];
      for (const f of files.slice(0, maxPhotos)) {
        photos.push(await uploadOne("events", f));
      }
      let receiptUrl = "";
      if (receipt) receiptUrl = await uploadOne("events-receipts", receipt);
      await addDoc(collection(db, "events"), {
        name: name.trim(),
        date,
        venue: venue.trim(),
        place: place.trim(),
        district,
        price: price.trim(),
        contact: contact.trim(),
        link: link.trim(),
        description: description.trim(),
        photos,
        receiptUrl,
        photoPack: pack,
        photoFee: pack === "paid3" ? "NLe 200 / month" : "free",
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setDone(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not send.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F8F5] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-8">
        <Link href="/" className="text-sm text-[#006B3F]">← Home</Link>
        <h1 className="text-2xl font-bold mt-2 mb-1">Post an event</h1>
        <p className="text-sm text-gray-600 mb-4">
          1 flyer photo free. 3 photos NLe 200 a month. After approval it shows in Events & Flyers until the event date.
        </p>
        {done ? (
          <div className="bg-white border rounded-2xl p-5">
            Sent. You will see it in Events & Flyers after approval.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="bg-white border rounded-2xl p-5 space-y-3">
            <input className="w-full border rounded-xl px-3 py-2" placeholder="Event name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="w-full border rounded-xl px-3 py-2" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <input className="w-full border rounded-xl px-3 py-2" placeholder="Venue" value={venue} onChange={(e) => setVenue(e.target.value)} />
            <input className="w-full border rounded-xl px-3 py-2" placeholder="Place / area" value={place} onChange={(e) => setPlace(e.target.value)} />
            <select className="w-full border rounded-xl px-3 py-2" value={district} onChange={(e) => setDistrict(e.target.value)}>
              {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
            </select>
            <input className="w-full border rounded-xl px-3 py-2" placeholder="Price (optional)" value={price} onChange={(e) => setPrice(e.target.value)} />
            <input className="w-full border rounded-xl px-3 py-2" placeholder="Sender's WhatsApp if we need to contact you" value={contact} onChange={(e) => setContact(e.target.value)} />
            <p className="text-xs text-gray-500">Private. SaloneReviews uses this if we need to reach you about this flyer.</p>
            <input className="w-full border rounded-xl px-3 py-2" placeholder="Link (optional)" value={link} onChange={(e) => setLink(e.target.value)} />
            <textarea className="w-full border rounded-xl px-3 py-2" rows={4} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="border rounded-xl p-3 space-y-2 text-sm">
              <p className="font-semibold">Flyer photos</p>
              <label className="flex items-start gap-2">
                <input type="radio" checked={pack === "free1"} onChange={() => { setPack("free1"); setFiles((p) => p.slice(0, 1)); setReceipt(null); }} />
                <span>1 photo — free</span>
              </label>
              <label className="flex items-start gap-2">
                <input type="radio" checked={pack === "paid3"} onChange={() => setPack("paid3")} />
                <span>Up to 3 photos — NLe 200 a month</span>
              </label>
              <input
                type="file"
                accept="image/*"
                multiple={pack === "paid3"}
                onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, maxPhotos))}
              />
              <p className="text-xs text-gray-500">{files.length}/{maxPhotos} flyer photo(s). First photo is the home flyer.</p>
              {pack === "paid3" && (
                <div className="pt-2 border-t space-y-2">
                  <p>Send NLe 200 to Orange Money <span className="font-semibold">{ORANGE}</span></p>
                  <p className="text-xs text-gray-500">Attach the receipt screenshot (this can be the 4th file).</p>
                  <input type="file" accept="image/*" onChange={(e) => setReceipt(e.target.files?.[0] || null)} />
                </div>
              )}
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <button disabled={busy} className="w-full bg-[#006B3F] text-white font-semibold py-3 rounded-xl">
              {busy ? "Sending…" : "Submit for approval"}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}