"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { BlogClientProps } from "@/types";
import { formatDate } from "@/utils/helpers";

export default function BlogClient({ posts }: BlogClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPosts, setFilteredPosts] = useState(posts);

  useEffect(() => {
    // Filter out AI Tool posts from the main posts list
    const normalPosts = posts.filter(
      (post) => post.category !== "AI Tool of the Day"
    );

    // Apply search filter to the normal posts
    const filtered = normalPosts.filter((post) => {
      // Basic title/description search
      const matchesSearch =
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.description &&
          post.description.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesSearch;
    });

    setFilteredPosts(filtered);
  }, [searchTerm, posts]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className={`min-h-screen`}>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Post (First Post) */}
        {filteredPosts.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center">
              <span className="mr-2">Featured Post</span>
              <div className="h-px flex-grow bg-gradient-to-r from-blue-600 to-transparent ml-4"></div>
            </h2>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/2">
                  <div className="h-64 md:h-full relative">
                    {filteredPosts[0].image_url ? (
                      <Image
                        src={filteredPosts[0].image_url}
                        alt={filteredPosts[0].title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-6xl">🧠</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:w-1/2 p-6 md:p-8">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {formatDate(filteredPosts[0].created_at)}
                  </div>

                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    {filteredPosts[0].title}
                  </h3>

                  <p className="text-gray-600 dark:text-gray-300 mb-6 line-clamp-3">
                    {filteredPosts[0].description}
                  </p>

                  <Link href={`/posts/${filteredPosts[0].id}`}>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      Read Full Article
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 ml-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </motion.div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Posts */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center">
            <span className="mr-2">Recent Articles</span>
            <div className="h-px flex-grow bg-gradient-to-r from-blue-600 to-transparent ml-4"></div>
          </h2>

          <AnimatePresence mode="wait">
            {filteredPosts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow"
              >
                <div className="inline-block text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                  No articles found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Try adjusting your search
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSearchTerm("")}
                  className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Reset search
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
              >
                {/* Skip the first post if it's shown as featured */}
                {filteredPosts.slice(1).map((post) => (
                  <motion.article
                    key={post.id}
                    variants={item}
                    whileHover={{ y: -5 }}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col h-full border border-gray-100 dark:border-gray-700"
                  >
                    <Link
                      href={`/posts/${post.id}`}
                      className="block flex-grow"
                    >
                      <div className="h-48 relative">
                        {post.image_url ? (
                          <Image
                            src={post.image_url}
                            alt={post.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-4xl">🧠</span>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {formatDate(post.created_at)}
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2">
                          {post.title}
                        </h3>

                        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                          {post.description}
                        </p>
                      </div>
                    </Link>
                    <div className="px-5 pb-5 mt-auto">
                      <Link href={`/posts/${post.id}`}>
                        <span className="text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center">
                          Read more
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 ml-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>
                        </span>
                      </Link>
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
