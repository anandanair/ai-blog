"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Category } from "@/types";
import { getCategoryColor } from "@/utils/helpers";

interface CategoriesClientProps {
  categories: Category[];
}

export default function CategoriesClient({
  categories,
}: CategoriesClientProps) {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.h1
          className="text-3xl font-bold text-gray-900 dark:text-white mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          All Categories
        </motion.h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              className="relative overflow-hidden rounded-xl shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 * index }}
              whileHover={{ y: -5 }}
            >
              <Link href={`/posts?category=${category.id}`}>
                <div
                  className={`bg-gradient-to-r ${getCategoryColor(
                    category.title
                  )} h-32 p-6 flex flex-col justify-between group`}
                >
                  <h3 className="text-xl font-bold text-white group-hover:text-white/90 transition-colors">
                    {category.title}
                  </h3>

                  <div className="flex items-center justify-between mt-4">
                    <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm">
                      {category.post_count || 0} posts
                    </span>
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
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
