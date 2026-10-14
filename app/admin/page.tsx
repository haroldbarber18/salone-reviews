"use client";
import { useEffect, useMemo, useState } from "react";
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
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { isAdminEmail, normEmail } from "@/lib/roles";

const categories = [
  "Tradesmen","Auto","Food","Hotels","Beauty","Home","Health & Medical","Education & Training",
  "Money & Insurance","Legal & Government","Shopping & Fashion","Electronics & Tech",
  "Events & Entertainment","Media & Publishing","Business Services","Animals & Pets",
  "Sports & Fitness","Utilities & Energy","Public & Community","Other",
];
const districts = [
  "Western Area Urban","Western Area Rural","Bo","Kenema","Bombali","Port Loko","Kono",
  "Kailahun","Tonkolili","Kambia","Moyamba","Bonthe","Pujehun","Karene","Falaba","Koinadugu",
];

function isFeaturedActive(b: any) {
  if (!b?.featuredUntil) return false;
  const d = new Date(b.featuredUntil);
  if (isNaN(d.getTime())) return false;
  d.setHours(23, 59, 59, 999);
  return d >= new Date();
}

function requestPayload(r: any) {
  return {
    name: r.name || "",
    category: r.category || "Tradesmen",
    customCategory: r.customCategory || "",
    subcategory: r.subcategory || "",
    district: r.district || "Western Area Urban",
    area: r.area || "",
    phone: r.phone || "",
    whatsapp: r.whatsapp || "",
    hours: r.hours || "",
    website: r.website || "",
    description: r.description || "",
    isPremium: !!r.isPremium,
    featuredUntil: r.featuredUntil || "",
    showOnSlider: !!r.showOnSlider,
    profileUntil: r.profileUntil || "",
    videoUrl: r.videoUrl || "",
    videoUntil: r.videoUntil || "",
    photos: Array.isArray(r.photos) ? r.photos : [],
    profilePhoto: r.profilePhoto || "",
  };
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [pendingStaff, setPendingStaff] = useState<any[]>([]);
  const [listQuery, setListQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Tradesmen");
  const [customCategory, setCustomCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [district, setDistrict] = useState("Western Area Urban");
  const [area, setArea] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [hours, setHours] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [featuredUntil, setFeaturedUntil] = useState("");
  const [showOnSlider, setShowOnSlider] = useState(false);
  const [profileUntil, setProfileUntil] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoUntil, setVideoUntil] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [profilePhoto, setProfilePhoto] = useState("");
  const [profileFile, setProfileFile] = useState<File | null>(null);

  const [staffHelpers, setStaffHelpers] = useState<any[]>([]);
  const [staffEmail, setStaffEmail] = useState("");
  const [staffCanEdit, setStaffCanEdit] = useState(false);
  const [staffCanImport, setStaffCanImport] = useState(false);
  const [staffActivity, setStaffActivity] = useState<any[]>([]);
  const [staffMessage, setStaffMessage] = useState("");
  const [paidPhotoIds, setPaidPhotoIds] = useState<Record<string, boolean>>({});
  const [approveIds, setApproveIds] = useState<string[]>([]);

  const isAdmin = isAdminEmail(user?.email);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setChecking(false); });
    return () => unsub();
  }, []);

  useEffect(() => { if (isAdmin) { loadBusinesses(); loadStaff(); loadPendingStaff(); } }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || businesses.length === 0 || typeof window === "undefined") return;
    const editId = new URLSearchParams(window.location.search).get("edit");
    if (!editId) return;
    const found = businesses.find((b) => b.id === editId);
    if (found) startEdit(found);
  }, [isAdmin, businesses]);

  const loadStaff = async () => {
    const [helpersSnap, activitySnap] = await Promise.all([
      getDocs(collection(db, "staffHelpers")),
      getDocs(collection(db, "staffActivity")),
    ]);
    setStaffHelpers(helpersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    const logs = activitySnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    logs.sort((a: any, b: any) => Number(b.createdAtMs || 0) - Number(a.createdAtMs || 0));
    setStaffActivity(logs.slice(0, 40));
  };

  const loadPendingStaff = async () => {
    try {
      const snap = await getDocs(collection(db, "businessRequests"));
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const pending = rows.filter((r: any) => (r.source === "staff" || r.source === "google-places") && (!r.status || r.status === "pending"));
      pending.sort((a: any, b: any) => Number(b.createdAtMs || 0) - Number(a.createdAtMs || 0));
      setPendingStaff(pending);
    } catch {
      setPendingStaff([]);
    }
  };

  const addStaffHelper = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = normEmail(staffEmail);
    if (!email || !email.includes("@")) {
      setStaffMessage("Enter a valid email.");
      return;
    }
    if (staffHelpers.some((s) => normEmail(s.email) === email)) {
      setStaffMessage("That email is already staff.");
      return;
    }
    try {
      await addDoc(collection(db, "staffHelpers"), {
        email,
        canEdit: staffCanEdit,
        canImportPlaces: staffCanImport,
        createdAt: serverTimestamp(),
      });
      await addDoc(collection(db, "staffActivity"), {
        actorEmail: normEmail(user?.email),
        action: "staff-added",
        details: `${email} · ${staffCanEdit ? "can edit" : "add only"}`,
        createdAt: serverTimestamp(),
        createdAtMs: Date.now(),
      });
      setStaffEmail("");
      setStaffMessage("Staff helper added. They must sign up / log in with that same email.");
      loadStaff();
    } catch (err: any) {
      setStaffMessage(err?.code === "permission-denied"
        ? "Firebase blocked this. Open Firestore Rules and allow staffHelpers + staffActivity."
        : (err?.message || "Could not add staff."));
    }
  };

  const toggleStaffImport = async (helper: any) => {
    await updateDoc(doc(db, "staffHelpers", helper.id), { canImportPlaces: !helper.canImportPlaces });
    await addDoc(collection(db, "staffActivity"), {
      actorEmail: normEmail(user?.email),
      action: helper.canImportPlaces ? "import-removed" : "import-allowed",
      details: helper.email,
      createdAt: serverTimestamp(),
      createdAtMs: Date.now(),
    });
    loadStaff();
  };

  const removeStaffHelper = async (helper: any) => {
    await deleteDoc(doc(db, "staffHelpers", helper.id));
    await addDoc(collection(db, "staffActivity"), {
      actorEmail: normEmail(user?.email),
      action: "staff-removed",
      details: helper.email,
      createdAt: serverTimestamp(),
      createdAtMs: Date.now(),
    });
    loadStaff();
  };

  const loadBusinesses = async () => {
    const qy = query(collection(db, "businesses"), orderBy("createdAt", "desc"));
    const snap = await getDocs(qy);
    setBusinesses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const visibleBusinesses = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    const filtered = q
      ? businesses.filter((b) =>
          [b.name, b.category, b.subcategory, b.district, b.area, b.phone, b.whatsapp]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q)
        )
      : businesses;
    return [...filtered].sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" })
    );
  }, [businesses, listQuery]);

  const resetForm = () => {
    setEditingId(null); setEditingRequestId(null); setName(""); setCategory("Tradesmen"); setCustomCategory("");
    setSubcategory(""); setDistrict("Western Area Urban"); setArea(""); setPhone("");
    setWhatsapp(""); setHours(""); setWebsite(""); setDescription(""); setIsPremium(false);
    setFeaturedUntil(""); setShowOnSlider(false); setProfileUntil(""); setVideoUrl(""); setVideoUntil(""); setPhotoFiles([]); setExistingPhotos([]);
    setProfilePhoto(""); setProfileFile(null);
  };

  const fillForm = (b: any) => {
    const cat = String(b.category || "Tradesmen");
    const known = categories.includes(cat);
    setName(b.name || "");
    setCategory(known ? cat : "Tradesmen");
    setCustomCategory(b.customCategory || (!known ? cat : ""));
    setSubcategory(b.subcategory || (!known ? cat : ""));
    setDistrict(b.district || "Western Area Urban"); setArea(b.area || "");
    setPhone(b.phone || ""); setWhatsapp(b.whatsapp || ""); setHours(b.hours || ""); setWebsite(b.website || "");
    setDescription(b.description || ""); setIsPremium(!!b.isPremium);
    setFeaturedUntil(b.featuredUntil || "");
    setShowOnSlider(!!b.showOnSlider);
    setProfileUntil(b.profileUntil || "");
    setVideoUrl(b.videoUrl || "");
    setVideoUntil(b.videoUntil || "");
    setExistingPhotos(Array.isArray(b.photos) ? b.photos : b.photo ? [b.photo] : []);
    setProfilePhoto(b.profilePhoto || "");
    setProfileFile(null);
    setPhotoFiles([]); window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startEdit = (b: any) => {
    setEditingId(b.id);
    setEditingRequestId(null);
    fillForm(b);
  };

  const startEditRequest = (r: any) => {
    setEditingId(null);
    setEditingRequestId(r.id);
    fillForm(r);
    setMessage(`Editing pending: ${r.name || ""}. Form is at the top. Save pending, then Approve.`);
    setTimeout(() => {
      document.getElementById("admin-listing-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const setAsCover = (url: string) => {
    setExistingPhotos((prev) => [url, ...prev.filter((p) => p !== url)]);
  };

  const openLightbox = (urls: string[], index: number) => {
    setLightbox({ urls, index });
  };

  const approveRequest = async (r: any) => {
    try {
      const base = requestPayload(r);
      const paidPhotos = !!paidPhotoIds[r.id] || !!r.isPremium;
      const photos = (base.photos || []).slice(0, paidPhotos ? 6 : 2);
      await addDoc(collection(db, "businesses"), {
        ...base,
        photos,
        isPremium: paidPhotos,
        createdAt: serverTimestamp(),
        createdByStaff: r.submittedBy || "",
      });
      await updateDoc(doc(db, "businessRequests", r.id), {
        status: "approved",
        reviewedAtMs: Date.now(),
      });
      await addDoc(collection(db, "staffActivity"), {
        actorEmail: normEmail(user?.email),
        action: "admin-approved-staff-listing",
        businessName: r.name,
        details: r.submittedBy || "",
        createdAt: serverTimestamp(),
        createdAtMs: Date.now(),
      });
      setMessage(`Approved: ${r.name}`);
      loadBusinesses();
      loadPendingStaff();
    } catch {
      setMessage("Approve failed. Check Firestore rules.");
    }
  };

  const rejectRequest = async (r: any) => {
    try {
      await updateDoc(doc(db, "businessRequests", r.id), {
        status: "rejected",
        reviewedAtMs: Date.now(),
      });
      await addDoc(collection(db, "staffActivity"), {
        actorEmail: normEmail(user?.email),
        action: "admin-rejected-staff-listing",
        businessName: r.name,
        details: r.submittedBy || "",
        createdAt: serverTimestamp(),
        createdAtMs: Date.now(),
      });
      setMessage(`Rejected: ${r.name}`);
      loadPendingStaff();
    } catch {
      setMessage("Reject failed.");
    }
  };

  const approveTicked = async () => {
    const chosen = pendingStaff.filter((r) => approveIds.includes(r.id));
    if (!chosen.length) {
      setMessage("Tick the listings to approve first.");
      return;
    }
    for (const row of chosen) {
      await approveRequest(row);
    }
    setApproveIds([]);
    setMessage(`${chosen.length} approved.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) { setMessage("Name and description are required."); return; }
    setLoading(true); setMessage("");
    try {
      const uploaded: string[] = [];
      for (const file of photoFiles) {
        const r = ref(storage, `businesses/${Date.now()}-${file.name}`);
        await uploadBytes(r, file);
        uploaded.push(await getDownloadURL(r));
      }
      const photos = [...existingPhotos, ...uploaded].slice(0, isPremium ? 6 : 1);
      let nextProfile = profilePhoto;
      if (profileFile) {
        const pr = ref(storage, `businesses/profile-${Date.now()}-${profileFile.name}`);
        await uploadBytes(pr, profileFile);
        nextProfile = await getDownloadURL(pr);
      }
      const payload = {
        name: name.trim(),
        profilePhoto: nextProfile,
        category: category === "Other" && customCategory.trim() ? customCategory.trim() : category,
        customCategory: customCategory.trim(), subcategory: subcategory.trim(), district,
        area: area.trim(), phone: phone.trim(), whatsapp: whatsapp.trim(), hours: hours.trim(), website: website.trim(),
        description: description.trim(), isPremium,
        featuredUntil: featuredUntil || "",
        showOnSlider,
        profileUntil: profileUntil || "",
        videoUrl: videoUrl.trim(), videoUntil: videoUntil || "",
        photos,
        photo: photos[0] || "",
      };
      if (editingRequestId) {
        await updateDoc(doc(db, "businessRequests", editingRequestId), {
          ...payload,
          status: "pending",
          updatedAtMs: Date.now(),
        });
        setMessage("Pending staff listing updated. Approve it when ready.");
        loadPendingStaff();
      } else if (editingId) {
        await updateDoc(doc(db, "businesses", editingId), payload);
        setMessage("Updated.");
      } else {
        await addDoc(collection(db, "businesses"), { ...payload, createdAt: serverTimestamp() });
        setMessage("Saved.");
      }
      resetForm(); loadBusinesses();
    } catch { setMessage("Failed to save."); }
    finally { setLoading(false); }
  };

  if (checking) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) { router.push("/login"); return null; }
  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center">Admin access only</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-4">{editingId || editingRequestId ? "Edit business" : "Admin"}</h1>
          {editingId && (
            <Link href="/explore" className="text-sm font-medium text-[#006B3F] mb-4 inline-block">← Back to search</Link>
          )}

          {/* Staff helpers, pending listings, and form sections remain the same as your original code */}
          {/* Keep all your existing JSX for staff helpers, pending staff, and the form up to the photos section */}

          {/* Replace only the existing photos block inside the form with this: */}
          {existingPhotos.length > 0 && (
            <div className="border rounded-xl p-4 bg-gray-50">
              <p className="font-semibold text-sm mb-3">
                Current photos ({existingPhotos.length}/{isPremium ? 6 : 1}) — first photo is the cover
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {existingPhotos.map((url, index) => (
                  <div key={`${url}-${index}`} className="relative">
                    <img
                      src={url}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-28 object-cover rounded-xl border bg-white cursor-pointer"
                      onClick={() => openLightbox(existingPhotos, index)}
                    />
                    <button
                      type="button"
                      onClick={() => setExistingPhotos((prev) => prev.filter((_, i) => i !== index))}
                      className="absolute top-2 right-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-lg"
                    >
                      Remove
                    </button>
                    {index !== 0 && (
                      <button
                        type="button"
                        onClick={() => setAsCover(url)}
                        className="absolute bottom-1 left-1 right-1 bg-black/60 text-white text-[10px] font-semibold py-1 rounded"
                      >
                        Set as cover
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Click a photo to enlarge. Set as cover moves it to the front. Remove then Update to save.</p>
            </div>
          )}

          {/* Rest of the form (file input, featured, video, buttons) stays exactly as in your original code */}

          {/* Current businesses list stays exactly as in your original code */}
        </div>
      </main>

      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox.urls[lightbox.index]}
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {lightbox.urls.length > 1 && (
            <>
              <button
                className="absolute left-4 text-white text-4xl"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((lb) => lb && { ...lb, index: (lb.index - 1 + lb.urls.length) % lb.urls.length });
                }}
              >
                ‹
              </button>
              <button
                className="absolute right-4 text-white text-4xl"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((lb) => lb && { ...lb, index: (lb.index + 1) % lb.urls.length });
                }}
              >
                ›
              </button>
            </>
          )}
        </div>
      )}

      <Footer />
    </div>
  );
}