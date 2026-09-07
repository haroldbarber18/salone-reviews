"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const WA = "https://wa.me/23275294553";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-[#006B3F] text-white px-4 py-12 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">List your business</h1>
          <p className="max-w-2xl mx-auto text-white/90">
            Standard listing is free for 1 year and includes 1 photo.
            Pay only if you want extra photos, to appear first, or to add a video.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Link href="/list-business" className="bg-white text-[#006B3F] font-semibold px-6 py-3 rounded-2xl">
              List free
            </Link>
            <a href={WA} target="_blank" rel="noopener noreferrer" className="bg-[#004d2e] border border-white/30 text-white font-semibold px-6 py-3 rounded-2xl">
              WhatsApp us
            </a>
          </div>
        </section>

        <section className="px-4 py-10">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white border rounded-2xl p-6 flex flex-col">
              <p className="text-xs font-semibold text-[#006B3F] mb-2">STANDARD</p>
              <h2 className="text-xl font-bold mb-1">Free listing</h2>
              <p className="text-3xl font-bold mb-1">NLe 0</p>
              <p className="text-sm text-gray-500 mb-4">1 year</p>
              <ul className="text-sm text-gray-700 space-y-2 mb-6 flex-1">
                <li>Business page on SaloneReviews</li>
                <li>1 photo included</li>
                <li>Reviews from customers</li>
                <li>Shown in your district</li>
              </ul>
              <Link href="/list-business" className="text-center bg-[#006B3F] text-white font-semibold py-3 rounded-xl">
                Start free
              </Link>
            </div>

            <div className="bg-white border rounded-2xl p-6 flex flex-col">
              <p className="text-xs font-semibold text-amber-700 mb-2">PHOTOS</p>
              <h2 className="text-xl font-bold mb-1">Extra photos</h2>
              <p className="text-3xl font-bold mb-1">NLe 500</p>
              <p className="text-sm text-gray-500 mb-4">or NLe 1,000</p>
              <ul className="text-sm text-gray-700 space-y-2 mb-6 flex-1">
                <li>NLe 500 = 2 extra photos (3 total)</li>
                <li>NLe 1,000 = 5 extra photos (6 total)</li>
                <li>Photos stay on the listing</li>
                <li>Need the free listing first</li>
              </ul>
              <a href={WA} target="_blank" rel="noopener noreferrer" className="text-center border border-[#006B3F] text-[#006B3F] font-semibold py-3 rounded-xl">
                Send photos
              </a>
            </div>

            <div className="bg-white border-2 border-[#006B3F] rounded-2xl p-6 flex flex-col shadow-sm">
              <p className="text-xs font-semibold text-[#006B3F] mb-2">MOST VISIBLE</p>
              <h2 className="text-xl font-bold mb-1">Featured</h2>
              <p className="text-3xl font-bold mb-1">NLe 500</p>
              <p className="text-sm text-gray-500 mb-4">30 days · NLe 1,200 for 90 days</p>
              <ul className="text-sm text-gray-700 space-y-2 mb-6 flex-1">
                <li>Badge on your listing</li>
                <li>Appear first in your district</li>
                <li>No video included</li>
                <li>Need the free listing first</li>
              </ul>
              <a href={WA} target="_blank" rel="noopener noreferrer" className="text-center bg-[#006B3F] text-white font-semibold py-3 rounded-xl">
                Get Featured
              </a>
            </div>

            <div className="bg-white border rounded-2xl p-6 flex flex-col">
              <p className="text-xs font-semibold text-gray-500 mb-2">ADD-ON</p>
              <h2 className="text-xl font-bold mb-1">Video</h2>
              <p className="text-3xl font-bold mb-1">NLe 500</p>
              <p className="text-sm text-gray-500 mb-4">1 month</p>
              <ul className="text-sm text-gray-700 space-y-2 mb-6 flex-1">
                <li>One short video on your page</li>
                <li>Not shown in the search list</li>
                <li>Can buy with or without Featured</li>
                <li>Need the free listing first</li>
              </ul>
              <a href={WA} target="_blank" rel="noopener noreferrer" className="text-center border border-gray-300 font-semibold py-3 rounded-xl">
                Add video
              </a>
            </div>
          </div>
        </section>

        <section className="px-4 pb-10">
          <div className="max-w-4xl mx-auto bg-white border rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Popular combinations</h2>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="border rounded-xl p-4">
                <p className="font-semibold">Photos + Featured 30 days</p>
                <p className="text-gray-600">From NLe 1,000</p>
              </div>
              <div className="border rounded-xl p-4">
                <p className="font-semibold">Featured 30 days + video</p>
                <p className="text-gray-600">NLe 1,000</p>
              </div>
              <div className="border rounded-xl p-4">
                <p className="font-semibold">Featured 90 days + video 1 month</p>
                <p className="text-gray-600">NLe 1,700</p>
              </div>
              <div className="border rounded-xl p-4">
                <p className="font-semibold">Featured 90 days + video 3 months</p>
                <p className="text-gray-600">NLe 2,700</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-12">
          <div className="max-w-4xl mx-auto bg-[#006B3F] text-white rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold mb-2">How to pay</h2>
            <p className="text-white/90 mb-4">
              Pay by Orange Money, then WhatsApp the screenshot and your business name.
            </p>
            <p className="font-semibold mb-1">Orange Money: 075 294 553</p>
            <p className="mb-6">WhatsApp: +232 75 294 553</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/list-business" className="bg-white text-[#006B3F] font-semibold px-6 py-3 rounded-xl text-center">
                List your business free
              </Link>
              <a href={WA} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-white font-semibold px-6 py-3 rounded-xl text-center">
                Send payment on WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}