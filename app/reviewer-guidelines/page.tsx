import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ReviewerGuidelinesPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <Link href="/" className="text-sm text-[#006B3F] font-medium">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold mt-4 mb-4">Reviewer Guidelines</h1>
          <div className="bg-white border rounded-2xl p-6 space-y-4 text-sm text-gray-700 leading-relaxed">
            <p>
              Reviews should be based on real experience with the business or service.
            </p>
            <p>
              Be honest, clear and respectful. Do not post fake reviews, personal attacks,
              threats or content meant only to harm a business unfairly.
            </p>
            <p>
              Low-star reviews may require proof such as invoices, receipts or photos.
              Anonymous posting is not allowed for 1-star and 2-star reviews.
            </p>
            <p>
              SaloneReviews may review, mark, or remove content that breaches these guidelines.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}