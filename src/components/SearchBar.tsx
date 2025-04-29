"use client";

import React, { useState, useEffect, useRef } from "react";
import { Category } from "@/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface Tag {
  id: string;
  name: string;
}

interface SearchBarProps {
  categories: Category[];
  availableTags: Tag[];
  onFiltersOpenChange?: (isOpen: boolean) => void;
}

export interface SearchParams {
  query: string;
  category: string;
  tags: Tag[];
  readTime: number | null;
  popularity: string;
}

export default function SearchBar({
  categories,
  availableTags,
  onFiltersOpenChange,
}: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchParams, setSearchParams] = useState<SearchParams>({
    query: "",
    category: "",
    tags: [],
    readTime: null,
    popularity: "any",
  });
  const [tagInput, setTagInput] = useState("");
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
  const filtersRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Initialize search params from URL on component mount and when URL changes
  useEffect(() => {
    const query = urlSearchParams.get("query") || "";
    const category = urlSearchParams.get("category") || "";
    const readTimeParam = urlSearchParams.get("readTime");
    const readTime = readTimeParam ? parseInt(readTimeParam) : null;
    const popularity = urlSearchParams.get("popularity") || "any";

    // Handle tags from URL
    const tagsParam = urlSearchParams.get("tags");
    let tags: Tag[] = [];

    if (tagsParam) {
      const tagIds = tagsParam.split(",");
      tags = tagIds
        .map((id) => {
          const foundTag = availableTags.find((tag) => tag.id === id);
          return foundTag ? foundTag : null;
        })
        .filter((tag): tag is Tag => tag !== null);
    }

    setSearchParams({
      query,
      category,
      tags,
      readTime,
      popularity,
    });
  }, [urlSearchParams, availableTags]);

  // Notify parent component about filter state changes
  useEffect(() => {
    if (onFiltersOpenChange) {
      onFiltersOpenChange(isFiltersOpen);
    }
  }, [isFiltersOpen, onFiltersOpenChange]);

  // Close filters when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        filtersRef.current &&
        !filtersRef.current.contains(event.target as Node)
      ) {
        setIsFiltersOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter tags based on input
  useEffect(() => {
    if (tagInput.trim() === "") {
      setFilteredTags([]);
      return;
    }

    const filtered = availableTags.filter(
      (tag) =>
        tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
        !searchParams.tags.some((t) => t.id === tag.id)
    );
    setFilteredTags(filtered);
  }, [tagInput, availableTags, searchParams.tags]);

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (searchParams.query) {
      params.set("query", searchParams.query);
    }

    if (searchParams.category) {
      params.set("category", searchParams.category);
    }

    if (searchParams.tags.length > 0) {
      params.set("tags", searchParams.tags.map((tag) => tag.id).join(","));
    }

    if (searchParams.readTime) {
      params.set("readTime", searchParams.readTime.toString());
    }

    if (searchParams.popularity !== "any") {
      params.set("popularity", searchParams.popularity);
    }

    const queryString = params.toString();
    router.push(pathname + (queryString ? `?${queryString}` : ""));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams({ ...searchParams, query: e.target.value });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams({ ...searchParams, category: e.target.value });
  };

  const handleReadTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams({
      ...searchParams,
      readTime: e.target.value ? parseInt(e.target.value) : null,
    });
  };

  const handlePopularityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams({ ...searchParams, popularity: e.target.value });
  };

  const addTag = (tag: Tag) => {
    if (!searchParams.tags.some((t) => t.id === tag.id)) {
      setSearchParams({
        ...searchParams,
        tags: [...searchParams.tags, tag],
      });
    }
    setTagInput("");
  };

  const removeTag = (tagId: string) => {
    setSearchParams({
      ...searchParams,
      tags: searchParams.tags.filter((tag) => tag.id !== tagId),
    });
  };

  const resetFilters = () => {
    setSearchParams({
      query: "",
      category: "",
      tags: [],
      readTime: null,
      popularity: "any",
    });

    router.push(pathname);
  };

  const toggleFilters = () => {
    setIsFiltersOpen(!isFiltersOpen);
  };

  return (
    <div className="mb-8">
      <div className="relative">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div
            className={`relative flex-grow ${
              isFocused
                ? "ring-2 ring-purple-400 dark:ring-purple-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-800"
                : ""
            } transition-all duration-300 rounded-3xl overflow-hidden group`}
          >
            <input
              type="text"
              placeholder="Search articles..."
              className="w-full pl-12 pr-4 py-4 rounded-3xl bg-gray-50/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 focus:outline-none focus:bg-white dark:focus:bg-gray-700 transition-all duration-300"
              value={searchParams.query}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors duration-300">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`${
                  isFocused ? "text-purple-500 dark:text-purple-400" : ""
                } transition-colors duration-300`}
              >
                <path
                  d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl flex items-center transition-all duration-300 relative overflow-hidden shadow-sm hover:shadow group"
              onClick={toggleFilters}
            >
              <span
                className={`absolute inset-0 bg-purple-100 dark:bg-purple-900/30 ${
                  isFiltersOpen ? "opacity-100" : "opacity-0"
                } transition-opacity duration-300`}
              ></span>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mr-2 relative z-10 group-hover:scale-110 transition-transform duration-300"
              >
                <path
                  d="M4 6H20M7 12H17M9 18H15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`${
                    isFiltersOpen ? "text-purple-600 dark:text-purple-400" : ""
                  } transition-colors duration-300`}
                />
              </svg>
              <span className="relative z-10 font-medium">Filters</span>
              {(searchParams.category ||
                searchParams.tags.length > 0 ||
                searchParams.readTime ||
                searchParams.popularity !== "any") && (
                <span className="ml-2 relative z-10 flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-xs text-white">
                  {[
                    searchParams.category ? 1 : 0,
                    searchParams.tags.length > 0 ? 1 : 0,
                    searchParams.readTime ? 1 : 0,
                    searchParams.popularity !== "any" ? 1 : 0,
                  ].reduce((a, b) => a + b, 0)}
                </span>
              )}
            </button>
            <button
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-purple-200 dark:hover:shadow-purple-900/30 font-medium relative overflow-hidden group"
              onClick={handleSearch}
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
              <span className="relative z-10 flex items-center">
                <span>Search</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="ml-2 group-hover:translate-x-1 transition-transform duration-300"
                >
                  <path
                    d="M5 12H19M19 12L12 5M19 12L12 19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
          </div>
        </div>

        {/* Filters dropdown */}
        {isFiltersOpen && (
          <div
            ref={filtersRef}
            className="absolute z-50 mt-3 w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-5 border border-gray-200 dark:border-gray-700 transform origin-top transition-all duration-300 animate-slideDown"
            style={{ zIndex: 100 }} // Explicitly set a high z-index
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <div className="relative">
                  <select
                    className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent appearance-none transition-all duration-300"
                    value={searchParams.category}
                    onChange={handleCategoryChange}
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id.toString()}>
                        {category.title}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6 9L12 15L18 9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Read time filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Read Time (minutes)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all duration-300"
                    value={searchParams.readTime || ""}
                    onChange={handleReadTimeChange}
                    placeholder="Any"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Popularity filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Popularity
                </label>
                <div className="relative">
                  <select
                    className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent appearance-none transition-all duration-300"
                    value={searchParams.popularity}
                    onChange={handlePopularityChange}
                  >
                    <option value="any">Any</option>
                    <option value="trending">Trending</option>
                    <option value="most_viewed">Most Viewed</option>
                    <option value="most_recent">Most Recent</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6 9L12 15L18 9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Tags filter */}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tags
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all duration-300"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Type to search tags..."
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7 7H7.01M14 7H14.01M7 14H7.01M14 14H14.01M21 14H21.01M21 7H21.01"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  {filteredTags.length > 0 && (
                    <div className="absolute z-60 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto animate-fadeIn">
                      {filteredTags.map((tag) => (
                        <div
                          key={tag.id}
                          className="p-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer transition-colors duration-200 flex items-center"
                          onClick={() => addTag(tag)}
                        >
                          <span className="flex-grow">{tag.name}</span>
                          <span className="text-purple-500 text-sm font-medium">
                            Add
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected tags */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {searchParams.tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 px-3 py-1.5 rounded-full text-sm group hover:bg-purple-200 dark:hover:bg-purple-800/60 transition-colors duration-200"
                    >
                      {tag.name}
                      <button
                        className="ml-1.5 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 group-hover:rotate-90 transition-transform duration-300"
                        onClick={() => removeTag(tag.id)}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M18 6L6 18M6 6L18 18"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6 gap-3">
              <button
                className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-all duration-300 flex items-center gap-2 font-medium"
                onClick={resetFilters}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 5H8M22 5H12M2 12H12M22 12H16M2 19H5M22 19H9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                Reset
              </button>
              <button
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
                onClick={() => {
                  handleSearch();
                  setIsFiltersOpen(false);
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 12L19 12M19 12L12 5M19 12L12 19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active filters display */}
      {(searchParams.category ||
        searchParams.tags.length > 0 ||
        searchParams.readTime ||
        searchParams.popularity !== "any") && (
        <div className="mt-4 flex flex-wrap items-center gap-2 animate-fadeIn">
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-1">
            Active filters:
          </span>

          {searchParams.category && (
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full text-sm group transition-all duration-300 hover:shadow-sm">
              <span className="text-gray-700 dark:text-gray-300">
                <span className="text-gray-500 dark:text-gray-400 mr-1">
                  Category:
                </span>
                {categories.find(
                  (c) => c.id.toString() === searchParams.category
                )?.title || searchParams.category}
              </span>
              <button
                className="ml-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 group-hover:rotate-90 transition-transform duration-300"
                onClick={() =>
                  setSearchParams({ ...searchParams, category: "" })
                }
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}

          {searchParams.readTime && (
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full text-sm group transition-all duration-300 hover:shadow-sm">
              <span className="text-gray-700 dark:text-gray-300">
                <span className="text-gray-500 dark:text-gray-400 mr-1">
                  Read time:
                </span>
                {searchParams.readTime} min
              </span>
              <button
                className="ml-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 group-hover:rotate-90 transition-transform duration-300"
                onClick={() =>
                  setSearchParams({ ...searchParams, readTime: null })
                }
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}

          {searchParams.popularity !== "any" && (
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full text-sm group transition-all duration-300 hover:shadow-sm">
              <span className="text-gray-700 dark:text-gray-300">
                <span className="text-gray-500 dark:text-gray-400 mr-1">
                  Popularity:
                </span>
                {searchParams.popularity.replace("_", " ")}
              </span>
              <button
                className="ml-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 group-hover:rotate-90 transition-transform duration-300"
                onClick={() =>
                  setSearchParams({ ...searchParams, popularity: "any" })
                }
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}

          {searchParams.tags.length > 0 ||
          searchParams.category ||
          searchParams.readTime ||
          searchParams.popularity !== "any" ? (
            <button
              onClick={resetFilters}
              className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 ml-1 font-medium transition-colors duration-200 flex items-center"
            >
              Clear all
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="ml-1"
              >
                <path
                  d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
