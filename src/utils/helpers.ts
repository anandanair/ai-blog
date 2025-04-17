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

// Add other helper functions here in the future