"use client";
import { useEffect, useState } from "react";
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
  orderBy,
  query,
  doc,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const ADMIN_EMAILS = ["gdos87@hotmail.com"];
const categories = [
  "Tradesmen",
  "Auto",
  "Food",
  "Hotels",
  "Beauty",
  "Home",
  "Health & Medical",
  "Education & Training",
  "Money & Insurance",
  "Legal & Government",
  "Shopping & Fashion",
  "Electronics & Tech",
  "Events & Entertainment",
  "Media & Publishing",
  "Business Services",
  "Animals & Pets",
  "Sports & Fitness",
  "Utilities & Energy",
  "Public & Community",
  "Other",
];
const subcategories: Record<string, string[]> = {
  Tradesmen: ["Electrician", "Painter", "Tiler", "Welder", "Carpenter", "Plumber"],
  Auto: ["Mechanic", "Car wash", "Spare parts", "Taxi"],
  Food: ["Restaurant", "Bar", "Cafe", "Takeaway", "Bakery"],
  Hotels: ["Hotel", "Guest house", "Lodge"],
  Beauty: ["Salon", "Barber", "Spa"],
  Home: ["Cleaning", "Security", "Laundry"],
  "Health & Medical": ["Pharmacy", "Clinic", "Hospital", "Dentist"],
  "Education & Training": ["School", "Tuition", "Vocational"],
  "Money & Insurance": ["Bank", "Microfinance", "Insurance"],
  "Legal & Government": ["Lawyer", "Notary"],
  "Shopping & Fashion": ["Boutique", "Market stall"],
  "Electronics & Tech": ["Phone repair", "Computer"],
  "Events & Entertainment": ["DJ", "Event planner"],
  "Media & Publishing": ["Radio", "Printing"],
  "Business Services": ["Accounting", "Printing"],
  "Animals & Pets": ["Vet", "Pet shop"],
  "Sports & Fitness": ["Gym", "Coach"],
  "Utilities & Energy": ["Solar", "Water"],
  "Public & Community": ["NGO", "Church"],
  Other: [],
};
const districts = [
  "Western Area Urban",
  "Western Area Rural",
  "Bo",
  "Kenema",
  "Bombali",
  "Port Loko",
  "Kono",
  "Kailahun",
  "Tonkolili",
  "Kambia",
  "Moyamba",
  "Bonthe",
  "Pujehun",
  "Karene",
  "Falaba",
  "Koinadugu",
];

