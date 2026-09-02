"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";

const ADMIN_EMAILS = ["gdos87@hotmail.com"];

export default function AdminClaimsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [claims, setClaims] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const isAdmin = !!(user && ADMIN_EMAILS.includes(user.email || ""));

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const load = async () => {
    const snap = await getDocs(collection(db, "claimRequests"));
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    data.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    setClaims(data);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const handleApprove = async (c: any) => {
    if (!window.confirm(`Approve claim for ${c.businessName}?`)) return;
    try {
      await updateDoc(doc(db, "businesses", c.businessId), {
        claimStatus: "Claimed",
        ownerName: c.ownerName || "",
        ownerWhatsapp: c.ownerWhatsapp || "",
        ownerEmail: c.ownerEmail || "",
        claimedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "claimRequests", c.id), {
        status: "approved",
        reviewedAt: serverTimestamp(),
      });
      setMessage(`Claimed: ${c.businessName}`);
      load();
    } catch (e) {
      console.log(e);
      setMessage("Failed to approve.");
    }
  };

  const handleReject = async (c: any) => {
    if (!window.confirm(`Reject claim for ${c.businessName}?`)) return;
    try {
      await updateDoc(doc(db, "claimRequests", c.id), {
        status: "rejected",
        reviewedAt: serverTimestamp(),
      });
      setMessage(`Rejected: ${c.businessName}`);
      load();
    } catch (e) {
      console.log(e);
      setMessage("Failed to reject.");
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) {
    router.push("/login");
    return null;
  }
  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center">Admin only</div>;

  const pending = claims.filter((c) => c.status === "pending");
  const others = claims.filter((c) => c.status !== "pending");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href="/admin" className="text-sm text-[#006B3F] font-medium">← Back to Admin</Link>
          <h1 className="text-2xl font-bold mt-3 mb-4">Business claims</h1>
          {message && <p className="text-sm mb-4 text-green-700">{message}</p>}
          <h2 className="font-semibold mb-3">Pending ({pending.length})</h2>
          {pending.length === 0 ? (
            <p className="text-gray-500 mb-8">No pending claims.</p>
          ) : (
            <div className="space-y-4 mb-8">
              {pending.map((c) => (
                <div key={c.id} className="bg-white border rounded-2xl p-5">
                  <h3 className="font-semibold">{c.businessName}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {c.ownerName} · {c.ownerWhatsapp} · {c.ownerEmail || "no email"}
                  </p>
                  {c.note && <p className="text-sm mt-2">{c.note}</p>}
                  {c.proofUrl && (
                    <a href={c.proofUrl} target="_blank" rel="noreferrer">
                      <img src={c.proofUrl} alt="Proof" className="w-28 h-28 object-cover rounded-lg border mt-3" />
                    </a>
                  )}
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => handleApprove(c)} className="bg-[#006B3F] text-white font-semibold px-4 py-2 rounded-xl">
                      Approve claim
                    </button>
                    <button onClick={() => handleReject(c)} className="bg-red-50 text-red-600 font-semibold px-4 py-2 rounded-xl">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <h2 className="font-semibold mb-3">Reviewed ({others.length})</h2>
          {others.map((c) => (
            <div key={c.id} className="bg-white border rounded-2xl p-4 mb-3 flex justify-between">
              <span>{c.businessName} — {c.ownerName}</span>
              <span className="text-sm">{c.status}</span>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}