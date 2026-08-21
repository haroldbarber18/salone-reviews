import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PressPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <Link href="/" className="text-sm text-[#006B3F] font-medium">← Back to Home</Link>
          <h1 className="text-3xl font-bold mt-4 mb-4">Press</h1>
          <div className="bg-white border rounded-2xl p-6 space-y-4 text-sm text-gray-700 leading-relaxed">
            <p>
              For media enquiries, interviews and press information about SaloneReviews,
              contact info@salonereviews.com or WhatsApp +232 75 294 553.
            </p>
            <p>
              Press resources and announcements will be published here as the platform grows.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}