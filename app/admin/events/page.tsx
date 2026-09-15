"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { isAdminEmail } from "@/lib/roles";

export default function AdminEventsPage() {
  const [ok, setOk] = useState(false);
  const [rows, setRows] = useState<any[]>([]);

  async function load() {
    const snap = await getDocs(collection(db, "events"));
    setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setOk(!!u && isAdminEmail(u.email));
      if (u && isAdminEmail(u.email)) load();
    });
  }, []);

  async function setStatus(id: string, status: string) {
    await updateDoc(doc(db, "events", id), { status });
    load();
  }

  if (!ok) return <div className="min-h-screen flex items-center justify-center">Admin only</div>;

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
                <div className="flex gap-2 text-sm">
                  <button onClick={() => setStatus(e.id, "approved")} className="text-[#006B3F] font-semibold">Approve</button>
                  <button onClick={() => setStatus(e.id, "refused")} className="text-red-600">Refuse</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}