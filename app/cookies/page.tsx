import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <Link href="/" className="text-sm text-[#006B3F] font-medium">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold mt-4 mb-4">Manage Cookies</h1>
          <div className="bg-white border rounded-2xl p-6 space-y-4 text-sm text-gray-700 leading-relaxed">
            <p>
              SaloneReviews may use essential cookies and similar technologies to keep the site
              working, maintain login sessions and improve performance.
            </p>
            <p>
              These tools help with security, basic analytics and user experience.
            </p>
            <p>
              You can control cookies through your browser settings. Blocking some cookies may
              affect how parts of the site work.
            </p>
            <p>
              For questions, contact info@salonereviews.com.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}