import {
  getSortedPostsData,
  getPopularPostsData,
  getTrendingPostsData,
  getFeaturedPosts,
  getAllCategoriesSortedByPostCount,
} from "@/lib/posts"; // Import getPopularPostsData
import BlogClient from "@/components/BlogClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  description:
    "Explore the latest in autonomous technology on AutoTek. Read featured articles, discover trending topics, browse popular posts, and dive into categories covering self-driving cars, AI, robotics, and more.",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    description:
      "Explore the latest in autonomous technology on AutoTek. Read featured articles, discover trending topics, browse popular posts, and more.",
  },
  twitter: {
    description:
      "Explore the latest in autonomous technology on AutoTek. Read featured articles, discover trending topics, browse popular posts, and more.",
  },
};

export default async function Home() {
  const posts = await getSortedPostsData();
  const popularPosts = await getPopularPostsData(5);
  const trendingPosts = await getTrendingPostsData(10, 7);
  const featuredPosts = await getFeaturedPosts(3);
  const categories = await getAllCategoriesSortedByPostCount();

  return (
    <BlogClient
      posts={posts}
      featuredPosts={featuredPosts}
      popularPosts={popularPosts}
      trendingPosts={trendingPosts}
      categories={categories}
    />
  ); // Pass popularPosts
}
