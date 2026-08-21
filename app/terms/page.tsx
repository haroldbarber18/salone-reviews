import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <Link href="/" className="text-sm text-[#006B3F] font-medium">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold mt-4 mb-4">Terms of Use</h1>
          <div className="bg-white border rounded-2xl p-6 space-y-4 text-sm text-gray-700 leading-relaxed">
            <p>
              By using SaloneReviews, you agree to use the platform lawfully and honestly.
              You must not post false, abusive, defamatory or misleading content.
            </p>
            <p>
              Business listings, reviews, ads and service information are provided for general
              public information. SaloneReviews does not guarantee the performance of any
              business or service listed on the platform.
            </p>
            <p>
              We may remove content, suspend accounts or refuse listings that breach these terms
              or harm users, businesses or the integrity of the platform.
            </p>
            <p>
              These terms are governed by the laws of Sierra Leone.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}