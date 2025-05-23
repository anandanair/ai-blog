'use client';

import React from 'react';
import Link from 'next/link';
import { PostData } from '@/types'; // Assuming PostData is the correct type for related posts
import { formatDate } from '@/utils/helpers'; // Optional: if you want to display dates

interface RelatedPostsProps {
  posts?: PostData[]; // Make posts optional to handle cases where there are no related posts
}

const RelatedPosts: React.FC<RelatedPostsProps> = ({ posts }) => {
  if (!posts || posts.length === 0) {
    return null; // Render nothing if there are no related posts
  }

  return (
    <div className="mt-12 py-8 border-t border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
        Related Posts
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link key={post.id} href={`/posts/${post.id}`} passHref>
            <div className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out cursor-pointer h-full flex flex-col justify-between">
              <div>
                {post.image_url && (
                  <div className="mb-4 overflow-hidden rounded-md aspect-video">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={post.image_url} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-2 text-blue-600 dark:text-blue-400 hover:underline">
                  {post.title}
                </h3>
                {post.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                        {post.description}
                    </p>
                )}
              </div>
              <div className="mt-auto">
                {post.category && (
                  <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded-full mb-2">
                    {post.category}
                  </span>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(post.created_at)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedPosts;