function isFeaturedActive(b: any) {
  if (!b?.featuredUntil) return false;
  const d = new Date(b.featuredUntil);
  if (isNaN(d.getTime())) return false;
  d.setHours(23, 59, 59, 999);
  return d >= new Date();
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Tradesmen");
  const [customCategory, setCustomCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [district, setDistrict] = useState("Western Area Urban");
  const [area, setArea] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [featuredUntil, setFeaturedUntil] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoUntil, setVideoUntil] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);

  const isAdmin = !!(user && ADMIN_EMAILS.includes(user.email || ""));

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecking(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (isAdmin) loadBusinesses();
  }, [isAdmin]);

  const loadBusinesses = async () => {
    const qy = query(collection(db, "businesses"), orderBy("createdAt", "desc"));
    const snap = await getDocs(qy);
    setBusinesses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setCategory("Tradesmen");
    setCustomCategory("");
    setSubcategory("");
    setDistrict("Western Area Urban");
    setArea("");
    setPhone("");
    setWhatsapp("");
    setHours("");
    setDescription("");
    setIsPremium(false);
    setFeaturedUntil("");
    setVideoUrl("");
    setVideoUntil("");
    setPhotoFiles([]);
    setExistingPhotos([]);
  };

  const startEdit = (b: any) => {
    setEditingId(b.id);
    setName(b.name || "");
    setCategory(b.category || "Tradesmen");
    setCustomCategory(b.customCategory || "");
    setSubcategory(b.subcategory || "");
    setDistrict(b.district || "Western Area Urban");
    setArea(b.area || "");
    setPhone(b.phone || "");
    setWhatsapp(b.whatsapp || "");
    setHours(b.hours || "");
    setDescription(b.description || "");
    setIsPremium(!!b.isPremium);
    setFeaturedUntil(b.featuredUntil || "");
    setVideoUrl(b.videoUrl || "");
    setVideoUntil(b.videoUntil || "");
    setExistingPhotos(Array.isArray(b.photos) ? b.photos : b.photo ? [b.photo] : []);
    setPhotoFiles([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        const r = ref(storage, `businesses/${Date.now()}-${file.name}`);
        await uploadBytes(r, file);
        uploaded.push(await getDownloadURL(r));
      }
      const photos = [...existingPhotos, ...uploaded].slice(0, isPremium ? 6 : 1);
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
        description: description.trim(),
        isPremium,
        featuredUntil: featuredUntil || "",
        videoUrl: videoUrl.trim(),
        videoUntil: videoUntil || "",
        photos,
      };
      if (editingId) {
        await updateDoc(doc(db, "businesses", editingId), payload);
        setMessage("Updated.");
      } else {
        await addDoc(collection(db, "businesses"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        setMessage("Saved.");
      }
      resetForm();
      loadBusinesses();
    } catch {
      setMessage("Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) {
    router.push("/login");
    return null;
  }
  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center">Admin access only</div>;

  const subOptions = subcategories[category] || [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-4">{editingId ? "Edit business" : "Admin"}</h1>
          <div className="flex flex-wrap gap-3 text-sm mb-6">
            <Link href="/admin/ads" className="text-[#006B3F] font-medium">Flyers & Events</Link>
            <Link href="/admin/requests" className="text-[#006B3F] font-medium">Listing requests</Link>
            <Link href="/admin/claims" className="text-[#006B3F] font-medium">Claims</Link>
            <Link href="/admin/import" className="text-[#006B3F] font-medium">CSV import</Link>
            <Link href="/admin/services" className="text-[#006B3F] font-medium">Essential services</Link>
            <Link href="/pricing" className="text-[#006B3F] font-medium">Pricing page</Link>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border rounded-2xl p-6 mb-8 space-y-4">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Business name" className="w-full border rounded-xl px-4 py-3" required />
            <div className="grid sm:grid-cols-2 gap-4">
              <select value={category} onChange={(e) => { setCategory(e.target.value); setSubcategory(""); }} className="w-full border rounded-xl px-4 py-3">
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
              {subOptions.length > 0 && (
                <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)} className="w-full border rounded-xl px-4 py-3">
                  <option value="">Subcategory (optional)</option>
                  {subOptions.map((s) => <option key={s}>{s}</option>)}
                </select>
              )}
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
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={4} className="w-full border rounded-xl px-4 py-3" required />

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} />
              Extra photos paid (up to 6)
            </label>
            <input type="file" accept="image/*" multiple onChange={(e) => setPhotoFiles(Array.from(e.target.files || []))} />

            <div className="border rounded-xl p-4 space-y-3 bg-gray-50">
              <p className="font-semibold text-sm">Featured add-on</p>
              <label className="block text-sm">Featured until</label>
              <input type="date" value={featuredUntil} onChange={(e) => setFeaturedUntil(e.target.value)} className="w-full border rounded-xl px-4 py-3 bg-white" />
              <p className="text-xs text-gray-500">Leave empty if not featured. 30 days or 90 days from payment date.</p>
            </div>

            <div className="border rounded-xl p-4 space-y-3 bg-gray-50">
              <p className="font-semibold text-sm">Video add-on</p>
              <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="YouTube or video link" className="w-full border rounded-xl px-4 py-3 bg-white" />
              <label className="block text-sm">Video until</label>
              <input type="date" value={videoUntil} onChange={(e) => setVideoUntil(e.target.value)} className="w-full border rounded-xl px-4 py-3 bg-white" />
            </div>

            {message && <p className="text-sm text-green-700">{message}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="bg-[#006B3F] text-white font-semibold px-6 py-3 rounded-xl">
                {loading ? "Saving..." : editingId ? "Update" : "Add business"}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="bg-gray-200 px-6 py-3 rounded-xl font-semibold">
                  Cancel
                </button>
              )}
            </div>
          </form>

          <h2 className="text-lg font-bold mb-3">Current businesses ({businesses.length})</h2>
          <div className="space-y-3">
            {businesses.map((b) => (
              <div key={b.id} className="bg-white border rounded-xl p-4 flex justify-between gap-4">
                <div>
                  <h3 className="font-semibold">
                    {b.name}{" "}
                    {isFeaturedActive(b) && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full ml-1">Featured</span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500">{b.subcategory || b.category} · {b.district}</p>
                  {b.featuredUntil && <p className="text-xs text-gray-500">Featured until {b.featuredUntil}</p>}
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <button onClick={() => startEdit(b)} className="text-sm text-[#006B3F] font-medium">Edit</button>
                  <Link href={`/business/${b.id}`} className="text-sm text-gray-600">View →</Link>
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