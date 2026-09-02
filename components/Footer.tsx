import Link from "next/link";

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition shrink-0"
    >
      {children}
    </a>
  );
}

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-6">
          <div>
            <Link href="/" className="inline-block">
              <h3 className="text-white font-bold text-lg mb-3 hover:text-white">
                SaloneReviews
              </h3>
            </Link>
            <Link
              href="/"
              className="block text-sm leading-relaxed hover:text-white"
            >
              Real reviews for businesses and services across Sierra Leone.
              Find trusted tradesmen, food, auto, beauty and more.
            </Link>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Quick links</h3>
            <div className="space-y-2 text-sm">
              <div>
                <Link href="/explore" className="hover:text-white">
                  Explore businesses
                </Link>
              </div>
              <div>
                             <div>
                <Link href="/list-business" className="hover:text-white">
                  List your business
                </Link>
              </div>
              <div>
                <Link href="/claim" className="hover:text-white">
                  Claim your business
                </Link>
              </div>
              <div>
                <Link href="/contact" className="hover:text-white">
                  Contact
                </Link>
              </div>
                <Link href="/services/government" className="hover:text-white">
                  Essential services
                </Link>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">About</h3>
            <div className="space-y-2 text-sm">
              <div>
                <Link href="/about" className="hover:text-white">
                  About us
                </Link>
              </div>
              <div>
                <Link href="/how-it-works" className="hover:text-white">
                  How SaloneReviews works
                </Link>
              </div>
              <div>
                <Link href="/blog" className="hover:text-white">
                  Blog
                </Link>
              </div>
              <div>
                <Link href="/press" className="hover:text-white">
                  Press
                </Link>
              </div>
              <div>
                <Link href="/investors" className="hover:text-white">
                  Investor relations
                </Link>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Contact</h3>
            <div className="space-y-2 text-sm">
              <p>
                Email:{" "}
                <a
                  href="mailto:info@salonereviews.com"
                  className="hover:text-white"
                >
                  info@salonereviews.com
                </a>
              </p>
              <p>
                WhatsApp:{" "}
                <a
                  href="https://wa.me/23275294553"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  +232 75 294 553
                </a>
              </p>
              <p>131 Circular Road, Freetown, Sierra Leone</p>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Legal</h3>
            <div className="space-y-2 text-sm">
              <div>
                <Link href="/terms" className="hover:text-white">
                  Terms of use
                </Link>
              </div>
              <div>
                <Link href="/privacy" className="hover:text-white">
                  Privacy policy
                </Link>
              </div>
              <div>
                <Link href="/reviewer-guidelines" className="hover:text-white">
                  Reviewer guidelines
                </Link>
              </div>
              <div>
                <Link href="/cookies" className="hover:text-white">
                  Manage cookies
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-row items-center gap-2 flex-nowrap overflow-x-auto pb-6">
          <span className="text-sm text-gray-400 whitespace-nowrap">
            Follow us on
          </span>

          <SocialIcon href="https://facebook.com/salonereviews" label="Facebook">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M14 8h3V5h-3c-2.2 0-4 1.8-4 4v2H7v3h3v7h3v-7h3l1-3h-4V9c0-.6.4-1 1-1z" />
            </svg>
          </SocialIcon>

          <SocialIcon href="https://x.com/salonereviews" label="X">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
              <path d="M18.9 2H22l-6.8 7.8L23 22h-6.5l-5.1-6.6L5.7 22H2.6l7.3-8.3L1 2h6.7l4.6 6.1L18.9 2zm-1.1 18h1.8L7.3 4H5.4l12.4 16z" />
            </svg>
          </SocialIcon>

          <SocialIcon href="https://instagram.com/salonereviews" label="Instagram">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5zM17.8 6.2a1.2 1.2 0 1 1-1.2 1.2 1.2 1.2 0 0 1 1.2-1.2z" />
            </svg>
          </SocialIcon>

          <SocialIcon href="https://linkedin.com/company/salonereviews" label="LinkedIn">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M6.9 8.5H3.8V21h3.1V8.5zM5.3 3A1.8 1.8 0 1 0 5.3 6.6 1.8 1.8 0 0 0 5.3 3zM21 21h-3.1v-6.6c0-1.6 0-3.6-2.2-3.6s-2.5 1.7-2.5 3.5V21H10V8.5h3v1.7h.1c.4-.8 1.5-2.2 3.8-2.2 4.1 0 4.8 2.7 4.8 6.2V21z" />
            </svg>
          </SocialIcon>

          <SocialIcon href="https://youtube.com/salonereviews" label="YouTube">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M23 7.5a4 4 0 0 0-2.8-2.8C18.4 4.2 12 4.2 12 4.2s-6.4 0-8.2.5A4 4 0 0 0 1 7.5 41.6 41.6 0 0 0 1 12a41.6 41.6 0 0 0 .8 4.5 4 4 0 0 0 2.8 2.8c1.8.5 8.2.5 8.2.5s6.4 0 8.2-.5a4 4 0 0 0 2.8-2.8A41.6 41.6 0 0 0 23 12a41.6 41.6 0 0 0 0-4.5zM9.8 15.5v-7l6.2 3.5-6.2 3.5z" />
            </svg>
          </SocialIcon>
        </div>

        <div className="border-t border-gray-700 pt-6 text-xs text-gray-400 space-y-2">
          <p>
            SaloneReviews (SL) Limited is registered as a limited company under the laws of Sierra Leone.
            SaloneReviews is a trading name of FABSL (SL) Limited. Registered address: 131 Circular Road, Freetown, Sierra Leone.
          </p>
          <p className="pt-1">
            © {new Date().getFullYear()} FABSL (SL) Limited. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}