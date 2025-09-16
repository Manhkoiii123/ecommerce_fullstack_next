import { useSocket } from "@/providers/socket-provider";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import qs from "query-string";

interface ChatQueryProps {
  queryKey: string;
  apiUrl: string;
  conversationId: string;
}

export const useChatQuery = ({
  queryKey,
  apiUrl,
  conversationId,
}: ChatQueryProps) => {
  const { isConnected } = useSocket();

  const fetchMessages = async ({ pageParam = undefined }) => {
    if (!conversationId) {
      // Return empty result if no conversation ID
      return { items: [], nextCursor: null };
    }

    const url = qs.stringifyUrl(
      {
        url: apiUrl,
        query: {
          cursor: pageParam,
          conversationId,
        },
      },
      { skipNull: true }
    );

    const res = await fetch(url);
    return res.json();
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: [queryKey],
      queryFn: fetchMessages,
      getNextPageParam: (lastPage) => lastPage?.nextCursor,
      refetchInterval: isConnected ? false : 1000,
    });

  return {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  };
};
