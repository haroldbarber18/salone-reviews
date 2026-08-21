"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <Link href="/" className="text-sm text-[#006B3F] font-medium">
            ← Back to Home
          </Link>

          <h1 className="text-3xl font-bold mt-4 mb-2">Contact SaloneReviews</h1>
          <p className="text-gray-600 mb-8">
            For business listings, support, advertising, or general questions.
          </p>

          <div className="bg-white border rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="font-semibold mb-1">Email</h2>
              <a
                href="mailto:info@salonereviews.com"
                className="text-[#006B3F] font-medium"
              >
                info@salonereviews.com
              </a>
            </div>

            <div>
              <h2 className="font-semibold mb-1">WhatsApp</h2>
              <p className="text-sm text-gray-600 mb-3">
                Fastest way to list a business or ask a question.
              </p>
              <a
                href="https://wa.me/23275294553"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#25D366] text-white font-semibold px-5 py-3 rounded-xl"
              >
                Message us on WhatsApp
              </a>
              <p className="text-xs text-gray-500 mt-2">
                Replace the number in the code with your real WhatsApp number.
              </p>
            </div>

            <div>
              <h2 className="font-semibold mb-1">Business listings</h2>
              <p className="text-sm text-gray-600 mb-3">
                Basic listings are free. Photos, flyers, events and premium visibility are paid.
              </p>
              <Link
                href="/list-business"
                className="inline-block bg-[#006B3F] text-white font-semibold px-5 py-3 rounded-xl"
              >
                List your business
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}