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

const CATEGORIES = [
  "Tradesmen",
  "Auto",
  "Food",
  "Hotels",
  "Beauty",
  "Home",
  "Other",
];

export default function AdminRequestsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Tradesmen");
  const [district, setDistrict] = useState("Western Area Urban");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");

  const isAdmin = !!(user && ADMIN_EMAILS.includes(user.email || ""));

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (isAdmin) loadRequests();
  }, [isAdmin]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "businessRequests"));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a: any, b: any) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      setRequests(data);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (req: any) => {
    setEditingId(req.id);
    setName(req.name || "");
    setCategory(req.category || "Tradesmen");
    setDistrict(req.district || "Western Area Urban");
    setPhone(req.phone || "");
    setWhatsapp(req.whatsapp || "");
    setDescription(req.description || "");
    setAddress(req.address || "");
    setArea(req.area || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName("");
    setCategory("Tradesmen");
    setDistrict("Western Area Urban");
    setPhone("");
    setWhatsapp("");
    setDescription("");
    setAddress("");
    setArea("");
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (!name.trim() || !description.trim()) {
      setMessage("Name and description are required.");
      return;
    }

    try {
      await updateDoc(doc(db, "businessRequests", editingId), {
        name: name.trim(),
        category,
        district,
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        description: description.trim(),
        address: address.trim(),
        area: area.trim(),
      });
      setMessage("Request updated.");
      cancelEdit();
      loadRequests();
    } catch (error) {
      console.log(error);
      setMessage("Failed to update request.");
    }
  };

  const handleApprove = async (req: any) => {
    if (!window.confirm(`Approve and publish "${req.name}"?`)) return;
    setMessage("");

    try {
      await addDoc(collection(db, "businesses"), {
        name: req.name || "",
        category: req.category || "Other",
        district: req.district || "",
        phone: req.phone || "",
        whatsapp: req.whatsapp || req.phone || "",
        description: req.description || "",
        address: req.address || "",
        area: req.area || "",
        active: true,
        premium: false,
        createdAt: serverTimestamp(),
        source: "businessRequest",
        requestId: req.id,
      });

      await updateDoc(doc(db, "businessRequests", req.id), {
        status: "approved",
        reviewedAt: serverTimestamp(),
      });

      setMessage(`Approved: ${req.name}`);
      if (editingId === req.id) cancelEdit();
      loadRequests();
    } catch (error) {
      console.log(error);
      setMessage("Failed to approve request.");
    }
  };

  const handleReject = async (req: any) => {
    if (!window.confirm(`Reject "${req.name}"?`)) return;
    setMessage("");

    try {
      await updateDoc(doc(db, "businessRequests", req.id), {
        status: "rejected",
        reviewedAt: serverTimestamp(),
      });
      setMessage(`Rejected: ${req.name}`);
      if (editingId === req.id) cancelEdit();
      loadRequests();
    } catch (error) {
      console.log(error);
      setMessage("Failed to reject request.");
    }
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
        Admin access only
      </div>
    );
  }

  const pending = requests.filter((r) => r.status === "pending");
  const others = requests.filter((r) => r.status !== "pending");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Business Requests</h1>
            <Link href="/admin" className="text-sm text-[#006B3F] font-medium">
              ← Back to Admin
            </Link>
          </div>

          {message && (
            <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              {message}
            </p>
          )}

          {editingId && (
            <div className="bg-white border rounded-2xl p-5 mb-8 space-y-3">
              <h2 className="font-semibold text-lg">Edit request before publish</h2>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Business name"
                className="w-full border rounded-xl px-4 py-3"
              />

              <div className="grid sm:grid-cols-2 gap-3">
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

              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone"
                  className="w-full border rounded-xl px-4 py-3"
                />
                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="WhatsApp"
                  className="w-full border rounded-xl px-4 py-3"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
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

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                rows={4}
                className="w-full border rounded-xl px-4 py-3"
              />

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSaveEdit}
                  className="bg-[#006B3F] text-white font-semibold px-5 py-2.5 rounded-xl"
                >
                  Save changes
                </button>
                <button
                  onClick={cancelEdit}
                  className="bg-gray-100 text-gray-700 font-semibold px-5 py-2.5 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <h2 className="text-lg font-semibold mb-3">
            Pending ({pending.length})
          </h2>

          {loading ? (
            <p>Loading...</p>
          ) : pending.length === 0 ? (
            <div className="bg-white border rounded-2xl p-5 text-gray-500 mb-8">
              No pending requests.
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              {pending.map((req) => (
                <div key={req.id} className="bg-white border rounded-2xl p-5">
                  <h3 className="font-semibold text-lg">{req.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {req.category} · {req.district}
                  </p>
                  <p className="text-sm text-gray-700 mt-2">{req.description}</p>
                  <p className="text-sm mt-2">
                    Phone: {req.phone || "-"} | WhatsApp: {req.whatsapp || "-"}
                  </p>
                  {(req.area || req.address) && (
                    <p className="text-sm text-gray-600 mt-1">
                      {req.area ? `${req.area}` : ""}
                      {req.area && req.address ? " · " : ""}
                      {req.address || ""}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 mt-4">
                    <button
                      onClick={() => startEdit(req)}
                      className="bg-gray-100 text-gray-800 font-semibold px-4 py-2 rounded-xl"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleApprove(req)}
                      className="bg-[#006B3F] text-white font-semibold px-4 py-2 rounded-xl"
                    >
                      Approve & Publish
                    </button>
                    <button
                      onClick={() => handleReject(req)}
                      className="bg-red-50 text-red-600 font-semibold px-4 py-2 rounded-xl border border-red-200"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 className="text-lg font-semibold mb-3">
            Reviewed ({others.length})
          </h2>

          {others.length === 0 ? (
            <div className="bg-white border rounded-2xl p-5 text-gray-500">
              No reviewed requests yet.
            </div>
          ) : (
            <div className="space-y-3">
              {others.map((req) => (
                <div key={req.id} className="bg-white border rounded-2xl p-4">
                  <div className="flex justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{req.name}</h3>
                      <p className="text-sm text-gray-600">
                        {req.category} · {req.district}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full h-fit ${
                        req.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}