"use client";

import { AiTool } from "@/types";
import Image from "next/image";
import Link from "next/link";

interface AiToolClientProps {
  aiTool: AiTool;
}

export default function AiToolClient({ aiTool }: AiToolClientProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
          <div className="relative h-96 bg-gray-200 dark:bg-gray-700">
            {aiTool.image_url ? (
              <Image
                src={aiTool.image_url}
                alt={aiTool.title}
                fill
                className="object-cover hover:scale-105 transition-transform duration-500"
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-700 dark:to-indigo-800">
                <span className="text-white text-7xl font-bold">
                  {aiTool.title.substring(0, 1)}
                </span>
              </div>
            )}
          </div>

          <div className="px-8 py-10">
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {aiTool.title}
                </h1>
                <Link
                  href="/ai-tools"
                  className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors duration-200"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back to AI Tools
                </Link>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl p-6 mb-10">
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  {aiTool.description}
                </p>
              </div>

              <div className="blog-content prose prose-lg dark:prose-invert prose-headings:text-purple-700 dark:prose-headings:text-purple-300 prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-img:rounded-xl prose-img:shadow-md max-w-none">
                <div
                  dangerouslySetInnerHTML={{ __html: aiTool.contentHtml || "" }}
                />
              </div>

              <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 flex justify-center">
                <Link
                  href="/ai-tools"
                  className="inline-flex items-center px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-700 text-white transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back to AI Tools
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
