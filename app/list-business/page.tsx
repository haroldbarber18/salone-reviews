"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

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
  "Other",
];

export default function ListBusinessPage() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Tradesmen");
  const [customCategory, setCustomCategory] = useState("");
  const [district, setDistrict] = useState("Western Area Urban");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !phone.trim()) {
      setMessage("Please fill in business name, phone and description.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await addDoc(collection(db, "businessRequests"), {
        name: name.trim(),
        category: category === "Other" ? customCategory.trim() || "Other" : category,
        district,
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        description: description.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setName("");
      setCategory("Tradesmen");
      setCustomCategory("");
      setDistrict("Western Area Urban");
      setPhone("");
      setWhatsapp("");
      setDescription("");
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
          <Link href="/" className="text-sm text-[#006B3F] font-medium">
            ← Back to Home
          </Link>

          <h1 className="text-3xl font-bold mt-4 mb-2">List your business</h1>
<p className="text-gray-600 mb-6">
  Basic listings are free. Upgrade later for photos, premium visibility, flyers and events.
</p>

<div className="bg-white border rounded-2xl p-5 mb-6">
  <h2 className="font-semibold text-lg mb-4">Why list on SaloneReviews?</h2>
  <div className="space-y-4">
    <div>
      <p className="font-semibold text-[#006B3F]">1. Free basic listing</p>
      <p className="text-sm text-gray-600">
        Get your business name, category, district, phone and description online free.
      </p>
    </div>
    <div>
      <p className="font-semibold text-[#006B3F]">2. More visibility</p>
      <p className="text-sm text-gray-600">
        Customers searching for trusted local services can find and contact you faster.
      </p>
    </div>
    <div>
      <p className="font-semibold text-[#006B3F]">3. Real reviews</p>
      <p className="text-sm text-gray-600">
        Build reputation through honest feedback from people who used your service.
      </p>
    </div>
    <div>
      <p className="font-semibold text-[#006B3F]">4. Premium options</p>
      <p className="text-sm text-gray-600">
        Add photos, featured placement, flyers and event promotions when you are ready.
      </p>
    </div>
  </div>
</div>

          <div className="bg-white border rounded-2xl p-5 mb-6">
            <h2 className="font-semibold mb-2">Prefer WhatsApp?</h2>
            <p className="text-sm text-gray-600 mb-3">
              Send your business details directly and we will help you list.
            </p>
            <a
              href={`https://wa.me/23275294553?text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#25D366] text-white font-semibold px-5 py-3 rounded-xl"
            >
              List on WhatsApp
            </a>
          </div>

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
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border rounded-xl px-4 py-3"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full border rounded-xl px-4 py-3"
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

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

            {message && (
              <p
                className={`text-sm ${
                  message.toLowerCase().includes("fail") ||
                  message.toLowerCase().includes("fill")
                    ? "text-red-500"
                    : "text-green-600"
                }`}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-[#006B3F] text-white font-semibold px-6 py-3 rounded-xl disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit free listing request"}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}