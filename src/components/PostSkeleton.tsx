export default function PostSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      {/* Header skeleton */}
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md mb-4 w-3/4"></div>
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md mb-8 w-1/2"></div>

      {/* Image skeleton */}
      <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-md mb-8"></div>

      {/* Content skeleton */}
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-5/6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-full"></div>
      </div>
    </div>
  );
}
