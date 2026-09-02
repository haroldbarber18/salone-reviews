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
  "Money & Insurance": ["Bank", "Insurance", "Forex"],
  "Legal & Government": ["Lawyer"],
  "Shopping & Fashion": ["Clothes", "Tailor", "Market"],
  "Electronics & Tech": ["Phones", "Phone repair", "Computers"],
  "Events & Entertainment": ["DJ", "Event hall", "Photographer"],
  "Media & Publishing": ["Radio", "Printing"],
  "Business Services": ["Printing", "Accounting", "Logistics"],
  "Animals & Pets": ["Vet", "Pet shop"],
  "Sports & Fitness": ["Gym"],
  "Utilities & Energy": ["Solar", "Gas"],
  "Public & Community": ["Church", "NGO", "Funeral"],
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
  const [subcategory, setSubcategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [district, setDistrict] = useState("Western Area Urban");
  const [area, setArea] = useState("");
  const [phone, setPhone] = useState("");
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);

  const subcategoryOptions = subcategories[category] || [];
  const maxPhotos = isPremium ? 4 : 1;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setChecking(false);
      if (!currentUser) router.push("/login");
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user && ADMIN_EMAILS.includes(user.email || "")) {
      loadBusinesses();
    }
  }, [user]);

  const loadBusinesses = async () => {
    try {
      const q = query(collection(db, "businesses"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setBusinesses(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.log("Error loading businesses:", error);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setArea("");
    setPhone("");
    setHours("");
    setDescription("");
    setCategory("Tradesmen");
    setSubcategory("");
    setCustomCategory("");
    setDistrict("Western Area Urban");
    setIsPremium(false);
    setPhotos([]);
    setExistingPhotos([]);
  };

  const startEdit = (b: any) => {
    const known = categories.includes(b.category);
    setEditingId(b.id);
    setName(b.name || "");
    setCategory(known ? b.category : "Other");
    setCustomCategory(known ? "" : b.category || "");
    setSubcategory(b.subcategory || "");
    setDistrict(b.district || "Western Area Urban");
    setArea(b.area || "");
    setPhone(b.phone || "");
    setHours(b.hours || "");
    setDescription(b.description || "");
    setIsPremium(!!b.isPremium);
    setPhotos([]);
    setExistingPhotos(Array.isArray(b.photos) ? b.photos : []);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePremiumChange = (checked: boolean) => {
    setIsPremium(checked);
    const limit = checked ? 4 : 1;
    setPhotos((prev) => prev.slice(0, limit));
    if (!checked) setExistingPhotos((prev) => prev.slice(0, 1));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setPhotos(files.slice(0, maxPhotos));
  };

  const uploadPhotos = async (files: File[]) => {
    const urls: string[] = [];
    for (const file of files) {
      const fileRef = ref(storage, `business-photos/${Date.now()}-${file.name}`);
      await uploadBytes(fileRef, file);
      urls.push(await getDownloadURL(fileRef));
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      if (category === "Other" && !customCategory.trim()) {
        setMessage("Please enter a custom category.");
        setLoading(false);
        return;
      }
      if (category === "Other" && customCategory.trim().length > 15) {
        setMessage("Custom category must be 15 characters or less.");
        setLoading(false);
        return;
      }

      const finalCategory = category === "Other" ? customCategory.trim() : category;
      const finalSubcategory = category === "Other" ? "" : subcategory.trim();

      let photoUrls = existingPhotos.slice(0, maxPhotos);
      if (photos.length > 0) {
        const uploaded = await uploadPhotos(photos.slice(0, maxPhotos));
        photoUrls = uploaded;
      }

      const payload = {
        name: name.trim(),
        category: finalCategory,
        subcategory: finalSubcategory,
        district,
        area: area.trim(),
        phone: phone.trim(),
        hours: hours.trim(),
        description: description.trim(),
        isPremium,
        photos: photoUrls,
      };

      if (editingId) {
        await updateDoc(doc(db, "businesses", editingId), payload);
        setMessage("Business updated successfully.");
      } else {
        await addDoc(collection(db, "businesses"), {
          ...payload,
          createdAt: serverTimestamp(),
          createdBy: user?.email || "",
        });
        setMessage("Business added successfully.");
      }
      resetForm();
      loadBusinesses();
    } catch (error) {
      console.log(error);
      setMessage(editingId ? "Failed to update business. Please try again." : "Failed to add business. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Checking access...</p>
      </div>
    );
  }

  if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white border rounded-2xl p-8 max-w-md text-center">
            <h1 className="text-xl font-bold mb-2">Admin access required</h1>
            <p className="text-gray-600 mb-4">This page is only for the SaloneReviews admin account.</p>
            <Link href="/" className="text-[#006B3F] font-medium">← Back to Home</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-wrap gap-3 justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
              <p className="text-gray-600">Add and manage businesses on SaloneReviews</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/admin/requests" className="text-sm text-[#006B3F] font-medium">Business Requests →</Link>
              <Link href="/admin/claims" className="text-sm text-[#006B3F] font-medium">Claims →</Link>
              <Link href="/admin/import" className="text-sm text-[#006B3F] font-medium">Import Excel →</Link>
              <Link href="/admin/ads" className="text-sm text-[#006B3F] font-medium">Ads →</Link>
              <Link href="/admin/services" className="text-sm text-[#006B3F] font-medium">Essential Services →</Link>
            </div>
          </div>

          <div className="bg-white border rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">{editingId ? "Edit Business" : "Add New Business"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Business Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:border-[#006B3F]"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setSubcategory("");
                    }}
                    className="w-full border rounded-xl px-4 py-3 outline-none focus:border-[#006B3F] bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">District</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full border rounded-xl px-4 py-3 outline-none focus:border-[#006B3F] bg-white"
                  >
                    {districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {category !== "Other" && subcategoryOptions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1">Subcategory (optional)</label>
                  <select
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full border rounded-xl px-4 py-3 outline-none focus:border-[#006B3F] bg-white"
                  >
                    <option value="">Leave blank — use category only</option>
                    {subcategoryOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}

              {category === "Other" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Custom Category (max 15 characters)</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value.slice(0, 15))}
                    maxLength={15}
                    placeholder="e.g. Accounting"
                    className="w-full border rounded-xl px-4 py-3 outline-none focus:border-[#006B3F]"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Area / Location</label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Congo Cross, Freetown"
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:border-[#006B3F]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone (with country code, no +)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="23276123456"
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:border-[#006B3F]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Opening Hours</label>
                <input
                  type="text"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="e.g. Mon–Sat 8:00–18:00"
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:border-[#006B3F]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:border-[#006B3F]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Photo {isPremium ? "(up to 4)" : "(1 free, optional)"}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple={isPremium}
                  onChange={handlePhotoChange}
                  className="w-full border rounded-xl px-4 py-3 bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {photos.length > 0
                    ? `${photos.length} new photo(s) selected`
                    : existingPhotos.length > 0
                    ? `${existingPhotos.length} existing photo(s)`
                    : "No photo yet — you can save without one"}
                </p>
                {existingPhotos.length > 0 && photos.length === 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {existingPhotos.slice(0, maxPhotos).map((url) => (
                      <img key={url} src={url} alt="" className="w-16 h-16 object-cover rounded-lg border" />
                    ))}
                  </div>
                )}
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPremium}
                  onChange={(e) => handlePremiumChange(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-[#006B3F]"
                />
                <span className="text-sm text-gray-700">
                  <span className="font-medium">Premium membership</span>
                  <span className="block text-gray-500 text-xs mt-0.5">
                    Allows up to 4 photos. Free listings can have 1 photo.
                  </span>
                </span>
              </label>

              {message && (
                <p className={`text-sm ${message.toLowerCase().includes("success") ? "text-green-600" : "text-red-500"}`}>
                  {message}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#006B3F] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#005a35] disabled:opacity-60"
                >
                  {loading ? "Saving..." : editingId ? "Update Business" : "Add Business"}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} className="bg-gray-100 text-gray-700 font-semibold px-6 py-3 rounded-xl">
                    Cancel edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-white border rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Current Businesses ({businesses.length})</h2>
            {businesses.length === 0 ? (
              <p className="text-gray-500">No businesses added yet.</p>
            ) : (
              <div className="space-y-3">
                {businesses.map((b) => (
                  <div key={b.id} className="border rounded-xl p-4 flex justify-between gap-4 items-start">
                    <div className="flex gap-3 min-w-0">
                      {b.photos?.[0] ? (
                        <img src={b.photos[0]} alt="" className="w-14 h-14 object-cover rounded-lg border shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-gray-100 border shrink-0" />
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold">
                          {b.name}{" "}
                          {b.isPremium && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full ml-1">Premium</span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {b.subcategory ? b.subcategory : b.category} · {b.district}
                        </p>
                        <p className="text-sm text-gray-600">{b.area}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <button onClick={() => startEdit(b)} className="text-sm text-[#006B3F] font-medium">Edit</button>
                      <Link href={`/business/${b.id}`} className="text-sm text-gray-600 font-medium whitespace-nowrap">View →</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}