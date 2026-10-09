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
  deleteDoc,
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
  const [canImportPlaces, setCanImportPlaces] = useState(false);
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
  const [pickedPhotos, setPickedPhotos] = useState<Record<string, File[]>>({});
  const [importKind, setImportKind] = useState("hotel");
  const [importCustom, setImportCustom] = useState("");
  const [importDistrict, setImportDistrict] = useState("Western Area Urban");
  const [importHits, setImportHits] = useState<any[]>([]);
  const [importPageToken, setImportPageToken] = useState("");
  const [pickedIds, setPickedIds] = useState<string[]>([]);

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
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setStaffEmails(rows.map((row) => normEmail(row.email)));
        setCanImportPlaces(rows.some((row) => normEmail(row.email) === normEmail(auth.currentUser?.email) && row.canImportPlaces));
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
    if (q.length < 1) return [];
    return businesses
      .filter((b) => String(b.name || "").toLowerCase().includes(q))
      .sort((a, b) => {
        const an = String(a.name || "").toLowerCase();
        const bn = String(b.name || "").toLowerCase();
        const aStart = an.startsWith(q) ? 0 : 1;
        const bStart = bn.startsWith(q) ? 0 : 1;
        if (aStart !== bStart) return aStart - bStart;
        return an.localeCompare(bn, undefined, { sensitivity: "base" });
      })
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

  const addLivePhotos = async (biz: any, files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const current = Array.isArray(biz.photos) ? biz.photos : biz.photo ? [biz.photo] : [];
    const room = 6 - current.length;
    if (room <= 0) {
      setMessage("This live listing already has 6 photos.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files).slice(0, room)) {
        const r = ref(storage, `businesses/${biz.id}/${Date.now()}-${file.name}`);
        await uploadBytes(r, file);
        uploaded.push(await getDownloadURL(r));
      }
      const photos = [...current, ...uploaded].slice(0, 6);
      await updateDoc(doc(db, "businesses", biz.id), {
        photos,
        photo: photos[0] || "",
        updatedAtMs: Date.now(),
      });
      await addDoc(collection(db, "staffActivity"), {
        actorEmail: email,
        action: "staff-added-live-photos",
        businessId: biz.id,
        businessName: biz.name || "",
        details: `added ${uploaded.length}, now ${photos.length} of 6`,
        createdAt: serverTimestamp(),
        createdAtMs: Date.now(),
      });
      setBusinesses((rows) => rows.map((row) => (row.id === biz.id ? { ...row, photos, photo: photos[0] || "" } : row)));
      setPickedPhotos((prev) => {
        const next = { ...prev };
        delete next[biz.id];
        return next;
      });
      setMessage(`Added ${uploaded.length} photo${uploaded.length === 1 ? "" : "s"}. ${photos.length} of 6 on ${biz.name}.`);
    } catch (err: any) {
      setMessage(err?.message || "Could not add photos. Ask Admin to allow IT staff to update live listings.");
    } finally {
      setLoading(false);
    }
  };

  const deleteLiveBusiness = async (biz: any) => {
    if (!isAdmin) return;
    const ok = window.confirm(`Delete ${biz.name}? This removes the live listing.`);
    if (!ok) return;
    setLoading(true);
    setMessage("");
    try {
      await deleteDoc(doc(db, "businesses", biz.id));
      await addDoc(collection(db, "staffActivity"), {
        actorEmail: email,
        action: "admin-deleted-live-listing",
        businessId: biz.id,
        businessName: biz.name || "",
        details: "deleted live listing",
        createdAt: serverTimestamp(),
        createdAtMs: Date.now(),
      });
      setBusinesses((rows) => rows.filter((row) => row.id !== biz.id));
      setMessage(`Deleted ${biz.name}.`);
    } catch (err: any) {
      setMessage(err?.message || "Could not delete. Ask Admin to check Firebase rules.");
    } finally {
      setLoading(false);
    }
  };


  const normName = (value: string) =>
    String(value || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\b(hotel|hotels|restaurant|restaurants|ltd|limited)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const searchPlaces = async (pageToken = "") => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/places-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: importKind, custom: importCustom, district: importDistrict, pageToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not search Google.");
      const pendingSnap = await getDocs(query(collection(db, "businessRequests"), where("status", "==", "pending")));
      const pendingRows: any[] = pendingSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      const rows = (data.places || []).map((place: any) => {
        const key = normName(place.name);
        const match = businesses.find((b) => normName(b.name) === key || b.googlePlaceId === place.placeId);
        const pending = pendingRows.find((r) => normName(r.name) === key || r.googlePlaceId === place.placeId);
        const photos = Array.isArray(match?.photos) ? match.photos : match?.photo ? [match.photo] : [];
        const hasPhotos = photos.length > 0;
        return {
          ...place,
          matchId: match?.id || "",
          matchName: match?.name || pending?.name || "",
          needsFill: !!(match && !hasPhotos && !pending),
          alreadyFilled: !!(pending || (match && hasPhotos)),
        };
      }).filter((place: any) => !place.alreadyFilled).filter((place: any, index: number, all: any[]) => {
        const key = normName(place.name);
        return all.findIndex((row) => row.placeId === place.placeId || normName(row.name) === key) === index;
      });
      setImportHits(rows);
      setPickedIds([]);
      setImportPageToken(data.nextPageToken || "");
      setMessage(rows.length ? `${rows.length} found. Nothing is live yet.` : "Google returned no places for that search.");
    } catch (err: any) {
      setMessage(err?.message || "Could not search Google.");
    } finally {
      setLoading(false);
    }
  };

  const placeCategory = () => {
    const kind = importCustom.trim() || importKind;
    if (kind === "hotel") return { category: "Hotels", subcategory: "Hotel" };
    if (kind === "restaurant" || kind === "cafe") return { category: "Food", subcategory: kind === "cafe" ? "Cafe" : "Restaurant" };
    if (kind === "bank") return { category: "Money & Insurance", subcategory: "Bank" };
    if (kind === "pharmacy" || kind === "hospital") return { category: "Health & Medical", subcategory: kind === "hospital" ? "Hospital" : "Pharmacy" };
    if (kind === "school") return { category: "Education & Training", subcategory: "School" };
    if (kind === "supermarket" || kind === "store") return { category: "Shopping & Fashion", subcategory: kind === "store" ? "Store" : "Supermarket" };
    if (kind === "mechanic") return { category: "Auto", subcategory: "Mechanic" };
    return { category: "Tradesmen", subcategory: kind.charAt(0).toUpperCase() + kind.slice(1) };
  };

  const applyPlace = async (place: any) => {
    setLoading(true);
    setMessage("");
    try {
      let uploaded: string[] = [];
      const names = Array.isArray(place.photoNames) ? place.photoNames : place.photoName ? [place.photoName] : [];
      for (const photoName of names.slice(0, 6)) {
        const photoRes = await fetch(`/api/places-photo?name=${encodeURIComponent(photoName)}`);
        if (!photoRes.ok) continue;
        const blob = await photoRes.blob();
        const fileRef = ref(storage, `businesses/google-${place.placeId}-${uploaded.length}.jpg`);
        await uploadBytes(fileRef, blob);
        uploaded.push(await getDownloadURL(fileRef));
      }
      if (place.matchId) {
        const current = businesses.find((b) => b.id === place.matchId) || {};
        const photos = Array.isArray(current.photos) ? current.photos : current.photo ? [current.photo] : [];
        const nextPhotos = [...photos, ...uploaded.filter((url) => !photos.includes(url))].slice(0, 6);
        const website = String(current.website || "").trim() || place.website || "";
        await updateDoc(doc(db, "businesses", place.matchId), {
          photos: nextPhotos,
          photo: nextPhotos[0] || current.photo || "",
          phone: current.phone || place.phone || "",
          website,
          address: current.address || place.address || "",
          area: current.area || place.address || "",
          maps: current.maps || place.maps || "",
          googlePlaceId: place.placeId,
        });
        setBusinesses((rows) => rows.map((row) => row.id === place.matchId ? {
          ...row,
          photos: nextPhotos,
          photo: nextPhotos[0] || row.photo || "",
          phone: row.phone || place.phone || "",
          website,
          address: row.address || place.address || "",
          googlePlaceId: place.placeId,
        } : row));
        setMessage(`Saved on ${current.name || place.matchName}. Website: ${website || "Google had none"}.`);
      } else {
        const picked = placeCategory();
        await addDoc(collection(db, "businessRequests"), {
          name: place.name,
          category: picked.category,
          subcategory: picked.subcategory,
          district: importDistrict,
          area: place.address || "",
          phone: place.phone || "",
          whatsapp: "",
          hours: "",
          website: place.website || "",
          description: place.address || place.name,
          photos: uploaded,
          status: "pending",
          source: "google-places",
          googlePlaceId: place.placeId,
          submittedBy: email,
          createdAt: serverTimestamp(),
          createdAtMs: Date.now(),
        });
        setMessage(`${place.name} saved as pending. It is not live until Admin approves it.`);
        setMyRequests((rows) => [{ id: "new", name: place.name, googlePlaceId: place.placeId, status: "pending" }, ...rows]);
      }
      setImportHits((rows) => rows.filter((row) => row.placeId !== place.placeId));
    } catch (err: any) {
      setMessage(err?.message || "Could not apply this place.");
    } finally {
      setLoading(false);
    }
  };

  const sendTicked = async () => {
    const chosen = importHits.filter((place) => pickedIds.includes(place.placeId) && !place.matchId);
    if (!chosen.length) {
      setMessage("Tick the new names first.");
      return;
    }
    for (const place of chosen) {
      await applyPlace(place);
    }
    setPickedIds([]);
    setMessage(`${chosen.length} sent to the pending list. Approve them in Admin.`);
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


          { (isAdmin || canImportPlaces) && (
          <div className="bg-white border rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-bold mb-1">Fill hotels and restaurants</h2>
            <p className="text-sm text-gray-600 mb-4">A name already on the site keeps its card. This only adds a missing photo, phone or address. A new name is saved as pending.</p>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <select value={importKind} onChange={(e) => setImportKind(e.target.value)} className="border rounded-xl px-4 py-3">
                <option value="hotel">Hotel</option>
                <option value="restaurant">Restaurant</option>
                <option value="cafe">Cafe</option>
                <option value="bank">Bank</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="school">School</option>
                <option value="hospital">Hospital</option>
                <option value="supermarket">Supermarket</option>
                <option value="store">Store</option>
                <option value="plumber">Plumber</option>
                <option value="electrician">Electrician</option>
                <option value="mason">Mason</option>
                <option value="tiler">Tiler</option>
                <option value="mechanic">Mechanic</option>
                <option value="welder">Welder</option>
                <option value="carpenter">Carpenter</option>
              </select>
              <select value={importDistrict} onChange={(e) => setImportDistrict(e.target.value)} className="border rounded-xl px-4 py-3">
                {districts.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <input value={importCustom} onChange={(e) => setImportCustom(e.target.value)} placeholder="Or type any trade, such as painter" className="w-full border rounded-xl px-4 py-3 mb-3" />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => searchPlaces("")} disabled={loading} className="bg-[#006B3F] text-white font-semibold px-5 py-3 rounded-xl">
                {loading ? "Working..." : "Search Google"}
              </button>
              {importPageToken && (
                <button type="button" onClick={() => searchPlaces(importPageToken)} disabled={loading} className="bg-white border border-[#006B3F] text-[#006B3F] font-semibold px-5 py-3 rounded-xl">
                  Next 20
                </button>
              )}
              <button type="button" onClick={sendTicked} disabled={loading || pickedIds.length === 0} className="bg-[#006B3F] text-white font-semibold px-5 py-3 rounded-xl">
                Send ticked
              </button>
            </div>
            <div className="space-y-3 mt-4">
              {importHits.map((place) => (
                <div key={place.placeId} className="border rounded-xl p-4 flex justify-between gap-4">
                  <div className="flex gap-3">
                    {!place.matchId && (
                      <input
                        type="checkbox"
                        checked={pickedIds.includes(place.placeId)}
                        onChange={(e) => setPickedIds((ids) => e.target.checked ? [...ids, place.placeId] : ids.filter((id) => id !== place.placeId))}
                        className="mt-1 h-5 w-5"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold">{place.name}</h3>
                      <p className="text-sm text-gray-500">{place.address}</p>
                      <p className="text-sm text-gray-500">{place.phone}</p>
                      <p className="text-sm text-gray-500">{place.website || "No website from Google"}</p>
                      <p className="text-sm font-semibold text-[#006B3F]">{place.needsFill ? `On the site, no photo. Fill card only.` : "New. Tick it, then Send ticked."}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => applyPlace(place)} disabled={loading} className="bg-[#006B3F] text-white text-sm font-semibold px-4 py-2 rounded-lg h-fit">
                    {place.matchId ? "Fill card" : "Save pending"}
                  </button>
                </div>
              ))}
            </div>
          </div>
          )}

          <h2 className="text-lg font-bold mb-3">Find a live business</h2>
          <p className="text-sm text-gray-600 mb-3">Type a letter to see matching names. No full list.</p>
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
            {message && (
              <p className="text-sm font-semibold text-[#006B3F] bg-white border rounded-xl px-4 py-3">{message}</p>
            )}
            {listQuery.trim().length < 1 ? (
              <div className="bg-white border rounded-xl p-4 text-sm text-gray-500">
                Type a letter to find a live business.
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
                  <div className="flex flex-col items-end gap-2">
                    <Link href={`/business/${b.id}`} className="text-sm text-gray-600">View →</Link>
                    <label className="text-sm font-semibold text-[#006B3F] cursor-pointer">
                      Add photos
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={loading || (Array.isArray(b.photos) ? b.photos.length : b.photo ? 1 : 0) >= 6}
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setPickedPhotos((prev) => ({ ...prev, [b.id]: files }));
                          setMessage(files.length ? `${files.length} photo${files.length === 1 ? "" : "s"} selected. Press Upload.` : "");
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {(pickedPhotos[b.id] || []).length > 0 && (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => addLivePhotos(b, pickedPhotos[b.id])}
                        className="bg-[#006B3F] text-white text-sm font-semibold px-4 py-2 rounded-lg"
                      >
                        {loading ? "Uploading..." : "Upload"}
                      </button>
                    )}
                    <p className="text-xs text-gray-500">{Array.isArray(b.photos) ? b.photos.length : b.photo ? 1 : 0} of 6</p>
                  </div>
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