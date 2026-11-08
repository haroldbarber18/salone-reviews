"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { isAdminEmail } from "@/lib/roles";

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
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [city, setCity] = useState("");
  const [sex, setSex] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);
      setName(currentUser.displayName || "");
      setIsAdmin(isAdminEmail(currentUser.email));
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
        const staffSnap = await getDoc(doc(db, "staffHelpers", currentUser.email || ""));
        setIsStaff(staffSnap.exists());
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
      setEditing(false);
    } catch (error) {
      setMessage("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
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
          <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

          {!editing ? (
            <div className="bg-white border rounded-2xl p-6 mb-6">
              <p className="text-xl font-semibold">{name || "No name set"}</p>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="mt-2 text-[#006B3F] font-medium"
              >
                Edit
              </button>
            </div>
          ) : (
            <div className="bg-white border rounded-2xl p-6 mb-6">
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
                  <label className="block text-sm font-medium mb-1">Email</label>
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
                    <label className="block text-sm font-medium mb-1">Birth Month</label>
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
                  <label className="block text-sm font-medium mb-1">Hobbies</label>
                  <textarea
                    value={hobbies}
                    onChange={(e) => setHobbies(e.target.value)}
                    rows={3}
                    className="w-full border rounded-xl px-4 py-3 outline-none focus:border-[#006B3F]"
                    placeholder="e.g. football, cooking, reading"
                  />
                </div>
                {message && (
                  <p className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-500"}`}>
                    {message}
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-[#006B3F] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#005a35] disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="px-6 py-3 rounded-xl border"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-2">
            {isAdmin && (
              <Link href="/admin" className="block bg-white border rounded-xl px-4 py-3 font-semibold text-center">
                Admin
              </Link>
            )}
            {(isAdmin || isStaff) && (
              <Link href="/staff" className="block bg-white border rounded-xl px-4 py-3 font-semibold text-center">
                IT Staff
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="w-full bg-red-50 text-red-600 border border-red-200 font-semibold py-3 rounded-xl"
            >
              Log out
            </button>
          </div>

          <div className="mt-6">
            <Link href="/" className="text-[#006B3F] font-medium">
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}