"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { BlogClientProps } from "@/types";
import { formatDate } from "@/utils/helpers";
import { motion } from "framer-motion";

export default function BlogClient({ posts, popularPosts }: BlogClientProps) {
  // Latest posts section - show the 6 most recent posts
  const latestPosts = posts.slice(0, 6);

  // Hero post - the most recent post (highest priority)
  const heroPost = posts[0];

  // Featured post is the next most recent one after the hero post
  const featuredPost = posts[6] || posts[1]; // Fallback to second post if not enough posts

  // Rest of the posts
  const regularPosts = posts.slice(7);

  // Scroll container reference
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null);

  // Handle scroll event to update progress bar
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      const scrollPercentage = scrollLeft / (scrollWidth - clientWidth);
      setScrollProgress(scrollPercentage);

      // Show/hide navigation arrows based on scroll position
      setShowLeftArrow(scrollLeft > 20);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
    }
  };

  // Scroll left/right functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  // Add scroll event listener
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      // Check if right arrow should be shown initially
      setShowRightArrow(
        scrollContainer.scrollWidth > scrollContainer.clientWidth
      );
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, []);

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

            {/* Latest Posts Section - Modern Design with Animations */}
            <div className="mb-12">
              <motion.h2
                className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-6 flex items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-block w-8 h-1 bg-purple-600 mr-3"></span>
                Latest Posts
              </motion.h2>

              <div className="relative">
                {/* Navigation Arrows */}
                {showLeftArrow && (
                  <motion.button
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-300 focus:outline-none"
                    onClick={scrollLeft}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-purple-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </motion.button>
                )}

                {showRightArrow && (
                  <motion.button
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-300 focus:outline-none"
                    onClick={scrollRight}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-purple-600"
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
                  </motion.button>
                )}

                {/* Horizontal scrollable container */}
                <div
                  ref={scrollContainerRef}
                  className="flex space-x-6 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  onScroll={handleScroll}
                >
                  {latestPosts.map((post, index) => (
                    <motion.article
                      key={post.id}
                      className="flex-shrink-0 w-[280px] sm:w-[320px] 
                      bg-gradient-to-r from-indigo-200/10 via-purple-300/30 to-blue-400/20 dark:from-violet-900/30 dark:via-blue-800/10 dark:to-slate-950/50
                      backdrop-blur-sm rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden snap-start"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{
                        y: -5,
                        transition: { duration: 0.2 },
                      }}
                      onHoverStart={() => setHoveredPostId(post.id)}
                      onHoverEnd={() => setHoveredPostId(null)}
                    >
                      <div className="relative h-40 overflow-hidden">
                        {post.image_url ? (
                          <motion.div
                            className="w-full h-full"
                            animate={{
                              scale: hoveredPostId === post.id ? 1.05 : 1,
                            }}
                            transition={{ duration: 0.3 }}
                          >
                            <Image
                              src={
                                post.image_url || `/placeholder-${post.id}.jpg`
                              }
                              alt={post.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 280px, 320px"
                            />
                          </motion.div>
                        ) : (
                          <div className="h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                            <span className="text-white text-4xl font-bold">
                              {post.title.substring(0, 1)}
                            </span>
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <motion.span
                            className="inline-block bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 text-xs font-medium px-2.5 py-1 rounded-full"
                            whileHover={{ scale: 1.05 }}
                          >
                            {post.category || "Technology"}
                          </motion.span>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {formatDate(post.created_at)}
                        </div>

                        <Link
                          href={`/posts/${post.id}`}
                          className="block group mb-2"
                        >
                          <h3 className="text-base font-bold text-gray-900 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200 line-clamp-2">
                            {post.title}
                          </h3>
                        </Link>

                        <div className="flex items-center mt-2 text-xs">
                          <div className="flex-shrink-0 mr-2">
                            <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 overflow-hidden">
                              <Image
                                src={
                                  post.author_image || "/placeholder-author.jpg"
                                }
                                alt={post.author || "Author"}
                                width={24}
                                height={24}
                                className="object-cover"
                              />
                            </div>
                          </div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {post.author || "AI Model"}
                          </span>
                          <span className="mx-2 text-gray-400">•</span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {post.read_time || "5"} min
                          </span>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>

                {/* Modern Custom Scrollbar */}
                <div className="mt-4 mx-auto w-full max-w-md bg-gray-200 dark:bg-gray-700 h-1 rounded-full overflow-hidden">
                  <motion.div
                    className="bg-purple-600 h-full rounded-full"
                    style={{ width: `${scrollProgress * 100}%` }}
                    initial={{ width: "0%" }}
                    animate={{ width: `${scrollProgress * 100}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </div>

              {/* View all posts link */}
              <motion.div
                className="mt-4 text-right"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                whileHover={{ x: -5 }}
              >
                <Link
                  href="/posts"
                  className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 inline-flex items-center"
                >
                  View all posts
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
                </Link>
              </motion.div>
            </div>

            {/* Featured and Popular Posts Section */}
            <div className="mb-16">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Featured Post - Left Column */}
                <div className="mb-12">
                  <motion.h2
                    className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-8 flex items-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <span className="inline-block w-10 h-1.5 bg-purple-600 dark:bg-purple-500 mr-4"></span>
                    Featured Article
                  </motion.h2>

                  <motion.article
                    className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-xl dark:shadow-gray-900/30 h-full transform-gpu"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  >
                    <div className="relative h-80 md:h-96">
                      {featuredPost.image_url ? (
                        <Image
                          src={
                            featuredPost.image_url ||
                            "/placeholder-featured.jpg"
                          }
                          alt={featuredPost.title}
                          fill
                          className="object-cover transition-transform duration-700 hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          priority
                        />
                      ) : (
                        <div className="h-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
                          <span className=" text-8xl font-bold opacity-80">
                            {featuredPost.title.substring(0, 1)}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                    </div>

                    <div className="relative mt-[-100px] p-8 z-10">
                      <div className="mb-4 flex flex-wrap items-center">
                        <span className="inline-block bg-purple-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg shadow-purple-600/30">
                          {featuredPost.category || "Technology"}
                        </span>
                        <span className="mx-3 text-gray-300 text-sm">•</span>
                        <span className="text-gray-300 text-sm flex items-center">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            ></path>
                          </svg>
                          {formatDate(featuredPost.created_at)}
                        </span>
                      </div>

                      <Link
                        href={`/posts/${featuredPost.id}`}
                        className="block group"
                      >
                        <h2 className="text-3xl font-bold mb-4 group-hover:text-purple-300 transition-colors duration-300 leading-tight">
                          {featuredPost.title}
                        </h2>
                      </Link>

                      <p className="mb-6 text-lg line-clamp-3">
                        {featuredPost.description}
                      </p>

                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700/30">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 mr-3">
                            <div className="w-10 h-10 rounded-full border-2 border-purple-500 overflow-hidden">
                              <Image
                                src={
                                  featuredPost.author_image ||
                                  "/placeholder-author.jpg"
                                }
                                alt={featuredPost.author || "Author"}
                                width={40}
                                height={40}
                                className="object-cover"
                              />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-semibold">
                              {featuredPost.author || "AI Model"}
                            </p>
                          </div>
                        </div>

                        <Link
                          href={`/posts/${featuredPost.id}`}
                          className="text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 font-medium rounded-full px-6 py-2.5 text-sm inline-flex items-center transition-all duration-300 shadow-lg shadow-purple-600/30 hover:shadow-purple-700/40"
                        >
                          Read Article
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300"
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
                  </motion.article>
                </div>

                {/* Popular Posts - Right Column */}
                <div>
                  <motion.h2
                    className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-6 flex items-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <span className="inline-block w-8 h-1 bg-purple-600 mr-3"></span>
                    Trending Now
                  </motion.h2>

                  <div className="space-y-4">
                    {popularPosts.slice(0, 4).map((post, index) => (
                      <motion.article
                        key={post.id}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 * index }}
                        whileHover={{ x: 5 }}
                      >
                        <div className="flex">
                          <div className="relative w-24 h-24 flex-shrink-0">
                            {post.image_url ? (
                              <Image
                                src={
                                  post.image_url ||
                                  `/placeholder-${post.id}.jpg`
                                }
                                alt={post.title}
                                fill
                                className="object-cover"
                                sizes="96px"
                              />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                                <span className="text-white text-2xl font-bold">
                                  {post.title.substring(0, 1)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="p-4 flex flex-col justify-between flex-grow">
                            <div>
                              <div className="flex items-center mb-1">
                                <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                                  {post.category || "Technology"}
                                </span>
                                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                  {formatDate(post.created_at)}
                                </span>
                              </div>
                              <Link
                                href={`/posts/${post.id}`}
                                className="block group"
                              >
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 line-clamp-2">
                                  {post.title}
                                </h3>
                              </Link>
                            </div>
                            <div className="flex items-center justify-between mt-2">
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
                              <Link
                                href={`/posts/${post.id}`}
                                className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 text-xs font-medium"
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
              </div>
            </div>

            {/* More articles section - only show if we have more posts */}
            {regularPosts.length > 0 && (
              <div className="mb-16">
                <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-6 flex items-center">
                  <span className="inline-block w-8 h-1 bg-purple-600 mr-3"></span>
                  More Articles
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {regularPosts.slice(0, 6).map((post) => (
                    <article
                      key={post.id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full"
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
                            sizes="(max-width: 768px) 100vw, 33vw"
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
                                  post.author_image || "/placeholder-author.jpg"
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
                              {post.read_time || "5"} min read
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
                    </article>
                  ))}
                </div>
              </div>
            )}
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
