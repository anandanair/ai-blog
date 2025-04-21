"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);

  // Handle scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      const isVisible =
        prevScrollPos > currentScrollPos || currentScrollPos < 10;

      setPrevScrollPos(currentScrollPos);
      setVisible(isVisible);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [prevScrollPos]);

  return (
    <div
      className="fixed w-full flex justify-center z-50 transition-transform duration-300"
      style={{ transform: visible ? "translateY(0)" : "translateY(-100%)" }}
    >
      <nav className="mt-4 w-11/12 max-w-6xl mx-auto rounded-full bg-white/30 dark:bg-gray-900/30 backdrop-blur-lg shadow-lg relative overflow-hidden border border-white/20 dark:border-gray-700/30">
        {/* Enhanced glassmorphic effect with inner shadow */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent dark:from-white/5"></div>

        {/* Metallic shine effect - slowed down and visible in both modes */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300/70 dark:via-white/20 to-transparent shine-effect-slow"></div>

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link
                  href="/"
                  className="text-xl font-bold text-gray-900 dark:text-white"
                >
                  AutoTek
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/"
                  className="border-transparent text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Home
                </Link>
                <Link
                  href="/blog"
                  className="border-transparent text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Blog
                </Link>
                <Link
                  href="/news"
                  className="border-transparent text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Latest News
                </Link>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <ThemeToggle />
            </div>
            <div className="-mr-2 flex items-center sm:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:bg-white/20 dark:hover:bg-gray-700/30 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1 px-4 backdrop-blur-lg bg-white/30 dark:bg-gray-900/30 rounded-b-3xl border-t border-white/20 dark:border-gray-700/30">
              <Link
                href="/"
                className="text-gray-700 dark:text-gray-200 hover:bg-white/20 dark:hover:bg-gray-700/30 block px-3 py-2 rounded-md text-base font-medium"
              >
                Home
              </Link>
              <Link
                href="/blog"
                className="text-gray-700 dark:text-gray-200 hover:bg-white/20 dark:hover:bg-gray-700/30 block px-3 py-2 rounded-md text-base font-medium"
              >
                Blog
              </Link>
              <Link
                href="/news"
                className="text-gray-700 dark:text-gray-200 hover:bg-white/20 dark:hover:bg-gray-700/30 block px-3 py-2 rounded-md text-base font-medium"
              >
                Latest News
              </Link>
              <div className="px-3 py-2">
                <ThemeToggle />
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
