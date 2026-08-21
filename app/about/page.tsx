import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <Link href="/" className="text-sm text-[#006B3F] font-medium">← Back to Home</Link>
          <h1 className="text-3xl font-bold mt-4 mb-4">About us</h1>
          <div className="bg-white border rounded-2xl p-6 space-y-4 text-sm text-gray-700 leading-relaxed">
            <p>
              SaloneReviews is building a trusted platform for businesses and services across Sierra Leone.
              Our goal is simple: help people find reliable local services through real customer reviews.
            </p>
            <p>
              From tradesmen and auto services to food, beauty, hotels and professional services,
              we make it easier to discover, contact and review businesses with confidence.
            </p>
            <p>
              SaloneReviews is a trading name of FABSL (SL) Limited, with registered address at
              131 Circular Road, Freetown, Sierra Leone.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}