"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db, storage } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const ORANGE_MONEY = "075294553";

const DISTRICTS = [
  "Western Area Urban",
  "Western Area Rural",
  "Bo",
  "Bombali",
  "Bonthe",
  "Kailahun",
  "Kambia",
  "Kenema",
  "Koinadugu",
  "Kono",
  "Moyamba",
  "Port Loko",
  "Pujehun",
  "Tonkolili",
  "Karene",
  "Falaba",
];

const CATEGORIES = [
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

const SUBCATEGORIES: Record<string, string[]> = {
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

async function uploadOne(folder: string, file: File) {
  const fileRef = ref(storage, `${folder}/${Date.now()}-${file.name}`);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

export default function ListBusinessPage() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Tradesmen");
  const [subcategory, setSubcategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [district, setDistrict] = useState("Western Area Urban");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [description, setDescription] = useState("");
  const [freePhoto, setFreePhoto] = useState<File | null>(null);
  const [photoPack, setPhotoPack] = useState<"none" | "plus2" | "plus5">("none");
  const [extraPhotos, setExtraPhotos] = useState<File[]>([]);
  const [paymentShot, setPaymentShot] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const subcategoryOptions = SUBCATEGORIES[category] || [];
  const extraNeeded = photoPack === "plus2" ? 2 : photoPack === "plus5" ? 5 : 0;
  const packPrice = photoPack === "plus2" ? "NLe 500" : photoPack === "plus5" ? "NLe 1,000" : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !phone.trim()) {
      setMessage("Please fill in business name, phone and description.");
      return;
    }
    if (extraNeeded > 0 && extraPhotos.length !== extraNeeded) {
      setMessage(`Please upload exactly ${extraNeeded} extra photo(s) for this pack.`);
      return;
    }
    if (extraNeeded > 0 && !paymentShot) {
      setMessage("Please upload your Orange Money payment screenshot.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      let freePhotoUrl = "";
      if (freePhoto) freePhotoUrl = await uploadOne("listing-requests", freePhoto);

      const extraPhotoUrls: string[] = [];
      for (const file of extraPhotos.slice(0, extraNeeded)) {
        extraPhotoUrls.push(await uploadOne("listing-requests", file));
      }

      let paymentScreenshotUrl = "";
      if (paymentShot) paymentScreenshotUrl = await uploadOne("listing-payments", paymentShot);

      await addDoc(collection(db, "businessRequests"), {
        name: name.trim(),
        category: category === "Other" ? customCategory.trim() || "Other" : category,
        subcategory: category === "Other" ? "" : subcategory.trim(),
        district,
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        description: description.trim(),
        freePhotoUrl,
        extraPhotoUrls,
        photoPack,
        packPrice,
        paymentMethod: extraNeeded > 0 ? "orange" : "",
        paymentNumber: extraNeeded > 0 ? ORANGE_MONEY : "",
        paymentScreenshotUrl,
        paymentStatus: extraNeeded > 0 ? "pending" : "not_required",
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setName("");
      setCategory("Tradesmen");
      setSubcategory("");
      setCustomCategory("");
      setDistrict("Western Area Urban");
      setPhone("");
      setWhatsapp("");
      setDescription("");
      setFreePhoto(null);
      setPhotoPack("none");
      setExtraPhotos([]);
      setPaymentShot(null);
      setMessage("Request submitted. We will review and contact you.");
    } catch (error) {
      console.log(error);
      setMessage("Failed to submit. Please try WhatsApp instead.");
    } finally {
      setLoading(false);
    }
  };

  const whatsappText = encodeURIComponent(
    "Hello SaloneReviews, I want to list my business.\nName:\nCategory:\nDistrict:\nPhone:\nShort description:"
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <Link href="/" className="text-sm text-[#006B3F] font-medium">← Back to Home</Link>
          <h1 className="text-3xl font-bold mt-4 mb-2">List your business</h1>
          <p className="text-gray-600 mb-6">
            Basic listings are free and include 1 photo. Extra photos are paid by Orange Money.
          </p>

          <form onSubmit={handleSubmit} className="bg-white border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-lg">Website request form</h2>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Business name"
              className="w-full border rounded-xl px-4 py-3"
              required
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setSubcategory("");
                }}
                className="w-full border rounded-xl px-4 py-3"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full border rounded-xl px-4 py-3"
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {category !== "Other" && subcategoryOptions.length > 0 && (
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full border rounded-xl px-4 py-3"
              >
                <option value="">Subcategory optional — leave blank</option>
                {subcategoryOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}

            {category === "Other" && (
              <input
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter category"
                maxLength={15}
                className="w-full border rounded-xl px-4 py-3"
              />
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full border rounded-xl px-4 py-3"
                required
              />
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="WhatsApp number"
                className="w-full border rounded-xl px-4 py-3"
              />
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of your business"
              rows={4}
              className="w-full border rounded-xl px-4 py-3"
              required
            />

            <div>
              <label className="block text-sm font-medium mb-1">1st photo (free, optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFreePhoto(e.target.files?.[0] || null)}
                className="w-full border rounded-xl px-4 py-3 bg-white"
              />
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Extra photos</p>
              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2">
                  <input type="radio" name="pack" checked={photoPack === "none"} onChange={() => { setPhotoPack("none"); setExtraPhotos([]); setPaymentShot(null); }} />
                  None — 1 free photo only
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="pack" checked={photoPack === "plus2"} onChange={() => { setPhotoPack("plus2"); setExtraPhotos([]); }} />
                  2 extra photos — NLe 500 (3 photos in total)
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="pack" checked={photoPack === "plus5"} onChange={() => { setPhotoPack("plus5"); setExtraPhotos([]); }} />
                  5 extra photos — NLe 1,000 (6 photos in total)
                </label>
              </div>
            </div>

            {extraNeeded > 0 && (
              <div className="border rounded-2xl p-4 space-y-3 bg-gray-50">
                <p className="text-sm font-medium">Send Orange Money {packPrice} to {ORANGE_MONEY}</p>
                <p className="text-xs text-gray-600">Then upload {extraNeeded} extra photo(s) and your payment screenshot.</p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setExtraPhotos(Array.from(e.target.files || []).slice(0, extraNeeded))}
                  className="w-full border rounded-xl px-4 py-3 bg-white"
                />
                <p className="text-xs text-gray-500">{extraPhotos.length} of {extraNeeded} extra photo(s) selected</p>
                <label className="block text-sm font-medium">Orange Money screenshot</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPaymentShot(e.target.files?.[0] || null)}
                  className="w-full border rounded-xl px-4 py-3 bg-white"
                />
              </div>
            )}

            {message && (
              <p className={`text-sm ${message.toLowerCase().includes("fail") || message.toLowerCase().includes("fill") || message.toLowerCase().includes("please") ? "text-red-500" : "text-green-600"}`}>
                {message}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-[#006B3F] text-white font-semibold px-6 py-3 rounded-xl disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit listing request"}
            </button>
          </form>

          <div className="bg-white border rounded-2xl p-5 mt-6">
            <h2 className="font-semibold mb-2">Prefer WhatsApp?</h2>
            <a
              href={`https://wa.me/23275294553?text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#25D366] text-white font-semibold px-5 py-3 rounded-xl"
            >
              List on WhatsApp
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}