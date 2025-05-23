/**
 * Formats a date string into a more readable format (e.g., "April 17, 2025").
 * @param dateString - The date string to format (ISO 8601 format expected).
 * @returns The formatted date string, or the original string if formatting fails.
 */
export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(dateString));
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString; // Return original string if formatting fails
  }
};

// Get a background color for each category
export const getCategoryColor = (category: string) => {
  const colors = [
    // Original colors
    "from-purple-500 to-indigo-600",
    "from-blue-500 to-cyan-600",
    "from-green-500 to-emerald-600",
    "from-yellow-500 to-amber-600",
    "from-red-500 to-rose-600",
    "from-pink-500 to-fuchsia-600",
    "from-indigo-500 to-violet-600",
    "from-cyan-500 to-blue-600",
    "from-emerald-500 to-green-600",
    "from-amber-500 to-yellow-600",

    // Additional color variations
    "from-teal-500 to-green-600",
    "from-sky-500 to-blue-600",
    "from-violet-500 to-purple-600",
    "from-fuchsia-500 to-pink-600",
    "from-rose-500 to-red-600",
    "from-orange-500 to-amber-600",
    "from-lime-500 to-green-600",
    "from-emerald-500 to-teal-600",
    "from-cyan-500 to-sky-600",
    "from-blue-500 to-indigo-600",

    // Darker variations
    "from-purple-600 to-indigo-800",
    "from-blue-600 to-cyan-800",
    "from-green-600 to-emerald-800",
    "from-yellow-600 to-amber-800",
    "from-red-600 to-rose-800",

    // Lighter variations
    "from-purple-400 to-indigo-500",
    "from-blue-400 to-cyan-500",
    "from-green-400 to-emerald-500",
    "from-yellow-400 to-amber-500",
    "from-red-400 to-rose-500",

    // More unique combinations
    "from-indigo-500 to-pink-500",
    "from-purple-500 to-red-500",
    "from-blue-500 to-green-500",
    "from-yellow-500 to-red-500",
    "from-teal-500 to-indigo-500",
    "from-cyan-500 to-purple-500",
    "from-emerald-500 to-blue-500",
    "from-lime-500 to-teal-500",
    "from-amber-500 to-pink-500",
    "from-rose-500 to-purple-500",
  ];

  // Use the category string to deterministically select a color
  const index =
    category.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    colors.length;
  return colors[index];
};
