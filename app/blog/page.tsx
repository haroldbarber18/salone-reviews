import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <Link href="/" className="text-sm text-[#006B3F] font-medium">← Back to Home</Link>
          <h1 className="text-3xl font-bold mt-4 mb-4">Blog</h1>
          <div className="bg-white border rounded-2xl p-6 space-y-4 text-sm text-gray-700 leading-relaxed">
            <p>
              The SaloneReviews blog will share updates, local business tips, trust and safety guidance,
              and stories from across Sierra Leone.
            </p>
            <p>
              Articles will be added soon.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}