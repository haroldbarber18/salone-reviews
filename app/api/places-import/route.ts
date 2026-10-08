import { NextRequest, NextResponse } from "next/server";

const DISTRICT_PLACE: Record<string, string> = {
  "Western Area Urban": "Freetown",
  "Western Area Rural": "Waterloo",
  Bo: "Bo",
  Kenema: "Kenema",
  Bombali: "Makeni",
  "Port Loko": "Port Loko",
  Kono: "Koidu",
  Kailahun: "Kailahun",
  Tonkolili: "Magburaka",
  Kambia: "Kambia",
  Moyamba: "Moyamba",
  Bonthe: "Bonthe",
  Pujehun: "Pujehun",
  Karene: "Kamakwie",
  Falaba: "Falaba",
  Koinadugu: "Kabala",
};

export async function POST(req: NextRequest) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Add GOOGLE_PLACES_API_KEY in Vercel, then redeploy." }, { status: 500 });
  }
  const body = await req.json();
  const kind = body.kind === "restaurant" ? "restaurant" : "hotel";
  const district = String(body.district || "Western Area Urban");
  const town = DISTRICT_PLACE[district] || district;
  const textQuery = kind === "restaurant"
    ? `restaurants in ${town}, Sierra Leone`
    : `hotels in ${town}, Sierra Leone`;
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.googleMapsUri,places.photos",
    },
    body: JSON.stringify({
      textQuery,
      includedType: kind === "restaurant" ? "restaurant" : "lodging",
      pageSize: 20,
      languageCode: "en",
      regionCode: "SL",
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: data?.error?.message || "Google search failed." }, { status: 502 });
  }
  const places = (data.places || []).map((p: any) => ({
    placeId: p.id,
    name: p.displayName?.text || "",
    address: p.formattedAddress || "",
    phone: p.internationalPhoneNumber || p.nationalPhoneNumber || "",
    maps: p.googleMapsUri || "",
    photoName: p.photos?.[0]?.name || "",
  }));
  return NextResponse.json({ places, district, kind });
}