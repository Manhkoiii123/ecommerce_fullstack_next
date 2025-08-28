import { useState, useEffect } from "react";

interface ReviewPermissionResponse {
  canReview: boolean;
  message: string;
}

export function useReviewPermission(productId: string | null) {
  const [canReview, setCanReview] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!productId) {
      setCanReview(false);
      return;
    }

    const checkPermission = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/reviews/check-permission", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId }),
        });

        if (!response.ok) {
          throw new Error("Failed to check review permission");
        }

        const data: ReviewPermissionResponse = await response.json();
        setCanReview(data.canReview);
        setMessage(data.message);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setCanReview(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPermission();
  }, [productId]);

  return {
    canReview,
    isLoading,
    error,
    message,
    refetch: () => {
      if (productId) {
        const checkPermission = async () => {
          setIsLoading(true);
          setError(null);

          try {
            const response = await fetch("/api/reviews/check-permission", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ productId }),
            });

            if (!response.ok) {
              throw new Error("Failed to check review permission");
            }

            const data: ReviewPermissionResponse = await response.json();
            setCanReview(data.canReview);
            setMessage(data.message);
          } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
            setCanReview(false);
          } finally {
            setIsLoading(false);
          }
        };

        checkPermission();
      }
    },
  };
}
