"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";

const ADMIN_EMAILS = ["gdos87@hotmail.com"];

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"' && src[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(cur.trim());
      cur = "";
    } else if (ch === "\n") {
      row.push(cur.trim());
      rows.push(row);
      row = [];
      cur = "";
    } else if (ch !== "\r") cur += ch;
  }
  if (cur.length || row.length) {
    row.push(cur.trim());
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c));
}

export default function AdminImportPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const isAdmin = !!(user && ADMIN_EMAILS.includes(user.email || ""));

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const handleFile = async (file: File) => {
    const text = await file.text();
    const table = parseCsv(text);
    if (table.length < 2) {
      setMessage("No data rows found. Save the Import sheet as CSV.");
      return;
    }
    const headers = table[0].map((h) => h.trim().toLowerCase());
    const idx = (name: string) => headers.indexOf(name);
    const parsed = table.slice(1).map((r) => ({
      listing_id: r[idx("listing_id")] || "",
      name: r[idx("name")] || "",
      category: r[idx("category")] || "Other",
      subcategory: r[idx("subcategory")] || "",
      district: r[idx("district")] || "Western Area Urban",
      area: r[idx("area")] || "",
      address: r[idx("address")] || "",
      description: r[idx("description")] || "",
      hours: r[idx("hours")] || "",
      phone: r[idx("phone")] || r[idx("whatsapp_or_phone")] || "",
      email: r[idx("email")] || "",
      website: r[idx("website")] || "",
      photo1: r[idx("photo1")] || r[idx("photo1 free")] || "",
      listing_status: r[idx("listing_status")] || "Live",
    })).filter((x) => x.name);
    setRows(parsed);
    setMessage(`${parsed.length} rows ready. Photos stay blank until you add them in Admin.`);
  };

  const handleImport = async () => {
    setLoading(true);
    setMessage("");
    try {
      const snap = await getDocs(collection(db, "businesses"));
      const existingNames = new Set(
        snap.docs.map((d) => String(d.data().name || "").trim().toLowerCase())
      );
      let added = 0;
      let skipped = 0;
      for (const r of rows) {
        const key = r.name.trim().toLowerCase();
        if (existingNames.has(key)) {
          skipped++;
          continue;
        }
        await addDoc(collection(db, "businesses"), {
          listingId: r.listing_id,
          name: r.name.trim(),
          category: r.category,
          subcategory: r.subcategory,
          district: r.district,
          area: r.area,
          address: r.address,
          description: r.description,
          hours: r.hours,
          phone: String(r.phone).replace(/\D/g, ""),
          email: r.email,
          website: r.website,
          photos: [],
          isPremium: false,
          claimStatus: "Unclaimed",
          source: "Excel batch",
          createdAt: serverTimestamp(),
          createdBy: user?.email || "",
        });
        existingNames.add(key);
        added++;
      }
      setMessage(`Imported ${added}. Skipped ${skipped} already on the site.`);
    } catch (e) {
      console.log(e);
      setMessage("Import failed.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) {
    router.push("/login");
    return null;
  }
  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center">Admin only</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Link href="/admin" className="text-sm text-[#006B3F] font-medium">← Back to Admin</Link>
          <h1 className="text-2xl font-bold mt-3 mb-2">Import listings</h1>
          <p className="text-sm text-gray-600 mb-4">
            Upload a CSV of the Import sheet. Photo file names are stored later — listings import with or without a photo.
          </p>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="mb-4"
          />
          {message && <p className="text-sm mb-4">{message}</p>}
          {rows.length > 0 && (
            <>
              <p className="text-sm mb-3">{rows.length} businesses in file</p>
              <button
                onClick={handleImport}
                disabled={loading}
                className="bg-[#006B3F] text-white font-semibold px-5 py-3 rounded-xl disabled:opacity-60 mb-6"
              >
                {loading ? "Importing..." : "Import to website"}
              </button>
              <div className="bg-white border rounded-2xl overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="p-2">ID</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Category</th>
                      <th className="p-2">District</th>
                      <th className="p-2">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.listing_id || r.name} className="border-t">
                        <td className="p-2">{r.listing_id}</td>
                        <td className="p-2">{r.name}</td>
                        <td className="p-2">{r.subcategory || r.category}</td>
                        <td className="p-2">{r.district}</td>
                        <td className="p-2">{r.phone || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}