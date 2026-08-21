"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { auth, db } from "@/lib/firebase";
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

const ADMIN_EMAILS = ["gdos87@hotmail.com"];

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

const TYPES = [
  { value: "government", label: "Government" },
  { value: "financial", label: "Financial" },
  { value: "emergency", label: "Emergency" },
];

export default function AdminServicesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [type, setType] = useState("government");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [district, setDistrict] = useState("Western Area Urban");
  const [area, setArea] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [hours, setHours] = useState("");
  const [link, setLink] = useState("");

  const isAdmin = !!(user && ADMIN_EMAILS.includes(user.email || ""));

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (isAdmin) loadItems();
  }, [isAdmin]);

  const loadItems = async () => {
    const snap = await getDocs(collection(db, "essentialServices"));
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    data.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
    setItems(data);
  };

  const resetForm = () => {
    setEditingId(null);
    setType("government");
    setName("");
    setDescription("");
    setDistrict("Western Area Urban");
    setArea("");
    setPhone("");
    setWhatsapp("");
    setAddress("");
    setHours("");
    setLink("");
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setType(item.type || "government");
    setName(item.name || "");
    setDescription(item.description || "");
    setDistrict(item.district || "Western Area Urban");
    setArea(item.area || "");
    setPhone(item.phone || "");
    setWhatsapp(item.whatsapp || "");
    setAddress(item.address || "");
    setHours(item.hours || "");
    setLink(item.link || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!name.trim() || !description.trim()) {
      setMessage("Name and description are required.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const payload = {
        type,
        name: name.trim(),
        description: description.trim(),
        district,
        area: area.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        address: address.trim(),
        hours: hours.trim(),
        link: link.trim(),
        active: true,
      };

      if (editingId) {
        await updateDoc(doc(db, "essentialServices", editingId), payload);
        setMessage("Updated successfully.");
      } else {
        await addDoc(collection(db, "essentialServices"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        setMessage("Saved successfully.");
      }

      resetForm();
      loadItems();
    } catch (error) {
      console.log(error);
      setMessage("Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this service?")) return;
    await deleteDoc(doc(db, "essentialServices", id));
    if (editingId === id) resetForm();
    setMessage("Deleted.");
    loadItems();
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Admin access only</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-between mb-6">
            <h1 className="text-2xl font-bold">
              {editingId ? "Edit Essential Service" : "Essential Services"}
            </h1>
            <Link href="/admin" className="text-sm text-[#006B3F] font-medium">
              ← Back to Admin
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border rounded-2xl p-6 mb-8 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3"
                >
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">District</label>
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
            </div>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Service name"
              className="w-full border rounded-xl px-4 py-3"
              required
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description / what they do"
              rows={4}
              className="w-full border rounded-xl px-4 py-3"
              required
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Area / town"
                className="w-full border rounded-xl px-4 py-3"
              />
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Address"
                className="w-full border rounded-xl px-4 py-3"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone"
                className="w-full border rounded-xl px-4 py-3"
              />
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="WhatsApp number"
                className="w-full border rounded-xl px-4 py-3"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <input
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="Opening hours"
                className="w-full border rounded-xl px-4 py-3"
              />
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Optional website link"
                className="w-full border rounded-xl px-4 py-3"
              />
            </div>

            {message && (
              <p
                className={`text-sm ${
                  message.toLowerCase().includes("fail") ||
                  message.toLowerCase().includes("required")
                    ? "text-red-500"
                    : "text-green-600"
                }`}
              >
                {message}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#006B3F] text-white font-semibold px-6 py-3 rounded-xl disabled:opacity-60"
              >
                {loading ? "Saving..." : editingId ? "Update" : "Publish"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-200 text-gray-800 font-semibold px-6 py-3 rounded-xl"
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">Published services</h2>
            {items.length === 0 ? (
              <p className="text-gray-500">No essential services yet.</p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border rounded-2xl p-4 flex gap-4 items-start"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-1">
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                        {item.type}
                      </span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        {item.district}
                      </span>
                    </div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => startEdit(item)}
                      className="text-sm text-[#006B3F] font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-sm text-red-600 font-medium"
                    >
                      Delete
                    </button>
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