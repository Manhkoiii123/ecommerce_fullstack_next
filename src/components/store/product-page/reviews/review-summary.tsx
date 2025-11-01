"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ReviewSummaryProps {
  productId: string;
  totalReviews: number;
}

const ReviewSummary = ({ productId, totalReviews }: ReviewSummaryProps) => {
  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isCached, setIsCached] = useState<boolean>(false);

  useEffect(() => {
    // Auto-load summary if there are reviews
    if (totalReviews > 0) {
      handleGenerateSummary();
    }
  }, [productId, totalReviews]);

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/generate-review-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate summary");
      }

      setSummary(data.summary);
      setIsCached(data.cached);
      setIsVisible(true);

      if (!data.cached) {
        toast.success("Review summary generated!");
      }
    } catch (error: any) {
      toast.error("Failed to generate summary", {
        description: error.message,
      });
      setIsVisible(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (totalReviews === 0) {
    return null;
  }

  if (!isVisible && !isLoading) {
    return (
      <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-main-primary flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              AI Review Summary
            </h3>
            <p className="text-sm text-main-secondary mt-1">
              Get instant insights from {totalReviews} customer reviews
            </p>
          </div>
          <Button
            onClick={handleGenerateSummary}
            disabled={isLoading}
            variant="default"
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Generate Summary
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-main-primary">
            AI Review Summary
          </h3>
          {isCached && (
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
              Cached
            </span>
          )}
        </div>
        <Button
          onClick={handleGenerateSummary}
          disabled={isLoading}
          variant="ghost"
          size="sm"
          className="gap-2 h-8"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/6"></div>
        </div>
      ) : (
        <>
          <p className="text-main-primary leading-relaxed">{summary}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-main-secondary">
            <span className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Summary based on {totalReviews} customer reviews
            </span>
            <span className="text-blue-500">• Powered by AI</span>
          </div>
        </>
      )}
    </div>
  );
};

export default ReviewSummary;
