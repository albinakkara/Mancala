import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[#ebebeb] bg-white py-10 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand & Domain info */}
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-black text-white font-mono-code font-bold text-[10px]">
                OM
              </span>
              <span className="font-semibold text-sm text-[#171717]">Online Mancala</span>
              <span className="rounded-full bg-[#f5f5f5] px-2 py-0.5 font-mono-code text-[10px] text-[#666]">
                onlinemancala.com
              </span>
            </div>
            <p className="text-xs text-[#888888]">
              Play Kalah, Avalanche Mancala, and Oware / Awale online.
            </p>
          </div>

          {/* Nav Links */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-[#666]">
            <a href="/about-us" className="hover:text-black transition">
              About Us
            </a>
            <a href="/contact-us" className="hover:text-black transition">
              Contact Us
            </a>
            <a href="/privacy-policy" className="hover:text-black transition">
              Privacy Policy
            </a>
            <a href="/terms-and-conditions" className="hover:text-black transition">
              Terms &amp; Conditions
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#ebebeb] flex flex-col sm:flex-row items-center justify-between text-xs text-[#888888]">
          <p>© {new Date().getFullYear()} onlinemancala.com — All Rights Reserved.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            Crafted for Mancala enthusiasts around the globe.
          </p>
        </div>
      </div>
    </footer>
  );
};
