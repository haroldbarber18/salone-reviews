"use client";

/**
 * DROP-IN: save as app/materials/page.tsx
 *
 * Creates a 6-digit job code on submit and stores the form in
 * Firestore collection "materials_quotes".
 *
 * Firestore rule needed (if submit fails, add this):
 *   match /materials_quotes/{id} {
 *     allow create: if true;
 *     allow read, update, delete: if request.auth != null;
 *   }
 *
 * Add a link to /materials from Home or the Navbar when you want it public.
 */

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db, storage } from "@/lib/firebase";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

const ITEMS: { name: string; hint: string; chips: string[] }[] = [
  { name: "Cement 50kg", hint: "Type how many bags.", chips: ["Local", "Imported", "RC", "Other brand"] },
  { name: "Sand", hint: "Type how many trips.", chips: ["814", "Semi double", "10 tyre", "Plaster", "Block"] },
  { name: "Stone / chippings", hint: "Type trips. Pick load and size.", chips: ["814", "Semi double", "10 tyre", "3/4 inch", "1/2 inch"] },
  { name: "Iron rod", hint: "Type how many lengths or ton.", chips: ["3/8 inch", "1/2 inch", "5/8 inch"] },
  { name: "Binding wire", hint: "Type rolls.", chips: [] },
  { name: "Timber board", hint: "Type how many pieces.", chips: ["1x12", "2x3", "3x4", "Cotton tree", "Bageh"] },
  { name: "Poles / cotton tree", hint: "Type how many poles.", chips: ["Cotton tree", "Bageh"] },
  { name: "Zinc / roofing sheet", hint: "Type sheets and size.", chips: [] },
  { name: "Block 6 inch", hint: "Type number of blocks.", chips: [] },
  { name: "Block 8 inch", hint: "Type number of blocks.", chips: [] },
  { name: "Tiles", hint: "Type size and m² or boxes.", chips: ["Floor", "Wall", "Kitchen", "Toilet", "Bedroom", "Living room"] },
  { name: "Nails", hint: "Type boxes or kg.", chips: ["Steel", "Wire nails", "3 inch", "4 inch", "Mix"] },
  {
    name: "Plumbing fittings",
    hint: "Type qty and size, or upload the shop paper. Example: 15 pcs 3/4 PPR elbow.",
    chips: ["PPR", "PVC", "GI", "3/4", "1/2", "4 inch", "1 1/2", "Elbow", "Tee", "Pipe", "Nipple", "Socket", "Plug", "Thread tape", "Solvent"],
  },
  {
    name: "Gypsum / ceiling",
    hint: "Type sheets or pieces.",
    chips: ["Gypsum board", "Wall angle", "Ceiling angle", "Floor angle", "Black screw"],
  },
  { name: "Emulsion paint", hint: "Type gallons.", chips: [] },
];

async function makeCode(): Promise<string> {
  for (let i = 0; i < 15; i++) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const snap = await getDocs(
      query(collection(db, "materials_quotes"), where("code", "==", code), limit(1))
    );
    if (snap.empty) return code;
  }
  throw new Error("Could not create a free code. Try again.");
}

