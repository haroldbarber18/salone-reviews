"use client";

/**
 * DROP-IN: save as app/admin/materials/page.tsx
 *
 * Then on app/admin/page.tsx add one link next to Claims:
 *   <Link href="/admin/materials" className="text-[#006B3F] font-medium">Materials jobs</Link>
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";

const ADMIN_EMAILS = ["gdos87@hotmail.com"];

function itemLine(it: any) {
  const bits = [
    it?.name,
    Array.isArray(it?.chips) && it.chips.length ? it.chips.join(", ") : "",
    it?.qty ? `— ${it.qty}` : "",
  ].filter(Boolean);
  return bits.join(" ");
}

function shopText(j: any) {
  const items = Array.isArray(j.items) && j.items.length
    ? j.items.map((it: any) => `- ${itemLine(it)}`).join("\n")
    : "- (see attached list / notes)";
  return [
    `SR-${j.code}`,
    `Zone: ${j.zone || ""}`,
    `Site: ${j.area || ""}`,
    `Stage: ${j.stage || ""}`,
    `Caretaker: ${j.caretakerName || ""}  ${j.caretakerWhatsapp || ""}`,
    j.supervisorName ? `Supervisor: ${j.supervisorName}  ${j.supervisorWhatsapp || ""}` : "",
    "",
    "Please quote / invoice:",
    items,
    j.notes ? `\nNotes: ${j.notes}` : "",
    "",
    "Reply with proforma. Do not contact the buyer.",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function buyerText(j: any) {
  const items = Array.isArray(j.items) && j.items.length
    ? j.items.map((it: any) => `- ${itemLine(it)}`).join("\n")
    : "- (list as submitted)";
  return [
    `Job SR-${j.code}`,
    `Zone: ${j.zone || ""}`,
    `Site: ${j.area || ""}`,
    "",
    "Your list:",
    items,
    "",
    "Total: Le ______  (Harold to fill)",
    "Pay in Freetown. Use reference " + (j.code || "") + ".",
    "When payment lands we release the shop to your caretaker.",
    j.caretakerName ? `Caretaker: ${j.caretakerName}` : "",
  ].join("\n");
}

async function copy(text: string) {
  await navigator.clipboard.writeText(text);
}

export default function AdminMaterialsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [openId, setOpenId] = useState("");
  const [copied, setCopied] = useState("");
  const isAdmin = !!(user && ADMIN_EMAILS.includes(user.email || ""));

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const snap = await getDocs(collection(db, "materials_quotes"));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setJobs(data);
    })();
  }, [isAdmin]);

  async function onCopy(kind: string, text: string) {
    try {
      await copy(text);
      setCopied(kind);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      setCopied("fail");
    }
  }

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) {
    router.push("/login");
    return null;
  }
  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center">Admin access only</div>;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <Link href="/admin" className="text-sm text-[#006B3F]">← Admin</Link>
        <h1 className="text-2xl font-bold mt-2 mb-1">Materials jobs</h1>
        <p className="text-sm text-gray-600 mb-6">
          Copy for shop — paste to the yard. Copy for buyer — paste to the diaspora. Shop never gets the buyer number.
        </p>
        {copied === "fail" ? (
          <p className="text-sm text-red-600 mb-3">Could not copy. Long-press the text instead.</p>
        ) : copied ? (
          <p className="text-sm text-green-700 mb-3">Copied. Paste into WhatsApp.</p>
        ) : null}

        {jobs.length === 0 && <p className="text-gray-500">No jobs yet.</p>}

        <div className="space-y-3">
          {jobs.map((j) => {
            const open = openId === j.id;
            return (
              <div key={j.id} className="border rounded-2xl p-4 bg-white">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setOpenId(open ? "" : j.id)}
                >
                  <p className="font-bold">SR-{j.code}</p>
                  <p className="text-sm text-gray-600">
                    {j.fullName} · {j.intent} · {j.zone} · {j.area}
                  </p>
                </button>
                {open && (
                  <div className="mt-3 space-y-3">
                    <p className="text-sm">
                      Buyer WhatsApp {j.whatsapp} (you only — not on shop copy)
                    </p>
                    <pre className="text-xs bg-gray-50 border rounded-xl p-3 whitespace-pre-wrap">
                      {shopText(j)}
                    </pre>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl bg-[#006B3F] text-white text-sm"
                        onClick={() => onCopy(`shop-${j.code}`, shopText(j))}
                      >
                        Copy for shop
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl border text-sm"
                        onClick={() => onCopy(`buyer-${j.code}`, buyerText(j))}
                      >
                        Copy for buyer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}