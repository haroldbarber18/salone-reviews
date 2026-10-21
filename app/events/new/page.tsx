"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db, storage } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

const ORANGE = "075294553";

export default function NewEventPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [link, setLink] = useState("");
  const [district, setDistrict] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [feeType, setFeeType] = useState<"" | "free" | "paid">("");
  const [price, setPrice] = useState("");
  const [pack, setPack] = useState<"free1" | "paid3">("free1");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const maxPhotos = pack === "paid3" ? 3 : 1;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!title.trim() || !description.trim() || !eventDate) {
      return setErr("Title, description and event start date are required.");
    }
    if (imageFiles.length === 0) return setErr("Add the flyer photo.");
    if (pack === "paid3" && !receipt) return setErr("Attach the Orange Money screenshot.");
    setBusy(true);
    try {
      const photos: string[] = [];
      for (const file of imageFiles.slice(0, maxPhotos)) {
        const r = ref(storage, `ads/${Date.now()}-${file.name}`);
        await uploadBytes(r, file);
        photos.push(await getDownloadURL(r));
      }
      let receiptUrl = "";
      if (receipt) {
        const r = ref(storage, `ads-receipts/${Date.now()}-${receipt.name}`);
        await uploadBytes(r, receipt);
        receiptUrl = await getDownloadURL(r);
      }
      await addDoc(collection(db, "ads"), {
        type: "event",
        placement: "left",
        feeType,
        price: feeType === "paid" ? price.trim() : "",
        title: title.trim(),
        description: description.trim(),
        phone: phone.trim(),
        link: link.trim(),
        district: district.trim(),
        eventDate,
        eventEndDate: eventEndDate || "",
        startDate: startDate || "",
        endDate: endDate || "",
        photos,
        imageUrl: photos[0] || "",
        receiptUrl,
        active: false,
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
          1 photo free. Up to 3 photos NLe 200 a month. Appears after Admin approval.
        </p>
        {done ? (
          <div className="bg-white border rounded-2xl p-5">Sent. Waiting for Admin approval.</div>
        ) : (
          <form onSubmit={onSubmit} className="bg-white border rounded-2xl p-5 space-y-3">
            <input className="w-full border rounded-xl px-3 py-2" placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea className="w-full border rounded-xl px-3 py-2" rows={4} placeholder="Full description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="grid sm:grid-cols-2 gap-3">
              <input className="w-full border rounded-xl px-3 py-2" placeholder="WhatsApp / Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <input className="w-full border rounded-xl px-3 py-2" placeholder="External link (optional)" value={link} onChange={(e) => setLink(e.target.value)} />
            </div>
            <input className="w-full border rounded-xl px-3 py-2" placeholder="Venue / District" value={district} onChange={(e) => setDistrict(e.target.value)} />
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Event start date</label>
                <input className="w-full border rounded-xl px-3 py-2" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-500">Event end date (optional)</label>
                <input className="w-full border rounded-xl px-3 py-2" type="date" value={eventEndDate} onChange={(e) => setEventEndDate(e.target.value)} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Ad start (display period)</label>
                <input className="w-full border rounded-xl px-3 py-2" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-500">Ad end / expiry</label>
                <input className="w-full border rounded-xl px-3 py-2" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500">Fee</label>
              <select className="w-full border rounded-xl px-3 py-2" value={feeType} onChange={(e) => setFeeType(e.target.value as any)}>
                <option value="">No fee label</option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            {feeType === "paid" && (
              <input className="w-full border rounded-xl px-3 py-2" placeholder="Price (e.g. NLe 200 / month)" value={price} onChange={(e) => setPrice(e.target.value)} />
            )}
            <div className="border rounded-xl p-3 space-y-2 text-sm">
              <p className="font-semibold">Flyer photos</p>
              <label className="flex items-center gap-2">
                <input type="radio" checked={pack === "free1"} onChange={() => { setPack("free1"); setImageFiles([]); setReceipt(null); }} />
                1 photo — free
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={pack === "paid3"} onChange={() => setPack("paid3")} />
                Up to 3 photos — NLe 200 a month
              </label>
              <input type="file" accept="image/*" multiple={pack === "paid3"} onChange={(e) => setImageFiles(Array.from(e.target.files || []).slice(0, maxPhotos))} />
              <p className="text-xs text-gray-500">{imageFiles.length}/{maxPhotos}</p>
              {pack === "paid3" && (
                <div className="pt-2 border-t space-y-2">
                  <p>Send NLe 200 to Orange Money <b>{ORANGE}</b></p>
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