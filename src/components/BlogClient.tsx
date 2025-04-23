"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { BlogClientProps } from "@/types";
import { formatDate } from "@/utils/helpers";
import { motion } from "framer-motion";

export default function BlogClient({
  posts,
  popularPosts,
  categories,
}: BlogClientProps) {
  // Latest posts section - show the 6 most recent posts
  const latestPosts = posts.slice(0, 6);

  // Hero post - the most recent post (highest priority)
  const heroPost = posts[0];

  // Get a background color for each category
  const getCategoryColor = (category: string) => {
    const colors = [
      "from-purple-500 to-indigo-600",
      "from-blue-500 to-cyan-600",
      "from-green-500 to-emerald-600",
      "from-yellow-500 to-amber-600",
      "from-red-500 to-rose-600",
      "from-pink-500 to-fuchsia-600",
      "from-indigo-500 to-violet-600",
      "from-cyan-500 to-blue-600",
      "from-emerald-500 to-green-600",
      "from-amber-500 to-yellow-600",
    ];

    // Use the category string to deterministically select a color
    const index =
      category.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      colors.length;
    return colors[index];
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {posts.length > 0 ? (
          <>
            {/* Hero Section - Showcase Most Important Content */}
            <div className="mb-16">
              <motion.h2
                className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-6 flex items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-block w-8 h-1 bg-purple-600 mr-3"></span>
                Tech Spotlight
              </motion.h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Hero Post - Large */}
                <motion.article
                  className="lg:col-span-2 relative rounded-2xl overflow-hidden shadow-xl h-[500px] group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="absolute inset-0">
                    {heroPost.image_url ? (
                      <Image
                        src={heroPost.image_url || "/placeholder-hero.jpg"}
                        alt={heroPost.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
                        priority
                      />
                    ) : (
                      <div className="h-full bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center">
                        <span className="text-white text-9xl font-bold opacity-30">
                          {heroPost.title.substring(0, 1)}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white z-10">
                    <div className="mb-4 flex items-center">
                      <span className="inline-block bg-purple-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                        {heroPost.category || "Featured"}
                      </span>
                      <span className="mx-2 text-gray-300 text-sm">•</span>
                      <span className="text-gray-300 text-sm">
                        {formatDate(heroPost.created_at)}
                      </span>
                    </div>

                    <Link
                      href={`/posts/${heroPost.id}`}
                      className="block group"
                    >
                      <h2 className="text-3xl md:text-4xl font-bold mb-4 group-hover:text-purple-300 transition-colors duration-200">
                        {heroPost.title}
                      </h2>
                    </Link>

                    <p className="text-gray-200 mb-6 text-lg line-clamp-2 max-w-3xl">
                      {heroPost.description}
                    </p>

                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-3">
                        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 overflow-hidden">
                          <Image
                            src={
                              heroPost.author_image || "/placeholder-author.jpg"
                            }
                            alt={heroPost.author || "Author"}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {heroPost.author || "AI Model"}
                        </p>
                        <p className="text-xs text-gray-300">
                          {heroPost.read_time || "5"} min read
                        </p>
                      </div>

                      <div className="ml-auto">
                        <Link
                          href={`/posts/${heroPost.id}`}
                          className="text-white bg-purple-600 hover:bg-purple-700 font-medium rounded-full px-5 py-2 text-sm inline-flex items-center transition-colors duration-200"
                        >
                          Read Full Story
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 ml-1.5"
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
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.article>

                {/* Secondary Featured Posts - Right Column */}
                <div className="lg:col-span-1 flex flex-col space-y-6">
                  {posts.slice(1, 3).map((post, index) => (
                    <motion.article
                      key={post.id}
                      className="relative rounded-xl overflow-hidden shadow-lg h-[235px] group"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
                      whileHover={{ y: -3 }}
                    >
                      <div className="absolute inset-0">
                        {post.image_url ? (
                          <Image
                            src={
                              post.image_url || `/placeholder-${post.id}.jpg`
                            }
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 400px"
                          />
                        ) : (
                          <div className="h-full bg-gradient-to-br from-indigo-600 to-purple-800 flex items-center justify-center">
                            <span className="text-white text-6xl font-bold opacity-30">
                              {post.title.substring(0, 1)}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-5 text-white z-10">
                        <div className="mb-2 flex items-center">
                          <span className="inline-block bg-purple-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                            {post.category || "Technology"}
                          </span>
                        </div>

                        <Link
                          href={`/posts/${post.id}`}
                          className="block group"
                        >
                          <h3 className="text-lg font-bold mb-2 group-hover:text-purple-300 transition-colors duration-200 line-clamp-2">
                            {post.title}
                          </h3>
                        </Link>

                        <div className="flex items-center text-xs">
                          <span className="text-gray-300">
                            {formatDate(post.created_at)}
                          </span>
                          <span className="mx-2 text-gray-400">•</span>
                          <span className="text-gray-300">
                            {post.read_time || "3"} min
                          </span>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </div>
            </div>
            {/* Latest Posts and Categories Section - Updated Layout */}
            <div className="mb-16">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Latest Posts - Left Column (2/3 width) */}
                <div className="lg:col-span-2">
                  <motion.h2
                    className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-6 flex items-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <span className="inline-block w-8 h-1 bg-purple-600 mr-3"></span>
                    Latest Posts
                  </motion.h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {latestPosts.map((post) => (
                      <motion.article
                        key={post.id}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        whileHover={{ y: -5 }}
                      >
                        <div className="relative h-48">
                          {post.image_url ? (
                            <Image
                              src={
                                post.image_url || `/placeholder-${post.id}.jpg`
                              }
                              alt={post.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          ) : (
                            <div className="h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                              <span className="text-white text-4xl font-bold">
                                {post.title.substring(0, 1)}
                              </span>
                            </div>
                          )}
                          <div className="absolute top-3 left-3">
                            <span className="inline-block bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 text-xs font-medium px-2.5 py-1 rounded-full">
                              {post.category || "Technology"}
                            </span>
                          </div>
                        </div>

                        <div className="p-5 flex flex-col flex-grow">
                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            {formatDate(post.created_at)}
                          </div>

                          <Link
                            href={`/posts/${post.id}`}
                            className="block group mb-3"
                          >
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">
                              {post.title}
                            </h3>
                          </Link>

                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 flex-grow">
                            {post.description}
                          </p>

                          <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center">
                            <div className="flex-shrink-0 mr-3">
                              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 overflow-hidden">
                                <Image
                                  src={
                                    post.author_image ||
                                    "/placeholder-author.jpg"
                                  }
                                  alt={post.author || "Author"}
                                  width={32}
                                  height={32}
                                  className="object-cover"
                                />
                              </div>
                            </div>
                            <div className="text-xs">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {post.author || "AI Model"}
                              </p>
                              <p className="text-gray-500 dark:text-gray-400">
                                {post.read_time || "5 min read"}
                              </p>
                            </div>
                            <div className="ml-auto">
                              <Link
                                href={`/posts/${post.id}`}
                                className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 text-sm font-medium"
                              >
                                Read more
                              </Link>
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </div>
                </div>

                {/* Categories Spotlight - Right Column (1/3 width) */}
                <div className="lg:col-span-1">
                  <motion.h2
                    className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-6 flex items-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <span className="inline-block w-8 h-1 bg-purple-600 mr-3"></span>
                    Categories Spotlight
                  </motion.h2>

                  <div className="space-y-4">
                    {categories.map((category) => (
                      <motion.div
                        key={category}
                        className="relative overflow-hidden rounded-xl shadow-sm"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        whileHover={{ y: -5 }}
                      >
                        <Link href={`/posts?category=${category}`}>
                          <div
                            className={`bg-gradient-to-r ${getCategoryColor(
                              category
                            )} h-24 p-6 flex items-center justify-between group`}
                          >
                            <h3 className="text-xl font-bold text-white group-hover:text-white/90 transition-colors">
                              {category}
                            </h3>
                            <div className="bg-white/20 rounded-full p-2 group-hover:bg-white/30 transition-colors">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>

                  {/* Popular Posts Section */}
                  <div className="mt-8">
                    <motion.h2
                      className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-6 flex items-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <span className="inline-block w-8 h-1 bg-purple-600 mr-3"></span>
                      Popular Posts
                    </motion.h2>

                    <div className="space-y-4">
                      {popularPosts.slice(0, 4).map((post, index) => (
                        <motion.div
                          key={post.id}
                          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.1 * index }}
                          whileHover={{ y: -3 }}
                        >
                          <Link
                            href={`/posts/${post.id}`}
                            className="flex p-4 group"
                          >
                            <div className="flex-shrink-0 relative w-16 h-16 rounded-lg overflow-hidden mr-4">
                              {post.image_url ? (
                                <Image
                                  src={
                                    post.image_url ||
                                    `/placeholder-${post.id}.jpg`
                                  }
                                  alt={post.title}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                />
                              ) : (
                                <div className="h-full w-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                                  <span className="text-white text-xl font-bold">
                                    {post.title.substring(0, 1)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200 line-clamp-2">
                                {post.title}
                              </h3>
                              <div className="flex items-center mt-1 justify-between">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDate(post.created_at)}
                                </p>
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3.5 w-3.5 mr-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                  </svg>
                                  {post.views} views
                                </div>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
              No blog posts found. Check back later!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
