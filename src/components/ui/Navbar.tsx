"use client";
import Image from "next/image";
import Link from "next/link";
export function Navbar() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: "rgba(10,37,64,0.97)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 1px 24px rgba(0,0,0,0.18)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center shrink-0 group no-underline gap-2.5 cursor-pointer relative z-10"
        >
          <div className="h-10 w-10 rounded-lg overflow-hidden transition-all duration-200 group-hover:scale-110">
            <Image
              src="/baazar-logo.svg"
              alt="Baazar Kolkata"
              width={40}
              height={40}
              className="w-full h-full object-cover"
              priority
            />
          </div>
        </Link>
        <div className="flex-1 text-center">
          <span className="text-white/90 font-semibold text-sm sm:text-[0.9rem] tracking-wide">
            Registration Form
          </span>
        </div>

        <div className="w-10 sm:w-[7.5rem] shrink-0" aria-hidden />
      </div>
    </header>
  );
}

export default Navbar;
