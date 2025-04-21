"use client";

import { useTheme } from "./ThemeProvider";
import { useEffect, useState } from "react";

export default function ThemeBackground() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {theme === "light" ? (
        <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-blue-300 to-blue-100 transition-colors duration-700"></div>
      ) : (
        <div className="absolute inset-0 bg-black transition-colors duration-700"></div>
      )}
    </div>
  );
}
