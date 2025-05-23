'use client';

import React, { useState, useEffect, FormEvent } from 'react';

interface Comment {
  id: string; // Or number, depending on your schema (BIGINT maps to number/string in JS)
  post_slug: string;
  author_name: string;
  content: string;
  created_at: string; // ISO date string
  parent_comment_id?: string | null;
}

interface CommentsSectionProps {
  post_slug: string;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ post_slug }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [newCommentAuthor, setNewCommentAuthor] = useState<string>('');
  const [newCommentContent, setNewCommentContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const fetchComments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/posts/${post_slug}/comments`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch comments: ${response.statusText}`);
      }
      const data: Comment[] = await response.json();
      setComments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (post_slug) {
      fetchComments();
    }
  }, [post_slug]);

  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!newCommentAuthor.trim() || !newCommentContent.trim()) {
      setSubmitError('Name and comment cannot be empty.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/posts/${post_slug}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          author_name: newCommentAuthor,
          content: newCommentContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to submit comment: ${response.statusText}`);
      }

      // const newComment: Comment = await response.json(); // The new comment is returned
      setNewCommentAuthor('');
      setNewCommentContent('');
      setSubmitSuccess('Comment submitted successfully!');
      fetchComments(); // Refresh comments list
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
      // Clear success message after a few seconds
      if (submitSuccess) {
        setTimeout(() => setSubmitSuccess(null), 5000);
      }
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">Comments</h2>

      {/* Comment Submission Form */}
      <form onSubmit={handleSubmitComment} className="mb-6 p-4 border rounded-lg shadow">
        <h3 className="text-xl font-medium mb-2">Leave a Comment</h3>
        {submitError && <p className="text-red-500 mb-2">{submitError}</p>}
        {submitSuccess && <p className="text-green-500 mb-2">{submitSuccess}</p>}
        <div className="mb-4">
          <label htmlFor="commentAuthor" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            id="commentAuthor"
            value={newCommentAuthor}
            onChange={(e) => setNewCommentAuthor(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="commentContent" className="block text-sm font-medium text-gray-700 mb-1">
            Comment
          </label>
          <textarea
            id="commentContent"
            value={newCommentContent}
            onChange={(e) => setNewCommentContent(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          ></textarea>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Comment'}
        </button>
      </form>

      {/* Display Comments */}
      {isLoading && <p>Loading comments...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!isLoading && !error && comments.length === 0 && <p>No comments yet. Be the first to comment!</p>}
      
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="p-4 border rounded-lg shadow-sm bg-white">
            <div className="flex items-center mb-1">
              <p className="font-semibold text-gray-800 mr-2">{comment.author_name}</p>
              <p className="text-xs text-gray-500">
                {new Date(comment.created_at).toLocaleString()}
              </p>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            {/* Basic reply functionality can be added here later */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentsSection;
