import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <Link href="/" className="text-sm text-[#006B3F] font-medium">← Back to Home</Link>
          <h1 className="text-3xl font-bold mt-4 mb-4">How SaloneReviews works</h1>
          <div className="bg-white border rounded-2xl p-6 space-y-4 text-sm text-gray-700 leading-relaxed">
            <p><strong>1. Discover</strong> — Browse categories, districts, essential services, events and business listings.</p>
            <p><strong>2. Register free</strong> — Create an account to unlock business names, contact details and full benefits.</p>
            <p><strong>3. Contact</strong> — Call or WhatsApp businesses directly from their profile.</p>
            <p><strong>4. Review</strong> — Share your experience to help other Sierra Leoneans choose with confidence.</p>
            <p><strong>5. Grow</strong> — Businesses can list free, then upgrade for photos, flyers, events and more visibility.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}