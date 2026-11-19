"use client";
import { usePathname, useRouter } from "next/navigation";

// Slim back bar for every page except Home.
// "Back" goes one step back each tap, until you reach Home.
// If there is nothing to go back to (link opened directly), it goes Home.
export default function BackBar() {
  const pathname = usePathname();
  const router = useRouter();
  if (!pathname || pathname === "/") return null;

  const goBack = () => {
    const cameFromSite =
      typeof document !== "undefined" &&
      document.referrer &&
      new URL(document.referrer).host === window.location.host;
    if (window.history.length > 1 && (cameFromSite || window.history.state)) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-[#1B5FBF] text-white">
      <div className="max-w-7xl mx-auto px-3 h-11 flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1 text-[15px] font-semibold py-2 pr-3"
          aria-label="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-1.5 text-sm font-semibold py-2 pl-3"
          aria-label="Go to home page"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" fill="currentColor" />
          </svg>
          Home
        </button>
      </div>
    </div>
  );
}
