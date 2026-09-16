"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { isAdminEmail } from "@/lib/roles";

const DISTRICTS = [
  "Western Area Urban","Western Area Rural","Bo","Kenema","Bombali","Port Loko","Kono",
  "Kailahun","Tonkolili","Kambia","Moyamba","Bonthe","Pujehun","Karene","Falaba","Koinadugu",
];

export default function AdminEventsPage() {
  const [ok, setOk] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});
  const [msg, setMsg] = useState("");

  async function load() {
    const snap = await getDocs(collection(db, "events"));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a: any, b: any) => String(b.date || "").localeCompare(String(a.date || "")));
    setRows(list);
  }

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setOk(!!u && isAdminEmail(u.email));
      if (u && isAdminEmail(u.email)) load();
    });
  }, []);

  function openEdit(e: any) {
    setOpenId(e.id);
    setForm({
      name: e.name || "",
      date: e.date || "",
      venue: e.venue || "",
      place: e.place || "",
      district: e.district || "Western Area Urban",
      price: e.price || "",
      contact: e.contact || "",
      link: e.link || "",
      description: e.description || "",
      photoPack: e.photoPack || "",
      photoFee: e.photoFee || "",
      status: e.status || "pending",
    });
    setMsg("");
  }

  async function save() {
    if (!openId) return;
    await updateDoc(doc(db, "events", openId), {
      name: form.name.trim(),
      date: form.date,
      venue: form.venue.trim(),
      place: form.place.trim(),
      district: form.district,
      price: form.price.trim(),
      contact: form.contact.trim(),
      link: form.link.trim(),
      description: form.description.trim(),
    });
    setMsg("Saved.");
    load();
  }

  async function setStatus(id: string, status: string) {
    await updateDoc(doc(db, "events", id), { status });
    if (openId === id) setForm((f: any) => ({ ...f, status }));
    load();
  }

  if (!ok) return <div className="min-h-screen flex items-center justify-center">Admin only</div>;

  const current = rows.find((r) => r.id === openId);

  return (
    <div className="min-h-screen bg-[#F7F8F5] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <Link href="/admin" className="text-sm text-[#006B3F]">← Admin</Link>
        <h1 className="text-2xl font-bold mt-2 mb-4">Event flyers</h1>
        <div className="space-y-3">
          {rows.map((e) => (
            <div key={e.id} className="bg-white border rounded-xl p-4">
              <div className="flex justify-between gap-2">
                <div>
                  <p className="font-semibold">{e.name}</p>
                  <p className="text-sm text-gray-500">
                    {e.date} · {e.venue} · {e.district} · {e.status}
                  </p>
                </div>
                <button type="button" onClick={() => openEdit(e)} className="text-sm text-[#006B3F] font-semibold">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>

        {current && (
          <div className="bg-white border rounded-2xl p-5 mt-6 space-y-3">
            <h2 className="font-bold">Review before approve</h2>
            <input className="w-full border rounded-xl px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="w-full border rounded-xl px-3 py-2" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <input className="w-full border rounded-xl px-3 py-2" placeholder="Venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
            <input className="w-full border rounded-xl px-3 py-2" placeholder="Place" value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} />
            <select className="w-full border rounded-xl px-3 py-2" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}>
              {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
            </select>
            <input className="w-full border rounded-xl px-3 py-2" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <input className="w-full border rounded-xl px-3 py-2" placeholder="Contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            <input className="w-full border rounded-xl px-3 py-2" placeholder="Link" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
            <textarea className="w-full border rounded-xl px-3 py-2" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <p className="text-sm text-gray-600">Pack: {form.photoFee || form.photoPack} · Status: {form.status}</p>
            <div className="flex flex-wrap gap-2">
              {(current.photos || []).map((url: string, i: number) => (
                <a key={url} href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt={`Photo ${i + 1}`} className="h-24 object-contain border rounded-lg" />
                </a>
              ))}
            </div>
            {current.receiptUrl && (
              <p className="text-sm">
                Receipt: <a className="text-[#006B3F] font-semibold" href={current.receiptUrl} target="_blank" rel="noreferrer">Open</a>
              </p>
            )}
            {msg && <p className="text-sm text-green-700">{msg}</p>}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={save} className="bg-gray-200 font-semibold px-4 py-2 rounded-xl">Save</button>
              <button type="button" onClick={() => setStatus(openId!, "approved")} className="bg-[#006B3F] text-white font-semibold px-4 py-2 rounded-xl">Approve</button>
              <button type="button" onClick={() => setStatus(openId!, "refused")} className="text-red-600 font-semibold px-4 py-2">Refuse</button>
              <button type="button" onClick={() => setOpenId(null)} className="px-4 py-2">Close</button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}