export default function MaterialsPage() {
  const [zone, setZone] = useState<"Western Area Urban" | "Western Area Rural" | "">(
    ""
  );
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [livesIn, setLivesIn] = useState("UK");
  const [email, setEmail] = useState("");
  const [area, setArea] = useState("");
  const [stage, setStage] = useState("foundation");
  const [intent, setIntent] = useState<"watch" | "compare" | "buy">("watch");
  const [planStart, setPlanStart] = useState("watching");
  const [caretakerName, setCaretakerName] = useState("");
  const [caretakerWa, setCaretakerWa] = useState("");
  const [supervisorName, setSupervisorName] = useState("");
  const [supervisorWa, setSupervisorWa] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [contractorWa, setContractorWa] = useState("");
  const [notes, setNotes] = useState("");
  const [wantItems, setWantItems] = useState<
    Record<string, { chips: string[]; qty: string }>
  >({});
  const [file, setFile] = useState<File | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [doneCode, setDoneCode] = useState("");

  function toggleItem(name: string) {
    setWantItems((prev) => {
      if (prev[name]) {
        const next = { ...prev };
        delete next[name];
        return next;
      }
      return { ...prev, [name]: { chips: [], qty: "" } };
    });
  }

  function toggleChip(name: string, chip: string) {
    setWantItems((prev) => {
      if (!prev[name]) return prev;
      const has = prev[name].chips.includes(chip);
      return {
        ...prev,
        [name]: {
          ...prev[name],
          chips: has ? prev[name].chips.filter((c) => c !== chip) : [...prev[name].chips, chip],
        },
      };
    });
  }

  function setItemQty(name: string, qty: string) {
    setWantItems((prev) =>
      prev[name] ? { ...prev, [name]: { ...prev[name], qty } } : prev
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!zone) return setErr("Pick the zone of the house first.");
    if (!fullName.trim() || !whatsapp.trim()) return setErr("Name and WhatsApp are required.");
    if (!area.trim()) return setErr("Write the site area / landmark.");
    if (!accepted) return setErr("Tick that you accept the buyer terms.");
    if (intent === "buy" && (!caretakerName.trim() || !caretakerWa.trim())) {
      return setErr("Buying needs the caretaker name and WhatsApp.");
    }
    setBusy(true);
    try {
      const code = await makeCode();
      let proformaUrl = "";
      if (file) {
        const fileRef = ref(storage, `materials_quotes/${code}-${file.name}`);
        await uploadBytes(fileRef, file);
        proformaUrl = await getDownloadURL(fileRef);
      }
      await addDoc(collection(db, "materials_quotes"), {
        code,
        zone,
        fullName: fullName.trim(),
        whatsapp: whatsapp.trim(),
        livesIn,
        email: email.trim(),
        area: area.trim(),
        stage,
        intent,
        planStart,
        caretakerName: caretakerName.trim(),
        caretakerWhatsapp: caretakerWa.trim(),
        supervisorName: supervisorName.trim(),
        supervisorWhatsapp: supervisorWa.trim(),
        contractorName: contractorName.trim(),
        contractorWhatsapp: contractorWa.trim(),
        items: Object.entries(wantItems).map(([name, v]) => ({
          name,
          chips: v.chips,
          qty: v.qty.trim(),
        })),
        notes: notes.trim(),
        proformaUrl,
        acceptedBuyerTerms: true,
        status: intent === "buy" ? "new_buy" : intent === "compare" ? "compare" : "watch",
        createdAt: serverTimestamp(),
      });
      setDoneCode(code);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not send. Try again.";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F8F5] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <p className="text-sm text-[#006B3F] font-medium mb-1">Diaspora building in Sierra Leone</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Building materials</h1>
        <p className="text-gray-600 mb-6">
          Pick the zone of the house, send the form, get a 6-digit job code. Payment stays in
          Freetown. Shop numbers are not shown here. Prices on the board start when shops return
          the 14-day sheet.
        </p>

        {doneCode ? (
          <div className="rounded-2xl border bg-white p-6 text-center">
            <p className="text-sm text-gray-500">Your job code</p>
            <p className="text-4xl font-bold tracking-widest text-[#006B3F] my-3">
              SR-{doneCode}
            </p>
            <p className="text-gray-700">
              Save this number. Use it on the Freetown payment and with your caretaker. Harold
              will WhatsApp you on the number you sent.
            </p>
            <button
              type="button"
              className="mt-6 px-4 py-2 rounded-xl border bg-white"
              onClick={() => {
                setDoneCode("");
                setWantItems({});
                setFile(null);
                setAccepted(false);
              }}
            >
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <section className="rounded-2xl border bg-white p-5">
              <h2 className="font-semibold mb-3">1. Zone of the house</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(
                  [
                    ["Western Area Urban", "Freetown"],
                    ["Western Area Rural", "Waterloo, Peninsula, York…"],
                  ] as const
                ).map(([z, hint]) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setZone(z)}
                    className={`text-left rounded-xl border p-4 ${
                      zone === z ? "border-[#006B3F] bg-[#E8F5E9]" : "bg-white"
                    }`}
                  >
                    <div className="font-medium">{z}</div>
                    <div className="text-sm text-gray-500">{hint}</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border bg-white p-5">
              <h2 className="font-semibold mb-2">2. Items (optional tick)</h2>
              <p className="text-sm text-gray-500 mb-3">
                Tick the item, tap the kind if you know it, then type quantity. Or skip this and
                upload the contractor list below.
              </p>
              <div className="space-y-2">
                {ITEMS.map((item) => {
                  const picked = wantItems[item.name];
                  return (
                    <div key={item.name} className="rounded-xl border px-3 py-2">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={!!picked}
                          onChange={() => toggleItem(item.name)}
                        />
                        {item.name}
                      </label>
                      {picked && (
                        <div className="mt-2 pl-6 space-y-2">
                          {item.chips.length > 0 && (
                            <div className="flex flex-wrap gap-2 text-sm">
                              {item.chips.map((chip) => (
                                <button
                                  key={chip}
                                  type="button"
                                  onClick={() => toggleChip(item.name, chip)}
                                  className={`px-3 py-1 rounded-full border ${
                                    picked.chips.includes(chip)
                                      ? "bg-[#006B3F] text-white border-[#006B3F]"
                                      : "bg-white"
                                  }`}
                                >
                                  {chip}
                                </button>
                              ))}
                            </div>
                          )}
                          <input
                            className="border rounded-lg px-3 py-2 w-full text-sm"
                            placeholder={item.hint}
                            value={picked.qty}
                            onChange={(e) => setItemQty(item.name, e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border bg-white p-5 space-y-3">
              <h2 className="font-semibold">3. You and the site</h2>
              <input className="w-full border rounded-xl px-3 py-2" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <input className="w-full border rounded-xl px-3 py-2" placeholder="WhatsApp with country code" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select className="border rounded-xl px-3 py-2" value={livesIn} onChange={(e) => setLivesIn(e.target.value)}>
                  {["UK", "US", "EU", "Sierra Leone", "Other"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
                <input className="w-full border rounded-xl px-3 py-2" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <input className="w-full border rounded-xl px-3 py-2" placeholder="Site area / landmark" value={area} onChange={(e) => setArea(e.target.value)} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select className="border rounded-xl px-3 py-2" value={stage} onChange={(e) => setStage(e.target.value)}>
                  {["land only", "foundation", "lintel", "roof", "finishing"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
                <select className="border rounded-xl px-3 py-2" value={planStart} onChange={(e) => setPlanStart(e.target.value)}>
                  {["this month", "1–3 months", "watching"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Intent</p>
                <div className="flex flex-wrap gap-3 text-sm">
                  {(
                    [
                      ["watch", "Watch (NLe 200/mo)"],
                      ["compare", "Compare a list"],
                      ["buy", "Buy this month"],
                    ] as const
                  ).map(([v, label]) => (
                    <label key={v} className="flex items-center gap-1">
                      <input type="radio" name="intent" checked={intent === v} onChange={() => setIntent(v)} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border bg-white p-5 space-y-3">
              <h2 className="font-semibold">4. People on the ground</h2>
              <input className="w-full border rounded-xl px-3 py-2" placeholder="Caretaker name (needed to buy)" value={caretakerName} onChange={(e) => setCaretakerName(e.target.value)} />
              <input className="w-full border rounded-xl px-3 py-2" placeholder="Caretaker WhatsApp" value={caretakerWa} onChange={(e) => setCaretakerWa(e.target.value)} />
              <input className="w-full border rounded-xl px-3 py-2" placeholder="Supervisor name (optional)" value={supervisorName} onChange={(e) => setSupervisorName(e.target.value)} />
              <input className="w-full border rounded-xl px-3 py-2" placeholder="Supervisor WhatsApp (optional)" value={supervisorWa} onChange={(e) => setSupervisorWa(e.target.value)} />
              <input className="w-full border rounded-xl px-3 py-2" placeholder="Contractor name / firm (optional)" value={contractorName} onChange={(e) => setContractorName(e.target.value)} />
              <input className="w-full border rounded-xl px-3 py-2" placeholder="Contractor WhatsApp (optional)" value={contractorWa} onChange={(e) => setContractorWa(e.target.value)} />
            </section>

            <section className="rounded-2xl border bg-white p-5 space-y-3">
              <h2 className="font-semibold">5. Contractor list (optional)</h2>
              <input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <textarea className="w-full border rounded-xl px-3 py-2" rows={3} placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
                <span>
                  I accept the buyer terms: Freetown payment, job code, caretaker signs the delivery
                  note, SaloneReviews is the introducer not the manufacturer.
                </span>
              </label>
            </section>

            {err && <p className="text-red-600 text-sm">{err}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-xl bg-[#006B3F] text-white font-medium disabled:opacity-50"
            >
              {busy ? "Saving…" : "Send and get my 6-digit code"}
            </button>
            <p className="text-center text-sm text-gray-500">
              <Link href="/explore" className="underline">
                Back to Explore
              </Link>
            </p>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}