"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

const ADMIN_EMAILS = ["gdos87@hotmail.com"];
const MAX_PHOTOS = 4;
const PLACEMENTS = [
  { value: "top1", label: "Top Sponsor 1" },
  { value: "top2", label: "Top Sponsor 2" },
  { value: "r1", label: "Right R1" },
  { value: "r2", label: "Right R2" },
  { value: "r3", label: "Right R3" },
  { value: "b1", label: "Bottom B1" },
  { value: "b2", label: "Bottom B2" },
  { value: "b3", label: "Bottom B3" },
  { value: "b4", label: "Bottom B4" },
  { value: "left", label: "Left feed (scroll list)" },
];

export default function AdminAdsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<"flyer" | "event">("event");
  const [placement, setPlacement] = useState("left");
  const [feeType, setFeeType] = useState<"" | "free" | "paid">("");
  const [price, setPrice] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [link, setLink] = useState("");
  const [district, setDistrict] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const isAdmin = !!(user && ADMIN_EMAILS.includes(user.email || ""));

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (isAdmin) loadAds();
  }, [isAdmin]);

  const loadAds = async () => {
    const snap = await getDocs(collection(db, "ads"));
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    data.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    setAds(data);
  };

  const resetForm = () => {
    setEditingId(null);
    setType("event");
    setPlacement("left");
    setFeeType("");
    setPrice("");
    setTitle("");
    setDescription("");
    setPhone("");
    setLink("");
    setDistrict("");
    setEventDate("");
    setEventEndDate("");
    setStartDate("");
    setEndDate("");
    setImageFiles([]);
    setExistingPhotos([]);
  };

  const startEdit = (ad: any) => {
    setEditingId(ad.id);
    setType(ad.type || "event");
    setPlacement(ad.placement || "left");
    setFeeType(ad.feeType || "");
    setPrice(ad.price || "");
    setTitle(ad.title || "");
    setDescription(ad.description || "");
    setPhone(ad.phone || "");
    setLink(ad.link || "");
    setDistrict(ad.district || "");
    setEventDate(ad.eventDate || "");
    setEventEndDate(ad.eventEndDate || "");
    setStartDate(ad.startDate || "");
    setEndDate(ad.endDate || "");
    const photos = Array.isArray(ad.photos) && ad.photos.length ? ad.photos : ad.imageUrl ? [ad.imageUrl] : [];
    setExistingPhotos(photos);
    setImageFiles([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files);
    const room = MAX_PHOTOS - existingPhotos.length - imageFiles.length;
    if (room <= 0) {
      setMessage("Maximum 4 photos.");
      return;
    }
    setImageFiles((prev) => [...prev, ...incoming.slice(0, room)]);
  };

  const removeExisting = (url: string) => {
    setExistingPhotos((prev) => prev.filter((p) => p !== url));
  };

  const removeNew = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!title.trim() || !description.trim()) {
      setMessage("Title and description are required.");
      return;
    }
    if (feeType === "paid" && !price.trim()) {
      setMessage("Enter price for paid events.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const uploaded: string[] = [];
      for (const file of imageFiles) {
        const imageRef = ref(storage, `ads/${Date.now()}-${file.name}`);
        await uploadBytes(imageRef, file);
        uploaded.push(await getDownloadURL(imageRef));
      }
      const photos = [...existingPhotos, ...uploaded].slice(0, MAX_PHOTOS);
      const payload = {
        type,
        placement,
        feeType,
        price: feeType === "paid" ? price.trim() : "",
        title: title.trim(),
        description: description.trim(),
        phone: phone.trim(),
        link: link.trim(),
        district: district.trim(),
        eventDate: eventDate || "",
        eventEndDate: eventEndDate || "",
        startDate: startDate || "",
        endDate: endDate || "",
        photos,
        imageUrl: photos[0] || "",
        active: true,
      };
      if (editingId) {
        await updateDoc(doc(db, "ads", editingId), payload);
        setMessage("Updated successfully.");
      } else {
        await addDoc(collection(db, "ads"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        setMessage("Saved successfully.");
      }
      resetForm();
      loadAds();
    } catch (error) {
      console.log(error);
      setMessage("Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this item?")) return;
    await deleteDoc(doc(db, "ads", id));
    if (editingId === id) resetForm();
    setMessage("Deleted.");
    loadAds();
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) {
    router.push("/login");
    return null;
  }
  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center">Admin access only</div>;

  const remaining = MAX_PHOTOS - existingPhotos.length - imageFiles.length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-between mb-6">
            <h1 className="text-2xl font-bold">
              {editingId ? "Edit Flyer / Event" : "Flyers & Events"}
            </h1>
            <Link href="/admin" className="text-sm text-[#006B3F] font-medium">
              ← Back to Admin
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border rounded-2xl p-6 mb-8 space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full border rounded-xl px-4 py-3">
                  <option value="event">Event</option>
                  <option value="flyer">Business Flyer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Placement</label>
                <select value={placement} onChange={(e) => setPlacement(e.target.value)} className="w-full border rounded-xl px-4 py-3">
                  {PLACEMENTS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Fee</label>
                <select value={feeType} onChange={(e) => setFeeType(e.target.value as any)} className="w-full border rounded-xl px-4 py-3">
                  <option value="">No fee label</option>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>

            {feeType === "paid" && (
              <div>
                <label className="block text-sm font-medium mb-2">Price</label>
                <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. NLe 500" className="w-full border rounded-xl px-4 py-3" />
              </div>
            )}

            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full border rounded-xl px-4 py-3" required />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Full description / details" rows={4} className="w-full border rounded-xl px-4 py-3" required />

            <div className="grid sm:grid-cols-2 gap-4">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp / Phone" className="w-full border rounded-xl px-4 py-3" />
              <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Optional external link" className="w-full border rounded-xl px-4 py-3" />
            </div>
            <input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Venue / District" className="w-full border rounded-xl px-4 py-3" />

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Event start date</label>
                <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full border rounded-xl px-4 py-3" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Event end date (optional)</label>
                <input type="date" value={eventEndDate} onChange={(e) => setEventEndDate(e.target.value)} className="w-full border rounded-xl px-4 py-3" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Ad start (display period)</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border rounded-xl px-4 py-3" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ad end / expiry</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border rounded-xl px-4 py-3" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Photos (up to 4). First photo is the homepage cover.
              </label>
              {remaining > 0 && (
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFiles(e.target.files)}
                  className="block w-full text-sm"
                />
              )}
              <p className="text-xs text-gray-500 mt-1">{existingPhotos.length + imageFiles.length} / 4 used</p>
              <div className="flex flex-wrap gap-3 mt-3">
                {existingPhotos.map((url) => (
                  <div key={url} className="relative">
                    <img src={url} alt="" className="w-24 h-24 object-cover rounded-xl border" />
                    <button type="button" onClick={() => removeExisting(url)} className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-6 h-6 rounded-full">
                      ×
                    </button>
                  </div>
                ))}
                {imageFiles.map((file, i) => (
                  <div key={`${file.name}-${i}`} className="relative">
                    <div className="w-24 h-24 rounded-xl border bg-gray-100 flex items-center justify-center text-[10px] p-1 text-center">
                      {file.name}
                    </div>
                    <button type="button" onClick={() => removeNew(i)} className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-6 h-6 rounded-full">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {message && (
              <p className={`text-sm ${message.toLowerCase().includes("fail") || message.toLowerCase().includes("enter") || message.toLowerCase().includes("maximum") ? "text-red-500" : "text-green-600"}`}>
                {message}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={loading} className="bg-[#006B3F] text-white font-semibold px-6 py-3 rounded-xl disabled:opacity-60">
                {loading ? "Saving..." : editingId ? "Update" : "Publish"}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="bg-gray-200 text-gray-800 font-semibold px-6 py-3 rounded-xl">
                  Cancel edit
                </button>
              )}
            </div>
          </form>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">Published items</h2>
            {ads.map((ad) => (
              <div key={ad.id} className="bg-white border rounded-2xl p-4 flex gap-4 items-start">
                {(ad.photos?.[0] || ad.imageUrl) ? (
                  <img src={ad.photos?.[0] || ad.imageUrl} alt={ad.title} className="w-24 h-24 object-cover rounded-xl" />
                ) : (
                  <div className="w-24 h-24 bg-gray-100 rounded-xl" />
                )}
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-1">
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{ad.type}</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">{ad.placement}</span>
                    {(ad.photos?.length || 0) > 1 && (
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        {ad.photos.length} photos
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold">{ad.title}</h3>
                  <p className="text-sm text-gray-600">{ad.description}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => startEdit(ad)} className="text-sm text-[#006B3F] font-medium">Edit</button>
                  <button onClick={() => handleDelete(ad.id)} className="text-sm text-red-600 font-medium">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}