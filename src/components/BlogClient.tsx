"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { BlogClientProps } from "@/types";
import { formatDate } from "@/utils/helpers";

export default function BlogClient({ posts }: BlogClientProps) {
  // Filter out AI Tool posts from the main posts list
  const blogPosts = posts.filter(
    (post) => post.category !== "AI Tool of the Day"
  );

  // Latest posts section - show the 6 most recent posts
  const latestPosts = blogPosts.slice(0, 6);

  // Featured post is the most recent one after the latest posts
  const featuredPost = blogPosts[6] || blogPosts[0]; // Fallback to first post if not enough posts

  // Rest of the posts
  const regularPosts = blogPosts.slice(7);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {blogPosts.length > 0 ? (
          <>
            {/* Latest Posts Section - Modern Design */}
            <div className="mb-12">
              <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-6 flex items-center">
                <span className="inline-block w-8 h-1 bg-purple-600 mr-3"></span>
                Latest Posts
              </h2>

              <div className="relative overflow-hidden">
                {/* Horizontal scrollable container */}
                <div className="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                  {latestPosts.map((post) => (
                    <article
                      key={post.id}
                      className="flex-shrink-0 w-[280px] sm:w-[320px] bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden snap-start"
                    >
                      <div className="relative h-40">
                        {post.image_url ? (
                          <Image
                            src={
                              post.image_url || `/placeholder-${post.id}.jpg`
                            }
                            alt={post.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 280px, 320px"
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

                      <div className="p-4">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {formatDate(post.created_at)}
                        </div>

                        <Link
                          href={`/posts/${post.id}`}
                          className="block group mb-2"
                        >
                          <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200 line-clamp-2">
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
                    </article>
                  ))}
                </div>

                {/* Gradient fade effect on the right side */}
                <div className="absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-l from-gray-50 dark:from-gray-900 to-transparent pointer-events-none"></div>
              </div>

              {/* View all posts link */}
              <div className="mt-4 text-right">
                <Link
                  href="/blog"
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
              </div>
            </div>

            {/* Featured post */}
            {featuredPost && (
              <div className="mb-16">
                <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-6 flex items-center">
                  <span className="inline-block w-8 h-1 bg-purple-600 mr-3"></span>
                  Featured Article
                </h2>

                <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                  <div className="relative h-96">
                    {featuredPost.image_url ? (
                      <Image
                        src={
                          featuredPost.image_url || "/placeholder-featured.jpg"
                        }
                        alt={featuredPost.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1280px) 100vw, 1280px"
                      />
                    ) : (
                      <div className="h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                        <span className="text-white text-8xl font-bold">
                          {featuredPost.title.substring(0, 1)}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  </div>

                  <div className="relative mt-[-100px] p-8 text-white z-10">
                    <div className="mb-4">
                      <span className="inline-block bg-purple-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                        {featuredPost.category || "Technology"}
                      </span>
                      <span className="mx-2 text-gray-300 text-sm">•</span>
                      <span className="text-gray-300 text-sm">
                        {formatDate(featuredPost.created_at)}
                      </span>
                    </div>

                    <Link
                      href={`/posts/${featuredPost.id}`}
                      className="block group"
                    >
                      <h2 className="text-3xl md:text-4xl font-bold mb-4 group-hover:text-purple-300 transition-colors duration-200">
                        {featuredPost.title}
                      </h2>
                    </Link>

                    <p className="text-gray-200 mb-6 line-clamp-3">
                      {featuredPost.description}
                    </p>

                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-4">
                        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 overflow-hidden">
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
                        <p className="text-sm font-medium">
                          {featuredPost.author || "AI Model"}
                        </p>
                      </div>

                      <div className="ml-auto">
                        <Link
                          href={`/posts/${featuredPost.id}`}
                          className="text-white bg-purple-600 hover:bg-purple-700 font-medium rounded-full px-5 py-2 inline-flex items-center transition-colors duration-200"
                        >
                          Read Article
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
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            )}

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
