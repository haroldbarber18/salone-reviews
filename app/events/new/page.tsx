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

export default function NewEventPage() {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [place, setPlace] = useState("");
  const [district, setDistrict] = useState("Western Area Urban");
  const [fee, setFee] = useState<"nothing" | "paid">("nothing");
  const [feeAmount, setFeeAmount] = useState("");
  const [contact, setContact] = useState("");
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!name.trim() || !date || !venue.trim() || !contact.trim()) {
      return setErr("Name, date, venue and contact are required.");
    }
    setBusy(true);
    try {
      const photos: string[] = [];
      for (const f of files.slice(0, 6)) {
        const r = ref(storage, `events/${Date.now()}-${f.name}`);
        await uploadBytes(r, f);
        photos.push(await getDownloadURL(r));
      }
      await addDoc(collection(db, "events"), {
        name: name.trim(),
        date,
        venue: venue.trim(),
        place: place.trim(),
        district,
        fee,
        feeAmount: fee === "paid" ? feeAmount.trim() : "",
        contact: contact.trim(),
        link: link.trim(),
        description: description.trim(),
        photos,
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
        <Link href="/events" className="text-sm text-[#006B3F]">← Events</Link>
        <h1 className="text-2xl font-bold mt-2 mb-1">Post an event</h1>
        <p className="text-sm text-gray-600 mb-4">Free. We list it after approval. It comes down after the event date.</p>
        {done ? (
          <div className="bg-white border rounded-2xl p-5">
            Sent. You will see it on Events after approval.
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
            <div className="flex gap-4 text-sm">
              <label><input type="radio" checked={fee === "nothing"} onChange={() => setFee("nothing")} /> Free / nothing</label>
              <label><input type="radio" checked={fee === "paid"} onChange={() => setFee("paid")} /> Paid</label>
            </div>
            {fee === "paid" && (
              <input className="w-full border rounded-xl px-3 py-2" placeholder="Fee amount (e.g. Le 50)" value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} />
            )}
            <input className="w-full border rounded-xl px-3 py-2" placeholder="Contact / WhatsApp" value={contact} onChange={(e) => setContact(e.target.value)} />
            <input className="w-full border rounded-xl px-3 py-2" placeholder="Link (optional)" value={link} onChange={(e) => setLink(e.target.value)} />
            <textarea className="w-full border rounded-xl px-3 py-2" rows={4} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            <p className="text-xs text-gray-500">Up to 6 photos. First photo is the flyer.</p>
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