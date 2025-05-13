"use client";

import { useEffect, useState } from "react";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if all data is available
    if (posts && featuredPosts && popularPosts && trendingPosts && categories) {
      // Use requestAnimationFrame to ensure the browser has time to paint
      // before we start transitioning
      requestAnimationFrame(() => {
        // Small delay to ensure smooth transition
        setTimeout(() => {
          setLoading(false);

          // Fade in the main content
          gsap.fromTo(
            ".blog-content",
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
          );
        }, 100);
      });
    }
  }, [posts, featuredPosts, popularPosts, trendingPosts, categories]);

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
