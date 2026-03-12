"use client";

import Image from "next/image";

export default function TopBanner() {
  return (
    <header className="sticky top-0 z-50 w-full h-16 bg-[#0b0f1a] border-b border-[#1b2233]">
      <div className="flex items-center justify-between h-full px-6">

        {/* Logo */}
        <div className="flex items-center">
          <Image
            src="/visionirlonglogo.png"
            alt="Visionir"
            width={140}
            height={34}
            priority
            className="object-contain"
          />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">

          <button className="text-sm text-gray-300 border border-[#2a3147] px-4 py-1.5 rounded-lg hover:bg-[#161b28] hover:text-white transition">
            Help
          </button>

          <div className="w-9 h-9 flex items-center justify-center rounded-full bg-[#1c2335] text-white text-sm font-medium">
            V
          </div>

        </div>

      </div>
    </header>
  );
}