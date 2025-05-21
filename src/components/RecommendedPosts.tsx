import React, { useEffect, useState } from 'react';
import Link from 'next/link'; // Correct import for Next.js
import { PostData } from '../types';

const RecommendedPosts: React.FC = () => {
  const [recommendedPosts, setRecommendedPosts] = useState<PostData[]>([]);
  const [allPosts, setAllPosts] = useState<PostData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/posts');
        if (!response.ok) {
          throw new Error(`Failed to fetch posts: ${response.statusText}`);
        }
        const data: PostData[] = await response.json();
        setAllPosts(data);
      } catch (err) {
        console.error('Error fetching posts for recommendations:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setAllPosts([]); // Ensure allPosts is empty on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  useEffect(() => {
    if (isLoading || error || allPosts.length === 0) {
      if (!isLoading && !error && allPosts.length === 0) {
        // console.log("No posts available to filter for recommendations.");
      }
      setRecommendedPosts([]);
      return;
    }

    const storedHistory = localStorage.getItem('readingHistory');
    let finalRecommendations: PostData[] = [];
    const postsViewedById: string[] = []; // Posts that are in history by ID

    if (storedHistory) {
      const readingHistory: string[] = JSON.parse(storedHistory);
      readingHistory.forEach(item => {
        if (!item.startsWith('category:')) {
          postsViewedById.push(item);
        }
      });

      // 1. Recommend posts from categories in history, excluding posts that are themselves directly in history by ID.
      const categoryRecs = allPosts.filter(post => {
        const isPostItselfViewed = postsViewedById.includes(post.id.toString());
        if (isPostItselfViewed) return false; // Don't recommend if already viewed

        const postCategories = post.category ? [post.category] : [];
        // Check if any of the post's categories match a category in the reading history
        return postCategories.some(cat => readingHistory.includes(`category:${cat}`));
      });
      finalRecommendations.push(...categoryRecs);
    }

    // 2. If not enough recommendations, fill with other posts not directly viewed and not already selected.
    // This is a general fallback.
    if (finalRecommendations.length < 5) {
      const fallbackRecs = allPosts.filter(post => {
        const isPostItselfViewed = postsViewedById.includes(post.id.toString());
        const alreadyInRecommendations = finalRecommendations.find(r => r.id === post.id);
        return !isPostItselfViewed && !alreadyInRecommendations;
      });
      // Add from fallback until 5 recommendations are reached or fallbackRecs run out
      finalRecommendations.push(...fallbackRecs.slice(0, 5 - finalRecommendations.length));
    }
    
    // Remove duplicates (e.g. if a post fits category and also generic fallback, though current logic should prevent this)
    const uniqueRecs = Array.from(new Map(finalRecommendations.map(p => [p.id, p])).values());
    setRecommendedPosts(uniqueRecs.slice(0, 5));

  }, [allPosts, isLoading, error]);

  if (isLoading) {
    return <div className="text-center py-4">Loading recommendations...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Could not load recommendations: {error}</div>;
  }

  if (recommendedPosts.length === 0) {
    // Optionally, show a message or a few generic posts if no specific recommendations
    return (
        <div className="recommended-posts py-8">
            <h3 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Explore More Posts</h3>
            {allPosts.length > 0 ? (
                 <ul className="space-y-4">
                    {allPosts.slice(0, 3).map(post => (
                        <li key={post.id} className="p-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300">
                            <Link href={`/posts/${post.id}`} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-500">
                                <h4 className="text-lg font-medium">{post.title}</h4>
                            </Link>
                            {post.category && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Category: {post.category}</p>}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-600 dark:text-gray-400">No other posts to show right now.</p>
            )}
        </div>
    );
  }

  return (
    <div className="recommended-posts py-8">
      <h3 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Recommended For You</h3>
      <ul className="space-y-4">
        {recommendedPosts.map(post => (
          <li key={post.id} className="p-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300">
            {/* Corrected Link usage for Next.js */}
            <Link href={`/posts/${post.id}`} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-500">
                <h4 className="text-lg font-medium">{post.title}</h4>
            </Link>
            {post.category && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Category: {post.category}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecommendedPosts;
