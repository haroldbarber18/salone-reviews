"use client";

/**
 * DROP-IN: replace app/list-business/page.tsx
 * New photo packs:
 *   2 photos free
 *   3 extra — NLe 500 (5 total)
 *   7 extra — NLe 1,000 (9 total)
 */

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db, storage } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const ORANGE_MONEY = "075294553";

const DISTRICTS = [
  "Western Area Urban","Western Area Rural","Bo","Bombali","Bonthe","Kailahun","Kambia","Kenema",
  "Koinadugu","Kono","Moyamba","Port Loko","Pujehun","Tonkolili","Karene","Falaba",
];

const CATEGORIES = [
  "Tradesmen","Auto","Food","Hotels","Beauty","Home","Health & Medical","Education & Training",
  "Money & Insurance","Legal & Government","Shopping & Fashion","Electronics & Tech",
  "Events & Entertainment","Media & Publishing","Business Services","Animals & Pets",
  "Sports & Fitness","Utilities & Energy","Public & Community","Other",
];

const SUBCATEGORIES: Record<string, string[]> = {
  Tradesmen: ["Electrician","Painter","Tiler","Welder","Carpenter","Plumber","Builder","Mason","Bricklayer","Roofer","Plasterer","Ceiling / gypsum","AC technician","Generator","Solar","Aluminium / glass","Labourer","Other"],
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

function cleanWebsite(raw: string) {
  const t = raw.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

async function uploadOne(folder: string, file: File) {
  const fileRef = ref(storage, `${folder}/${Date.now()}-${file.name}`);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

export default function ListBusinessPage() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Tradesmen");
  const [subcategory, setSubcategory] = useState("");
  const [customSub, setCustomSub] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [district, setDistrict] = useState("Western Area Urban");
  const [area, setArea] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [freePhoto1, setFreePhoto1] = useState<File | null>(null);
  const [freePhoto2, setFreePhoto2] = useState<File | null>(null);
  const [showPaid, setShowPaid] = useState(false);
  const [photoPack, setPhotoPack] = useState<"none" | "plus3" | "plus7">("none");
  const [extraPhotos, setExtraPhotos] = useState<File[]>([]);
  const [paymentShot, setPaymentShot] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const subcategoryOptions = SUBCATEGORIES[category] || [];
  const extraNeeded = photoPack === "plus3" ? 3 : photoPack === "plus7" ? 7 : 0;
  const packPrice = photoPack === "plus3" ? "NLe 500" : photoPack === "plus7" ? "NLe 1,000" : "";

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
      const freePhotoUrls: string[] = [];
      if (freePhoto1) freePhotoUrls.push(await uploadOne("listing-requests", freePhoto1));
      if (freePhoto2) freePhotoUrls.push(await uploadOne("listing-requests", freePhoto2));
      const extraPhotoUrls: string[] = [];
      for (const file of extraPhotos.slice(0, extraNeeded)) {
        extraPhotoUrls.push(await uploadOne("listing-requests", file));
      }
      let paymentScreenshotUrl = "";
      if (paymentShot) paymentScreenshotUrl = await uploadOne("listing-payments", paymentShot);

      await addDoc(collection(db, "businessRequests"), {
        name: name.trim(),
        category: category === "Other" ? customCategory.trim() || "Other" : category,
        subcategory: category === "Other" ? "" : (subcategory === "Other" ? customSub.trim() : subcategory.trim()),
        district,
        area: area.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        website: cleanWebsite(website),
        description: description.trim(),
        freePhotoUrl: freePhotoUrls[0] || "",
        freePhotoUrls,
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

      setName(""); setCategory("Tradesmen"); setSubcategory(""); setCustomSub(""); setCustomCategory("");
      setDistrict("Western Area Urban"); setArea(""); setPhone(""); setWhatsapp("");
      setWebsite(""); setDescription(""); setFreePhoto1(null); setFreePhoto2(null); setShowPaid(false);
      setPhotoPack("none"); setExtraPhotos([]); setPaymentShot(null);
      setMessage("Request submitted. We will review and contact you.");
    } catch (error) {
      console.log(error);
      setMessage("Failed to submit. Please try WhatsApp instead.");
    } finally {
      setLoading(false);
    }
  };

  const whatsappText = encodeURIComponent(
    "Hello SaloneReviews, I want to list my business.\nName:\nCategory:\nDistrict:\nPhone:\nWebsite:\nShort description:"
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">List your business</h1>
          <p className="text-sm text-gray-600 mb-6">
            Name, area, phone, a short description and up to 2 photos free.
          </p>
          <form onSubmit={handleSubmit} className="bg-white border rounded-2xl p-5 space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Business name" className="w-full border rounded-xl px-4 py-3" required />
            <select value={category} onChange={(e) => { setCategory(e.target.value); setSubcategory(""); setCustomSub(""); }} className="w-full border rounded-xl px-4 py-3">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={district} onChange={(e) => setDistrict(e.target.value)} className="w-full border rounded-xl px-4 py-3">
              {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {category !== "Other" && subcategoryOptions.length > 0 && (
              <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)} className="w-full border rounded-xl px-4 py-3">
                <option value="">Subcategory optional — leave blank</option>
                {subcategoryOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            {subcategory === "Other" && category !== "Other" && (
              <input value={customSub} onChange={(e) => setCustomSub(e.target.value)} placeholder="Type the trade / subcategory" className="w-full border rounded-xl px-4 py-3" />
            )}
            {category === "Other" && (
              <input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Enter category" maxLength={15} className="w-full border rounded-xl px-4 py-3" />
            )}
            <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Area / street (e.g. Peninsular Road)" className="w-full border rounded-xl px-4 py-3" />
            <div className="grid sm:grid-cols-2 gap-3">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" className="w-full border rounded-xl px-4 py-3" required />
              <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp number" className="w-full border rounded-xl px-4 py-3" />
            </div>
            <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Website or Facebook page (optional)" className="w-full border rounded-xl px-4 py-3" inputMode="url" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description of your business" rows={4} className="w-full border rounded-xl px-4 py-3" required />
            <div>
              <label className="block text-sm font-medium mb-1">Photo 1 (free — shop front)</label>
              <input type="file" accept="image/*" onChange={(e) => setFreePhoto1(e.target.files?.[0] || null)} className="w-full border rounded-xl px-4 py-3 bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Photo 2 (free, optional)</label>
              <input type="file" accept="image/*" onChange={(e) => setFreePhoto2(e.target.files?.[0] || null)} className="w-full border rounded-xl px-4 py-3 bg-white" />
            </div>
            <button type="button" onClick={() => setShowPaid((v) => !v)} className="text-sm font-medium text-[#006B3F]">
              {showPaid ? "Hide extra photos" : "Add extra photos (paid, optional)"}
            </button>
            {showPaid && (
              <div className="border rounded-2xl p-4 space-y-3 bg-gray-50">
                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-2"><input type="radio" checked={photoPack === "none"} onChange={() => { setPhotoPack("none"); setExtraPhotos([]); }} /> No extra photos</label>
                  <label className="flex items-center gap-2"><input type="radio" checked={photoPack === "plus3"} onChange={() => setPhotoPack("plus3")} /> 3 extra photos — NLe 500 (5 total)</label>
                  <label className="flex items-center gap-2"><input type="radio" checked={photoPack === "plus7"} onChange={() => setPhotoPack("plus7")} /> 7 extra photos — NLe 1,000 (9 total)</label>
                </div>
                {extraNeeded > 0 && (
                  <>
                    <p className="text-sm font-medium">Send Orange Money {packPrice} to {ORANGE_MONEY}</p>
                    <input type="file" accept="image/*" multiple onChange={(e) => setExtraPhotos(Array.from(e.target.files || []).slice(0, extraNeeded))} className="w-full border rounded-xl px-4 py-3 bg-white" />
                    <p className="text-xs text-gray-500">{extraPhotos.length} of {extraNeeded} extra photo(s)</p>
                    <label className="block text-sm font-medium">Orange Money screenshot</label>
                    <input type="file" accept="image/*" onChange={(e) => setPaymentShot(e.target.files?.[0] || null)} className="w-full border rounded-xl px-4 py-3 bg-white" />
                  </>
                )}
              </div>
            )}
            {message && (
              <p className={`text-sm ${message.toLowerCase().includes("fail") || message.toLowerCase().includes("fill") || message.toLowerCase().includes("please") ? "text-red-500" : "text-green-600"}`}>{message}</p>
            )}
            <button type="submit" disabled={loading} className="bg-[#006B3F] text-white font-semibold px-6 py-3 rounded-xl disabled:opacity-60">
              {loading ? "Submitting..." : "Submit listing request"}
            </button>
          </form>
          <div className="bg-white border rounded-2xl p-5 mt-6">
            <h2 className="font-semibold mb-2">Prefer WhatsApp?</h2>
            <a href={`https://wa.me/23275294553?text=${whatsappText}`} target="_blank" rel="noopener noreferrer" className="inline-block bg-[#25D366] text-white font-semibold px-5 py-3 rounded-xl">
              List on WhatsApp
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}