"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { isAdminEmail, isHardcodedStaff, normEmail } from "@/lib/roles";

const categories = [
  "Tradesmen","Auto","Food","Hotels","Beauty","Home","Health & Medical","Education & Training",
  "Money & Insurance","Legal & Government","Shopping & Fashion","Electronics & Tech",
  "Events & Entertainment","Media & Publishing","Business Services","Animals & Pets",
  "Sports & Fitness","Utilities & Energy","Public & Community","Other",
];
const districts = [
  "Western Area Urban","Western Area Rural","Bo","Kenema","Bombali","Port Loko","Kono",
  "Kailahun","Tonkolili","Kambia","Moyamba","Bonthe","Pujehun","Karene","Falaba","Koinadugu",
];

export default function StaffPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [staffEmails, setStaffEmails] = useState<string[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [listQuery, setListQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [editingPendingId, setEditingPendingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Tradesmen");
  const [customCategory, setCustomCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [district, setDistrict] = useState("Western Area Urban");
  const [area, setArea] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [hours, setHours] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);

  const email = normEmail(user?.email);
  const isAdmin = isAdminEmail(email);
  const isStaff = !!(email && (isHardcodedStaff(email) || staffEmails.includes(email)));

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecking(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "staffHelpers"));
        setStaffEmails(snap.docs.map((d) => normEmail((d.data() as any).email)));
      } catch {
        setStaffEmails([]);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!email || (!isStaff && !isAdmin)) return;
    (async () => {
      const bSnap = await getDocs(collection(db, "businesses"));
      setBusinesses(bSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      try {
        const rq = query(collection(db, "businessRequests"), where("submittedBy", "==", email));
        const rSnap = await getDocs(rq);
        const rows = rSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        rows.sort((a: any, b: any) => Number(b.createdAtMs || 0) - Number(a.createdAtMs || 0));
        setMyRequests(rows.slice(0, 4));
      } catch {
        setMyRequests([]);
      }
    })();
  }, [email, isStaff, isAdmin]);

  const searchHits = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    if (q.length < 3) return [];
    return businesses
      .filter((b) =>
        [b.name, b.category, b.subcategory, b.district, b.area, b.phone, b.whatsapp]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" }))
      .slice(0, 15);
  }, [businesses, listQuery]);

  const resetForm = () => {
    setEditingPendingId(null);
    setName("");
    setCategory("Tradesmen");
    setCustomCategory("");
    setSubcategory("");
    setDistrict("Western Area Urban");
    setArea("");
    setPhone("");
    setWhatsapp("");
    setHours("");
    setWebsite("");
    setDescription("");
    setPhotoFiles([]);
    setExistingPhotos([]);
  };

  const startEditPending = (r: any) => {
    if (r.status && r.status !== "pending") return;
    const cat = String(r.category || "Tradesmen");
    const known = categories.includes(cat);
    setEditingPendingId(r.id);
    setName(r.name || "");
    setCategory(known ? cat : "Tradesmen");
    setCustomCategory(r.customCategory || (!known ? cat : ""));
    setSubcategory(r.subcategory || (!known ? cat : ""));
    setDistrict(r.district || "Western Area Urban");
    setArea(r.area || "");
    setPhone(r.phone || "");
    setWhatsapp(r.whatsapp || "");
    setHours(r.hours || "");
    setWebsite(r.website || "");
    setDescription(r.description || "");
    setExistingPhotos(Array.isArray(r.photos) ? r.photos : []);
    setPhotoFiles([]);
    setMessage("Editing pending listing. Change the form at the top, then Update pending.");
    setTimeout(() => {
      document.getElementById("listing-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      setMessage("Name and description are required.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const uploaded: string[] = [];
      for (const file of photoFiles) {
        const r = ref(storage, `business-requests/${Date.now()}-${file.name}`);
        await uploadBytes(r, file);
        uploaded.push(await getDownloadURL(r));
      }
      const photos = [...existingPhotos, ...uploaded].slice(0, 6);
      const payload = {
        name: name.trim(),
        category: category === "Other" && customCategory.trim() ? customCategory.trim() : category,
        customCategory: customCategory.trim(),
        subcategory: subcategory.trim(),
        district,
        area: area.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        hours: hours.trim(),
        website: website.trim(),
        description: description.trim(),
        photos,
        status: "pending",
        source: "staff",
        submittedBy: email,
        createdAt: serverTimestamp(),
        createdAtMs: Date.now(),
      };
      if (editingPendingId) {
        const { createdAt, createdAtMs, submittedBy, source, ...rest } = payload as any;
        await updateDoc(doc(db, "businessRequests", editingPendingId), {
          ...rest,
          status: "pending",
          updatedAtMs: Date.now(),
        });
        setMessage("Sent and will be live within hours.");
      } else {
        await addDoc(collection(db, "businessRequests"), payload);
        await addDoc(collection(db, "staffActivity"), {
          actorEmail: email,
          action: "staff-submitted-listing",
          businessName: name.trim(),
          details: "pending - not live",
          createdAt: serverTimestamp(),
          createdAtMs: Date.now(),
        });
        setMessage("Sent and will be live within hours.");
      }
      resetForm();
      const rq = query(collection(db, "businessRequests"), where("submittedBy", "==", email));
      const rSnap = await getDocs(rq);
      const rows = rSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      rows.sort((a: any, b: any) => Number(b.createdAtMs || 0) - Number(a.createdAtMs || 0));
      setMyRequests(rows.slice(0, 4));
    } catch (err: any) {
      setMessage(err?.message || "Could not save. Ask Admin to check Firebase rules.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) {
    router.push("/login");
    return null;
  }
  if (!isStaff && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        IT staff access only
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-1">IT Staff</h1>
          <p className="text-sm text-gray-600 mb-6">
            Add a listing for Admin to approve. Search one name at a time. You cannot publish live.
          </p>

          <form id="listing-form" onSubmit={handleSubmit} className="bg-white border rounded-2xl p-6 mb-8 space-y-4">
            <h2 className="text-lg font-bold">{editingPendingId ? "Edit pending listing" : "Submit a listing"}</h2>
            {editingPendingId && (
              <p className="text-sm font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
                You are editing a pending listing. Scroll is at this form. Press Update pending when done.
              </p>
            )}
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Business name" className="w-full border rounded-xl px-4 py-3" required />
            <div className="grid sm:grid-cols-2 gap-4">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border rounded-xl px-4 py-3">
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input value={subcategory} onChange={(e) => setSubcategory(e.target.value)} placeholder="Subcategory (optional)" className="w-full border rounded-xl px-4 py-3" />
            </div>
            {category === "Other" && (
              <input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Custom category" className="w-full border rounded-xl px-4 py-3" />
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <select value={district} onChange={(e) => setDistrict(e.target.value)} className="w-full border rounded-xl px-4 py-3">
                {districts.map((d) => <option key={d}>{d}</option>)}
              </select>
              <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Area / street" className="w-full border rounded-xl px-4 py-3" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="w-full border rounded-xl px-4 py-3" />
              <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp" className="w-full border rounded-xl px-4 py-3" />
            </div>
            <input value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Opening hours" className="w-full border rounded-xl px-4 py-3" />
            <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Website or Facebook page" className="w-full border rounded-xl px-4 py-3" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={4} className="w-full border rounded-xl px-4 py-3" required />
            {existingPhotos.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {existingPhotos.map((url, index) => (
                  <div key={`${url}-${index}`} className="relative">
                    <img src={url} alt="" className="w-full h-28 object-cover rounded-xl border" />
                    <button
                      type="button"
                      onClick={() => setExistingPhotos((prev) => prev.filter((_, i) => i !== index))}
                      className="absolute top-2 right-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-lg"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setPhotoFiles(Array.from(e.target.files || []).slice(0, 6))}
            />
            <p className="text-xs text-gray-500">Up to 6 photos. 2 show free after Admin approves. Extra photos after payment.</p>
            {message && <p className="text-sm text-green-700">{message}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="bg-[#006B3F] text-white font-semibold px-6 py-3 rounded-xl">
                {loading ? "Saving..." : editingPendingId ? "Update pending" : "Send to Admin"}
              </button>
              {editingPendingId && (
                <button type="button" onClick={resetForm} className="bg-gray-200 px-6 py-3 rounded-xl font-semibold">
                  Cancel
                </button>
              )}
            </div>
          </form>

          <h2 className="text-lg font-bold mb-3">Your last 4 submissions</h2>
          <div className="space-y-3 mb-10">
            {myRequests.length === 0 ? (
              <div className="bg-white border rounded-xl p-4 text-sm text-gray-500">Nothing submitted yet.</div>
            ) : (
              myRequests.map((r) => (
                <div key={r.id} className="bg-white border rounded-xl p-4 flex justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{r.name}</h3>
                    <p className="text-sm text-gray-500">{r.subcategory || r.category} · {r.district}</p>
                    <p className="text-xs mt-1">
                      {r.status === "approved" && <span className="text-green-700 font-semibold">Live</span>}
                      {r.status === "rejected" && <span className="text-red-600 font-semibold">Rejected</span>}
                      {(!r.status || r.status === "pending") && <span className="text-amber-700 font-semibold">Pending</span>}
                    </p>
                  </div>
                  {(!r.status || r.status === "pending") && (
                    <button type="button" onClick={() => startEditPending(r)} className="text-sm text-[#006B3F] font-medium">
                      Edit
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <h2 className="text-lg font-bold mb-3">Find a live business</h2>
          <p className="text-sm text-gray-600 mb-3">Type at least 3 letters of one name. No full list.</p>
          <form className="flex flex-col sm:flex-row gap-2 mb-4" onSubmit={(e) => e.preventDefault()}>
            <input
              value={listQuery}
              onChange={(e) => setListQuery(e.target.value)}
              placeholder="Type one name..."
              className="flex-1 border rounded-xl px-4 py-3 bg-white"
            />
            {listQuery && (
              <button type="button" onClick={() => setListQuery("")} className="bg-gray-200 font-semibold px-5 py-3 rounded-xl">
                Clear
              </button>
            )}
          </form>
          <div className="space-y-3">
            {listQuery.trim().length < 3 ? (
              <div className="bg-white border rounded-xl p-4 text-sm text-gray-500">
                Type 3 or more letters to search.
              </div>
            ) : searchHits.length === 0 ? (
              <div className="bg-white border rounded-xl p-4 text-sm text-gray-500">
                No live business matches that name.
              </div>
            ) : (
              searchHits.map((b) => (
                <div key={b.id} className="bg-white border rounded-xl p-4 flex justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{b.name}</h3>
                    <p className="text-sm text-gray-500">{b.subcategory || b.category} · {b.district}</p>
                  </div>
                  <Link href={`/business/${b.id}`} className="text-sm text-gray-600">View →</Link>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}