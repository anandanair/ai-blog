import { getPostData, getAllPostIds } from "@/lib/posts";
import PostClient from "@/components/PostClient";
import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import PostSkeleton from "@/components/PostSkeleton";

type Params = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  { params }: Params,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const postData = await getPostData(id).catch(() => null);

  const siteUrl = "https://blog.itsmeanand.com/";

  if (!postData) {
    return {
      title: "Post Not Found",
      description: "The requested AutoTek post could not be found.",
      alternates: {
        canonical: `${siteUrl}/posts`,
      },
    };
  }

  const postUrl = `${siteUrl}/posts/${postData.id}`;
  const imageUrl = postData.image_url
    ? postData.image_url.startsWith("http")
      ? postData.image_url
      : `${siteUrl}${postData.image_url}`
    : `${siteUrl}/og-default.png`;

  const metaDescription =
    postData.description ||
    `Read the full post "${postData.title}" on AutoTek. Discover insights on autonomous technology.`;

  return {
    title: postData.title,
    description: metaDescription,
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      title: `${postData.title} | AutoTek`,
      description: metaDescription,
      url: postUrl,
      siteName: "AutoTek",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: postData.title,
        },
      ],
      locale: "en_US",
      type: "article",
      publishedTime: postData.created_at,
      modifiedTime: postData.created_at,
      authors: [postData.author || "AutoTek Team"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${postData.title} | AutoTek`,
      description: metaDescription,
      images: [imageUrl], // Must be an absolute URL
    },
    other: {
      'application/ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: postData.title,
        description: metaDescription,
        image: imageUrl,
        author: {
          '@type': 'Person',
          name: postData.author || 'AutoTek Team',
        },
        publisher: {
          '@type': 'Organization',
          name: 'AutoTek',
          logo: {
            '@type': 'ImageObject',
            url: `${siteUrl}android-chrome-512x512.png`, // Corrected path
          },
        },
        datePublished: new Date(postData.created_at).toISOString(),
        dateModified: new Date(postData.created_at).toISOString(), // Using created_at as updated_at is not available
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': postUrl,
        },
      }),
    },
  };
}

export async function generateStaticParams() {
  try {
    const paths = await getAllPostIds();
    return paths;
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

export const revalidate = 86400;

export default async function Post({ params }: Params) {
  try {
    const { id } = await params;
    const postData = await getPostData(id);

    if (!postData) {
      notFound();
    }

    return (
      <Suspense fallback={<PostSkeleton />}>
        <PostClient postData={postData} />
      </Suspense>
    );
  } catch (error) {
    console.error("Error rendering post:", error);

    // Return a user-friendly error component
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="text-center max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400 mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We encountered an error while loading this post. Please try again
            later or return to the homepage.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
          >
            Return to Homepage
          </a>
        </div>
      </div>
    );
  }
}
