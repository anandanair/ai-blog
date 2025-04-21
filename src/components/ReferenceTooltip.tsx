// components/ReferenceTooltip.tsx
import React, { useState, useRef, useEffect } from "react";
import { ResearchDetailItem } from "@/types";
import { createPortal } from "react-dom";

interface ReferenceTooltipProps {
  researchData: ResearchDetailItem["data"];
  refId: string;
}

const ReferenceTooltip: React.FC<ReferenceTooltipProps> = ({
  researchData,
  refId,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isLocked, setIsLocked] = useState(false); // Track if tooltip is locked open
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  // Fix hydration issues with client-side only rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle tooltip positioning
  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      if (tooltipRect.left < 10) {
        tooltipRef.current.style.transform = "translateX(0)";
        tooltipRef.current.style.left = "0";
      } else if (tooltipRect.right > window.innerWidth - 10) {
        tooltipRef.current.style.transform = "translateX(-100%)";
        tooltipRef.current.style.left = "100%";
      }
    }
  }, [isVisible]);

  // Handle click outside to close tooltip
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        triggerRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVisible]);

  const hasSources = researchData.sources && researchData.sources.length > 0;
  const hasSuggestions = !!researchData.renderedContent;

  // Display just the reference number
  const refNumber = refId.split("-")[1];

  // Handle click to show/hide tooltip
  const handleClick = () => {
    setIsVisible(!isVisible);
  };

  // This wrapper has display: contents to avoid nesting issues
  return (
    <span className="inline-block align-baseline" ref={triggerRef}>
      {/* Reference trigger */}
      <button
        type="button"
        onClick={handleClick}
        onFocus={() => {}} // Empty handlers to maintain accessibility
        onBlur={() => {}}
        className="inline-flex items-center justify-center mx-1 px-1.5 py-0.5 
                  bg-blue-100 hover:bg-blue-200 
                  dark:bg-blue-900 dark:hover:bg-blue-800 
                  text-blue-700 dark:text-blue-300 
                  text-xs font-mono rounded 
                  cursor-pointer align-middle 
                  transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-describedby={`tooltip-${refId}`}
      >
        [{refNumber}]
      </button>

      {/* Portal for tooltip content to avoid nesting issues */}
      {isMounted && isVisible && (
        <TooltipPortal>
          <TooltipContent
            tooltipRef={tooltipRef}
            triggerRef={triggerRef}
            refId={refId}
            researchData={researchData}
            hasSources={hasSources}
            hasSuggestions={hasSuggestions}
            onClose={() => {
              setIsVisible(false);
            }}
          />
        </TooltipPortal>
      )}
    </span>
  );
};

// Tooltip portal component to render outside of paragraphs
const TooltipPortal: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Create portal container on mount
    const portalContainer = document.createElement("div");
    portalContainer.setAttribute("id", "tooltip-portal");
    document.body.appendChild(portalContainer);
    setContainer(portalContainer);

    // Remove portal container on unmount
    return () => {
      if (document.body.contains(portalContainer)) {
        document.body.removeChild(portalContainer);
      }
    };
  }, []);

  return container ? createPortal(children, container) : null;
};

// Separate component for tooltip content
interface TooltipContentProps {
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  triggerRef: React.RefObject<HTMLSpanElement | null>;
  refId: string;
  researchData: ResearchDetailItem["data"];
  hasSources: boolean;
  hasSuggestions: boolean;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const TooltipContent: React.FC<TooltipContentProps> = ({
  tooltipRef,
  triggerRef,
  refId,
  researchData,
  hasSources,
  hasSuggestions,
  onClose,
  onMouseEnter,
  onMouseLeave,
}) => {
  useEffect(() => {
    // Position tooltip relative to trigger on mount
    if (tooltipRef.current && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;

      tooltipRef.current.style.position = "absolute";
      tooltipRef.current.style.left = `${
        triggerRect.left + triggerRect.width / 2
      }px`;

      // Position the tooltip slightly below the reference instead of far above
      tooltipRef.current.style.top = `${triggerRect.bottom + scrollTop + 10}px`;

      // Change transform to point upward
      tooltipRef.current.style.transform = "translateX(-50%)";
    }
  }, [tooltipRef, triggerRef]);

  return (
    <div
      id={`tooltip-${refId}`}
      ref={tooltipRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="fixed z-50 w-72 p-4 text-sm bg-white dark:bg-gray-800 
                border border-gray-200 dark:border-gray-700 
                rounded-lg shadow-lg
                transition-all duration-200 ease-in-out"
      role="tooltip"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        aria-label="Close tooltip"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
        </svg>
      </button>

      {/* Sources Section */}
      {hasSources && (
        <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-xs uppercase tracking-wider mb-2 text-gray-900 dark:text-gray-100">
            Sources
          </p>
          <div className="max-h-40 overflow-y-auto custom-scrollbar">
            {researchData.sources.map((source, index) => (
              <p
                key={source.uri || index}
                className="text-gray-700 dark:text-gray-300 text-xs mb-2"
              >
                <a
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="flex items-start text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition duration-150"
                  title={source.uri}
                >
                  <span className="inline-block mr-1 mt-0.5 text-gray-400">
                    •
                  </span>
                  <span className="break-words">
                    {source.title || source.uri?.split("/")[2] || "Source Link"}
                  </span>
                </a>
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Related Searches Section */}
      {hasSuggestions && (
        <div>
          <p className="font-semibold text-xs uppercase tracking-wider mb-2 text-gray-900 dark:text-gray-100">
            Related Searches
          </p>
          <div className="text-xs text-gray-800 dark:text-gray-200 related-content">
            {/* Using a container div with specific class for styling control */}
            <div
              className="related-search-content"
              dangerouslySetInnerHTML={{
                __html: researchData.renderedContent!,
              }}
            />
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasSources && !hasSuggestions && (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
          No reference information available.
        </p>
      )}

      {/* Tooltip Arrow - now pointing up instead of down */}
      <div
        className="absolute w-3 h-3 bg-white dark:bg-gray-800 
                  border-t border-l border-gray-200 dark:border-gray-700 
                  transform rotate-45 -bottom-1.5 left-1/2 -translate-x-1/2"
      />
    </div>
  );
};

export default ReferenceTooltip;
