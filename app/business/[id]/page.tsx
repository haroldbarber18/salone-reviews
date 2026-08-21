"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const ADMIN_EMAILS = ["gdos87@hotmail.com"];
const RESPONSE_DAYS = 14;

const FILE_ACCEPT =
  "image/jpeg,image/jpg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf";

function getFirstName(fullName?: string | null) {
  if (!fullName) return "User";
  return fullName.trim().split(/\s+/)[0];
}

function getReviewDate(review: any): Date | null {
  if (!review?.createdAt) return null;
  if (typeof review.createdAt.toDate === "function") return review.createdAt.toDate();
  if (review.createdAt.seconds) return new Date(review.createdAt.seconds * 1000);
  const d = new Date(review.createdAt);
  return isNaN(d.getTime()) ? null : d;
}

function getDaysSince(review: any) {
  const d = getReviewDate(review);
  if (!d) return 0;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function BusinessPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [business, setBusiness] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [postAnonymously, setPostAnonymously] = useState(false);
  const [hasProof, setHasProof] = useState(false);
  const [newReviewFiles, setNewReviewFiles] = useState<File[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [proofs, setProofs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [hasReviewed, setHasReviewed] = useState(false);

  const [responseText, setResponseText] = useState<Record<string, string>>({});
  const [adminNoteText, setAdminNoteText] = useState<Record<string, string>>({});
  const [savingResponse, setSavingResponse] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);

  const [proofFiles, setProofFiles] = useState<Record<string, File[]>>({});
  const [proofNote, setProofNote] = useState<Record<string, string>>({});
  const [uploadingProof, setUploadingProof] = useState<string | null>(null);

  const isAdmin = !!(user && ADMIN_EMAILS.includes(user.email || ""));
  const isLowRating = rating <= 2;
  const canBeAnonymous = rating >= 3;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (id) {
      loadBusiness();
      loadReviews();
      loadProofs();
    }
  }, [id]);

  useEffect(() => {
    if (user) setHasReviewed(reviews.some((r) => r.userId === user.uid));
    else setHasReviewed(false);
  }, [user, reviews]);

  useEffect(() => {
    if (rating <= 2) setPostAnonymously(false);
    if (rating >= 3) {
      setHasProof(false);
      setNewReviewFiles([]);
    }
  }, [rating]);

  const loadBusiness = async () => {
    try {
      const snap = await getDoc(doc(db, "businesses", id));
      if (snap.exists()) setBusiness({ id: snap.id, ...snap.data() });
      else setBusiness(null);
    } catch {
      setBusiness(null);
    } finally {
      setPageLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const q = query(collection(db, "reviews"), where("businessId", "==", id));
      const snapshot = await getDocs(q);
      setReviews(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.log(error);
    }
  };

  const loadProofs = async () => {
    try {
      const q = query(collection(db, "reviewProofs"), where("businessId", "==", id));
      const snapshot = await getDocs(q);
      setProofs(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.log(error);
    }
  };

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : "0.0";

  const uploadFiles = async (reviewId: string, files: File[]) => {
    const urls: string[] = [];
    for (const file of files) {
      const fileRef = ref(storage, `review-proofs/${reviewId}/${Date.now()}-${file.name}`);
      await uploadBytes(fileRef, file);
      urls.push(await getDownloadURL(fileRef));
    }
    return urls;
  };

  const getPublicStatus = (review: any) => {
    const days = getDaysSince(review);
    const hasResponse = !!(review.businessResponse && String(review.businessResponse).trim());

    if (review.claimStatus === "unverified_claim") return "uc";
    if (hasResponse) return "responded";
    if (days >= RESPONSE_DAYS) return "stands";
    if (review.claimStatus === "under_review") return "under_review";
    if (review.claimStatus === "resolved") return "resolved";
    return "";
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }
    if (hasReviewed) {
      setMessage("You have already reviewed this business.");
      return;
    }
    if (isLowRating && hasProof && newReviewFiles.length === 0) {
      setMessage("You ticked that you have proof. Please upload invoice/photo before submitting.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const existingQ = query(
        collection(db, "reviews"),
        where("businessId", "==", id),
        where("userId", "==", user.uid)
      );
      const existingSnap = await getDocs(existingQ);
      if (!existingSnap.empty) {
        setHasReviewed(true);
        setMessage("You have already reviewed this business.");
        setLoading(false);
        return;
      }

      const firstName = getFirstName(user.displayName);
      const displayName = postAnonymously && canBeAnonymous ? "Anonymous" : firstName;

      const reviewRef = await addDoc(collection(db, "reviews"), {
        businessId: id,
        businessName: business?.name || "",
        userId: user.uid,
        userName: displayName,
        isAnonymous: postAnonymously && canBeAnonymous,
        rating,
        comment,
        hasProofClaim: isLowRating ? hasProof : false,
        claimStatus: isLowRating ? "under_review" : "",
        businessResponse: "",
        adminNote: "",
        createdAt: serverTimestamp(),
      });

      if (isLowRating && hasProof && newReviewFiles.length > 0) {
        const urls = await uploadFiles(reviewRef.id, newReviewFiles);
        await addDoc(collection(db, "reviewProofs"), {
          reviewId: reviewRef.id,
          businessId: id,
          userId: user.uid,
          note: "Submitted with review",
          files: urls,
          createdAt: serverTimestamp(),
        });
      }

      setComment("");
      setRating(5);
      setPostAnonymously(false);
      setHasProof(false);
      setNewReviewFiles([]);
      setMessage("Review submitted successfully!");
      setHasReviewed(true);
      loadReviews();
      loadProofs();
    } catch (error) {
      console.log(error);
      setMessage("Failed to submit review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!isAdmin) return;
    if (!window.confirm("Remove this review?")) return;
    try {
      await deleteDoc(doc(db, "reviews", reviewId));
      setMessage("Review removed.");
      loadReviews();
    } catch {
      setMessage("Failed to remove review.");
    }
  };

  const handleSaveBusinessResponse = async (reviewId: string) => {
    if (!isAdmin) return;
    setSavingResponse(reviewId);
    try {
      await updateDoc(doc(db, "reviews", reviewId), {
        businessResponse: (responseText[reviewId] || "").trim(),
        businessResponseAt: serverTimestamp(),
        claimStatus: "resolved",
      });
      setMessage("Business response saved.");
      loadReviews();
    } catch {
      setMessage("Failed to save business response.");
    } finally {
      setSavingResponse(null);
    }
  };

  const handleSaveAdminNote = async (reviewId: string) => {
    if (!isAdmin) return;
    setSavingNote(reviewId);
    try {
      await updateDoc(doc(db, "reviews", reviewId), {
        adminNote: (adminNoteText[reviewId] || "").trim(),
        adminNoteAt: serverTimestamp(),
      });
      setMessage("SaloneReviews note saved.");
      loadReviews();
    } catch {
      setMessage("Failed to save admin note.");
    } finally {
      setSavingNote(null);
    }
  };

  const handleClaimStatus = async (reviewId: string, status: string) => {
    if (!isAdmin) return;
    setSavingStatus(reviewId);
    try {
      await updateDoc(doc(db, "reviews", reviewId), {
        claimStatus: status,
        claimStatusAt: serverTimestamp(),
      });
      setMessage("Status updated.");
      loadReviews();
    } catch {
      setMessage("Failed to update status.");
    } finally {
      setSavingStatus(null);
    }
  };

  const handleProofUpload = async (reviewId: string) => {
    if (!user) return;
    const files = proofFiles[reviewId] || [];
    if (files.length === 0) {
      setMessage("Please choose at least one photo or PDF first.");
      return;
    }

    setUploadingProof(reviewId);
    try {
      const urls = await uploadFiles(reviewId, files);
      await addDoc(collection(db, "reviewProofs"), {
        reviewId,
        businessId: id,
        userId: user.uid,
        note: (proofNote[reviewId] || "").trim(),
        files: urls,
        createdAt: serverTimestamp(),
      });
      setProofFiles((prev) => ({ ...prev, [reviewId]: [] }));
      setProofNote((prev) => ({ ...prev, [reviewId]: "" }));
      setMessage("Proof submitted to admin.");
      loadProofs();
    } catch (error) {
      console.log(error);
      setMessage("Failed to upload proof.");
    } finally {
      setUploadingProof(null);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading business...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-lg font-medium mb-2">Business not found.</p>
            <Link href="/explore" className="text-[#006B3F] font-medium">
              ← Back to Explore
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const photos: string[] = business.photos || [];
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${business.name} ${business.area || ""} Sierra Leone`
  )}`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-4">
            <Link href="/explore" className="text-sm font-medium text-[#006B3F]">
              ← Back to Explore
            </Link>
          </div>

          <div className="bg-white border rounded-2xl p-6 mb-6">
            {user ? (
              <>
                <div className="flex justify-between items-start gap-3 mb-2">
                  <h1 className="text-2xl font-bold">
                    {business.name}
                    {business.isPremium && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                        Premium
                      </span>
                    )}
                  </h1>
                  <span className="text-xs bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap">
                    {business.category}
                  </span>
                </div>
                <p className="text-gray-500 mb-1">{business.area}</p>
                <p className="text-sm text-[#006B3F] font-medium mb-3">{business.district}</p>
              </>
            ) : (
              <div className="mb-3">
                <div className="flex justify-between items-start gap-3 mb-3">
                  <h1 className="text-2xl font-bold text-gray-400">Business name hidden</h1>
                  <span className="text-xs bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap">
                    {business.category}
                  </span>
                </div>
                <div className="bg-[#006B3F]/5 border border-[#006B3F]/20 rounded-xl p-4 mb-3">
                  <p className="text-sm text-gray-800 font-medium mb-2">
                    Log in or register free to access full benefits
                  </p>
                  <p className="text-xs text-gray-600 mb-3">
                    Unlock business name, photos, address, call, WhatsApp, maps and sharing.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/login" className="bg-[#006B3F] text-white text-sm font-semibold px-5 py-2.5 rounded-xl">
                      Log in
                    </Link>
                    <Link href="/signup" className="bg-white border border-[#006B3F] text-[#006B3F] text-sm font-semibold px-5 py-2.5 rounded-xl">
                      Register free
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <p className="text-gray-700 mb-3">{business.description}</p>

{business.hours && (
  <p className="text-sm text-gray-700 mb-4">
    <span className="font-medium">Hours:</span> {business.hours}
  </p>
)}

            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center gap-1">
                <span className="text-amber-400 text-xl">★</span>
                <span className="font-bold text-lg">{averageRating}</span>
              </div>
              <span className="text-gray-500 text-sm">
                ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
              </span>
            </div>

            {user && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <a href={`tel:+${business.phone}`} className="bg-[#006B3F] text-white text-center font-semibold py-3 rounded-xl">📞 Call</a>
                <a href={`https://wa.me/${business.phone}`} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-white text-center font-semibold py-3 rounded-xl">💬 WhatsApp</a>
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white text-center font-semibold py-3 rounded-xl">📍 Maps</a>
                <button
                  type="button"
                  onClick={() => {
                    const text = `Check out ${business.name} on SaloneReviews: ${window.location.href}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                  }}
                  className="bg-gray-800 text-white text-center font-semibold py-3 rounded-xl"
                >
                  📤 Share
                </button>
              </div>
            )}
          </div>

          {user && photos.length > 0 && (
            <div className="bg-white border rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Photos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {photos.map((url, index) => (
                  <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={`Photo ${index + 1}`} className="w-full h-32 object-cover rounded-xl border" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Reviews ({reviews.length})</h2>

            {reviews.length === 0 ? (
              <p className="text-gray-500">No reviews yet.</p>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => {
                  const reviewProofs = proofs.filter((p) => p.reviewId === review.id);
                  const canUploadProof = !!(user && user.uid === review.userId);
                  const canViewProof = !!(isAdmin || (user && user.uid === review.userId));
                  const selectedCount = (proofFiles[review.id] || []).length;
                  const alreadyHasProof = reviewProofs.length > 0;
                  const publicStatus = getPublicStatus(review);
                  const days = getDaysSince(review);
                  const daysLeft = Math.max(RESPONSE_DAYS - days, 0);

                  return (
                    <div key={review.id} className="border-b pb-6 last:border-0">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{review.userName}</span>
                          {publicStatus === "uc" && (
                            <span className="text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                              UC · Unverified Claim
                            </span>
                          )}
                          {publicStatus === "under_review" && (
                            <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                              Under Review
                            </span>
                          )}
                          {publicStatus === "stands" && review.rating <= 2 && (
                            <span className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-semibold">
                              No business response · Review stands
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-amber-400">{"★".repeat(review.rating || 0)}</span>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteReview(review.id)}
                              className="text-xs text-red-600 font-medium"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-gray-700 text-sm mb-3">{review.comment}</p>

                      {review.businessResponse ? (
                        <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-3">
                          <p className="text-xs font-semibold text-[#006B3F] mb-1">Business Response</p>
                          <p className="text-sm text-gray-700">{review.businessResponse}</p>
                        </div>
                      ) : null}

                      {review.adminNote && publicStatus === "under_review" ? (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3">
                          <p className="text-xs font-semibold text-blue-700 mb-1">SaloneReviews Note</p>
                          <p className="text-sm text-gray-700">{review.adminNote}</p>
                        </div>
                      ) : null}

                      {isAdmin && (
                        <div className="bg-gray-50 border rounded-xl p-3 mb-3 space-y-3">
                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-1">14-day policy</p>
                            <p className="text-xs text-gray-600">
                              {review.businessResponse
                                ? "Business has responded."
                                : days >= RESPONSE_DAYS
                                ? "14 days passed with no business response. Review stands."
                                : `${daysLeft} day(s) left for business response.`}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-2">Claim status buttons</p>
                            <div className="flex flex-wrap gap-2">
                              <button type="button" disabled={savingStatus === review.id} onClick={() => handleClaimStatus(review.id, "under_review")} className="text-xs bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full">Under Review</button>
                              <button type="button" disabled={savingStatus === review.id} onClick={() => handleClaimStatus(review.id, "unverified_claim")} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-full">Unverified Claim</button>
                              <button type="button" disabled={savingStatus === review.id} onClick={() => handleClaimStatus(review.id, "resolved")} className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full">Resolved</button>
                              <button type="button" disabled={savingStatus === review.id} onClick={() => handleClaimStatus(review.id, "")} className="text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full">Clear</button>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-2">Business Response (on behalf of owner)</p>
                            <textarea
                              value={responseText[review.id] ?? review.businessResponse ?? ""}
                              onChange={(e) => setResponseText((prev) => ({ ...prev, [review.id]: e.target.value }))}
                              rows={3}
                              className="w-full border rounded-xl px-3 py-2 text-sm outline-none mb-2"
                              placeholder="Official response from the business..."
                            />
                            <button type="button" onClick={() => handleSaveBusinessResponse(review.id)} disabled={savingResponse === review.id} className="bg-[#006B3F] text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-60">
                              {savingResponse === review.id ? "Saving..." : "Save Business Response"}
                            </button>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-blue-700 mb-2">SaloneReviews Note (temporary while under review)</p>
                            <textarea
                              value={adminNoteText[review.id] ?? review.adminNote ?? ""}
                              onChange={(e) => setAdminNoteText((prev) => ({ ...prev, [review.id]: e.target.value }))}
                              rows={2}
                              className="w-full border rounded-xl px-3 py-2 text-sm outline-none mb-2"
                              placeholder="Optional temporary note..."
                            />
                            <button type="button" onClick={() => handleSaveAdminNote(review.id)} disabled={savingNote === review.id} className="bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-60">
                              {savingNote === review.id ? "Saving..." : "Save Note"}
                            </button>
                          </div>
                        </div>
                      )}

                      {canViewProof && alreadyHasProof && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-3">
                          <p className="text-xs font-semibold text-amber-800 mb-2">Private proof (reviewer + admin only)</p>
                          {reviewProofs.map((p) => (
                            <div key={p.id} className="mb-2">
                              {p.note && <p className="text-sm text-gray-700 mb-1">{p.note}</p>}
                              <div className="flex flex-wrap gap-2">
                                {(p.files || []).map((url: string, i: number) => (
                                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#006B3F] font-medium underline">
                                    Open file {i + 1}
                                  </a>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {canUploadProof && !alreadyHasProof && (
                        <div className="bg-gray-50 border rounded-xl p-4">
                          <p className="text-sm font-semibold text-gray-800 mb-1">Send private proof to admin</p>
                          <p className="text-xs text-gray-500 mb-3">
                            Upload invoice, receipt or photo. Only you and admin can see this.
                          </p>

                          <input
                            type="file"
                            accept={FILE_ACCEPT}
                            multiple
                            className="block w-full text-sm text-gray-600 mb-2 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#006B3F] file:text-white file:font-semibold"
                            onChange={(e) =>
                              setProofFiles((prev) => ({
                                ...prev,
                                [review.id]: e.target.files ? Array.from(e.target.files) : [],
                              }))
                            }
                          />
                          <p className="text-xs text-gray-500 mb-3">
                            Allowed: JPG, PNG, WEBP, PDF · {selectedCount} selected
                          </p>

                          <input
                            type="text"
                            value={proofNote[review.id] || ""}
                            onChange={(e) => setProofNote((prev) => ({ ...prev, [review.id]: e.target.value }))}
                            placeholder="Optional note for admin"
                            className="w-full border rounded-xl px-3 py-2 text-sm mb-3 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleProofUpload(review.id)}
                            disabled={uploadingProof === review.id}
                            className="bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-60"
                          >
                            {uploadingProof === review.id ? "Uploading..." : "Submit Proof"}
                          </button>
                        </div>
                      )}

                      {canUploadProof && alreadyHasProof && (
                        <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-sm text-green-800">
                          Proof already submitted to admin.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white border rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Write a Review</h2>

            {user ? (
              hasReviewed ? (
                <div className="bg-gray-50 border rounded-xl p-4 text-sm text-gray-700">
                  You have already reviewed this business. Thank you.
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`text-2xl ${star <= rating ? "text-amber-400" : "text-gray-300"}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Your Review</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      className="w-full border rounded-xl px-4 py-3 outline-none focus:border-[#006B3F]"
                      required
                    />
                  </div>

                  <div className="bg-gray-50 border rounded-xl p-3 space-y-3">
                    <p className="text-sm text-gray-700">
                      Your name will appear as:{" "}
                      <span className="font-semibold">
                        {postAnonymously && canBeAnonymous ? "Anonymous" : getFirstName(user.displayName)}
                      </span>
                    </p>

                    {canBeAnonymous ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={postAnonymously} onChange={(e) => setPostAnonymously(e.target.checked)} className="w-4 h-4 accent-[#006B3F]" />
                        <span className="text-sm text-gray-700">Post as Anonymous</span>
                      </label>
                    ) : (
                      <p className="text-xs text-red-600">Reviews of 1 or 2 stars cannot be anonymous.</p>
                    )}

                    {isLowRating && (
                      <div className="border-t pt-3">
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input type="checkbox" checked={hasProof} onChange={(e) => setHasProof(e.target.checked)} className="mt-1 w-4 h-4 accent-[#006B3F]" />
                          <span className="text-sm text-gray-700">I have proof (invoice / photo / receipt)</span>
                        </label>

                        {hasProof && (
                          <div className="mt-3">
                            <input
                              type="file"
                              accept={FILE_ACCEPT}
                              multiple
                              className="block w-full text-sm text-gray-600 mb-2 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#006B3F] file:text-white file:font-semibold"
                              onChange={(e) => setNewReviewFiles(e.target.files ? Array.from(e.target.files) : [])}
                            />
                            <p className="text-xs text-gray-500">
                              Allowed: JPG, PNG, WEBP, PDF · {newReviewFiles.length} selected
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {message && (
                    <p className={`text-sm ${message.toLowerCase().includes("fail") || message.toLowerCase().includes("please") ? "text-red-500" : "text-green-600"}`}>
                      {message}
                    </p>
                  )}

                  <button type="submit" disabled={loading} className="bg-[#006B3F] text-white font-semibold px-6 py-3 rounded-xl disabled:opacity-60">
                    {loading ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              )
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600 mb-3">Log in or register free to write a review.</p>
                <div className="flex justify-center gap-3">
                  <Link href="/login" className="bg-[#006B3F] text-white font-semibold px-6 py-2 rounded-xl">Log in</Link>
                  <Link href="/signup" className="bg-white border border-[#006B3F] text-[#006B3F] font-semibold px-6 py-2 rounded-xl">Register free</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}