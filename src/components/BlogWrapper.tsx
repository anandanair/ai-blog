"use client";

import { useEffect, useState, useRef } from "react"; // Added useRef
import { gsap } from "gsap";
import LoadingAnimation from "./LoadingAnimation";
import BlogClient from "./BlogClient";
import { BlogClientProps } from "@/types";

export default function BlogWrapper({
  posts,
  featuredPosts,
  popularPosts,
  trendingPosts,
  categories,
}: BlogClientProps) {
  // Initialize loading to false if all props are already provided.
  // This avoids showing LoadingAnimation on subsequent navigations if data is cached by Next.js.
  const [loading, setLoading] = useState(
    !(posts && featuredPosts && popularPosts && trendingPosts && categories)
  );
  const animationPlayedRef = useRef(false); // To track if the animation has played

  useEffect(() => {
    // Check if all data is available
    if (posts && featuredPosts && popularPosts && trendingPosts && categories) {
      // If we were in a loading state (e.g., initial load) and data is now available,
      // set loading to false.
      if (loading) {
        setLoading(false);
      }

      // Play animation only once after data is available and component is mounted.
      if (!animationPlayedRef.current) {
        // Use requestAnimationFrame to ensure the browser has time to paint
        // before we start transitioning
        requestAnimationFrame(() => {
          // Small delay to ensure smooth transition and DOM is ready
          setTimeout(() => {
            gsap.fromTo(
              ".blog-content",
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
            );
            animationPlayedRef.current = true; // Mark animation as played
          }, 100);
        });
      }
    } else {
      // If props are not available (e.g., an unexpected scenario or initial server render without data),
      // ensure we are in a loading state.
      if (!loading) {
        setLoading(true);
      }
    }
  }, [posts, featuredPosts, popularPosts, trendingPosts, categories, loading]); // Keep loading in dependencies

  return (
    <>
      {loading ? (
        <LoadingAnimation />
      ) : (
        <div className="blog-content">
          <BlogClient
            posts={posts}
            featuredPosts={featuredPosts}
            popularPosts={popularPosts}
            trendingPosts={trendingPosts}
            categories={categories}
          />
        </div>
      )}
    </>
  );
}
