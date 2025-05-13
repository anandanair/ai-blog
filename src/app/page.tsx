import {
  getSortedPostsData,
  getPopularPostsData,
  getTrendingPostsData,
  getFeaturedPosts,
  getAllCategoriesSortedByPostCount,
} from "@/lib/posts";
import BlogWrapper from "@/components/BlogWrapper";
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

export const revalidate = 3600;

export default async function Home() {
  const [posts, popularPosts, trendingPosts, featuredPosts, categories] =
    await Promise.all([
      getSortedPostsData({ page: 1, pageSize: 6 }),
      getPopularPostsData(5),
      getTrendingPostsData(10, 7),
      getFeaturedPosts(3),
      getAllCategoriesSortedByPostCount(),
    ]);

  return (
    <BlogWrapper
      posts={posts}
      featuredPosts={featuredPosts}
      popularPosts={popularPosts}
      trendingPosts={trendingPosts}
      categories={categories}
    />
  );
}
