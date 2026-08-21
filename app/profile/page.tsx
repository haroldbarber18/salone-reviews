"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [city, setCity] = useState("");
  const [sex, setSex] = useState("");
  const [hobbies, setHobbies] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);
      setName(currentUser.displayName || "");

      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (snap.exists()) {
          const data = snap.data();
          setAge(data.age || "");
          setBirthMonth(data.birthMonth || "");
          setCity(data.city || "");
          setSex(data.sex || "");
          setHobbies(data.hobbies || "");
          if (data.name) setName(data.name);
        }
      } catch (error) {
        console.log("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage("");

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          name: name.trim(),
          email: user.email || "",
          age: age.trim(),
          birthMonth,
          city: city.trim(),
          sex,
          hobbies: hobbies.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMessage("Profile saved successfully.");
    } catch (error) {
      setMessage("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
          <p className="text-gray-600 mb-8">
            This information is optional. You can complete it anytime.
          </p>

          <div className="bg-white border rounded-2xl p-6">
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:border-[#006B3F]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full border rounded-xl px-4 py-3 bg-gray-100 text-gray-500"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Age</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full border rounded-xl px-4 py-3 outline-none focus:border-[#006B3F]"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Birth Month
                  </label>
                  <select
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    className="w-full border rounded-xl px-4 py-3 outline-none focus:border-[#006B3F] bg-white"
                  >
                    <option value="">Optional</option>
                    {months.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:border-[#006B3F]"
                  placeholder="e.g. Freetown"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Sex</label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:border-[#006B3F] bg-white"
                >
                  <option value="">Optional</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Hobbies
                </label>
                <textarea
                  value={hobbies}
                  onChange={(e) => setHobbies(e.target.value)}
                  rows={3}
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:border-[#006B3F]"
                  placeholder="e.g. football, cooking, reading"
                />
              </div>

              {message && (
                <p
                  className={`text-sm ${
                    message.includes("success")
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="bg-[#006B3F] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#005a35] disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </form>
          </div>

          <div className="mt-6">
            <Link href="/explore" className="text-[#006B3F] font-medium">
              ← Back to Explore
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}