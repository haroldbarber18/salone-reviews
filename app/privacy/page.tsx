import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <Link href="/" className="text-sm text-[#006B3F] font-medium">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold mt-4 mb-4">Privacy Policy</h1>
          <div className="bg-white border rounded-2xl p-6 space-y-4 text-sm text-gray-700 leading-relaxed">
            <p>
              SaloneReviews collects information needed to operate the platform, including account
              details, business listing requests, reviews and contact messages.
            </p>
            <p>
              We use this information to provide listings, reviews, customer support, security and
              service improvement. We do not sell personal data.
            </p>
            <p>
              Contact details submitted by users or businesses may be used to respond to requests,
              verify listings and manage the platform.
            </p>
            <p>
              For privacy questions, contact info@salonereviews.com or WhatsApp +232 75 294 553.
            </p>
            <h2 className="text-base font-semibold text-gray-900 pt-2">Delete your account</h2>
            <p>
              Email info@salonereviews.com with the subject Delete my SaloneReviews account and the
              email you used to sign up. We delete the login, name, phone and photos you uploaded.
              A review you already posted may stay, with your name removed, because it is part of
              the business record. We do this within 30 days.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}