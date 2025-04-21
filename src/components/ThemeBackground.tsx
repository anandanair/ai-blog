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

  // --- Configuration ---
  const lightParticleCount = 100; // Can adjust count
  const darkStarCount = 100;
  // ---------------------

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {theme === "light" ? (
        // --- Light Theme Background: Rising Dark Specks ---
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-500/50 transition-colors duration-700">
          <div className="particles-container">
            {[...Array(lightParticleCount)].map((_, i) => {
              const size = Math.random() * 3 + 1; // Small size: 0.5px to 2px
              const animationDuration = Math.random() * 10 + 10; // Slow, random speed: 15s to 40s
              const delay = Math.random() * 10; // Random start delay
              const leftPosition = Math.random() * 100;
              // Subtle horizontal drift (optional, can be removed if pure vertical is desired)
              const horizontalDrift = (Math.random() - 0.5) * 10; // Max +/- 5% horizontal movement
              // ------------------------------------

              return (
                <div
                  key={`speck-${i}`}
                  className="rising-speck" // New class name
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    left: `${leftPosition}%`,
                    animationDuration: `${animationDuration}s`,
                    animationDelay: `${delay}s`,
                    ["--horizontal-drift" as string]: `${horizontalDrift}%`,
                  }}
                />
              );
            })}
          </div>
        </div>
      ) : (
        // --- Dark Theme Background: Falling Stars ---
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black transition-colors duration-700">
          <div className="stars-container">
            {[...Array(darkStarCount)].map((_, i) => {
              const size = Math.random() * 2 + 1; // 1px to 3px
              const animationDuration = Math.random() * 10 + 10; // 10s to 20s
              const delay = Math.random() * 10;
              const leftPosition = Math.random() * 100;

              return (
                <div
                  key={`star-${i}`}
                  className="falling-star"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    left: `${leftPosition}%`,
                    animationDuration: `${animationDuration}s`,
                    animationDelay: `${delay}s`,
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        /* --- Shared Container Style --- */
        .stars-container,
        .particles-container {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        /* --- Dark Theme: Falling Stars --- */
        .falling-star {
          position: absolute;
          background-color: white;
          border-radius: 50%;
          opacity: 0; /* Start invisible */
          top: -10px; /* Start above view */
          animation: fall linear infinite;
          box-shadow: 0 0 3px rgba(255, 255, 255, 0.5);
        }

        @keyframes fall {
          0% {
            transform: translateY(-10px) scale(0.8);
            opacity: 0;
          }
          10% {
            opacity: 0.9;
          }
          90% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(100vh) scale(0.2); /* End below view */
            opacity: 0;
          }
        }

        /* --- Light Theme: Rising Dark Specks --- */
        .rising-speck {
          position: absolute;
          /* Dark gray color, somewhat transparent */
          background-color: rgb(0, 81, 16); /* ~gray-600 with alpha */
          border-radius: 50%;
          opacity: 0; /* Start invisible */
          bottom: -10px; /* Start below view */
          animation: rise linear infinite;
          /* Removed blur and complex properties */
        }

        @keyframes rise {
          0% {
            transform: translateY(10px) translateX(0%) scale(1); /* Start below view */
            opacity: 0;
          }
          15% {
            /* Fade in relatively quickly */
            opacity: 0.7; /* Max opacity */
          }
          85% {
            /* Start fading out */
            opacity: 0.5;
          }
          100% {
            /* Move up past the top, apply horizontal drift, maybe shrink a bit */
            transform: translateY(-100vh) translateX(var(--horizontal-drift))
              scale(0.8); /* End above view */
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
