"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PostData } from "@/types";
import Link from "next/link";
import Image from "next/image";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  const [results, setResults] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSearchResults() {
      if (!query) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // In a real implementation, you would call your API endpoint
        // For now, we'll simulate a search with a timeout
        // Replace this with your actual search API call
        setTimeout(() => {
          // This is a placeholder. In a real app, you would fetch from your API
          setResults([]);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error searching posts:", error);
        setResults([]);
        setLoading(false);
      }
    }

    fetchSearchResults();
  }, [query]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">
        Search Results for: <span className="text-purple-600">{query}</span>
      </h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {results.map((post) => (
            <div
              key={post.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <Link href={`/blog/${post.id}`}>
                <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                  {post.image_url ? (
                    <Image
                      src={post.image_url}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-500 to-indigo-600">
                      <span className="text-white text-4xl font-bold">
                        {post.title.substring(0, 1)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 line-clamp-3">
                    {post.description}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 dark:text-gray-400">
            No results found for "{query}". Try a different search term.
          </p>
        </div>
      )}
    </div>
  );
}