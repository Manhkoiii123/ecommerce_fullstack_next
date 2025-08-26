import qs from "query-string";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSocket } from "@/providers/socket-provider";

interface NotificationQueryProps {
  queryKey: string;
  apiUrl: string;
  filterKey: "userId" | "storeUrl";
  filterValue: string;
}

export const useNotificationQuery = ({
  queryKey,
  apiUrl,
  filterKey,
  filterValue,
}: NotificationQueryProps) => {
  const { isConnected } = useSocket();

  const fetchNotifications = async ({ pageParam = undefined }) => {
    const url = qs.stringifyUrl(
      {
        url: apiUrl,
        query: {
          cursor: pageParam,
          [filterKey]: filterValue,
        },
      },
      { skipNull: true }
    );

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Failed to fetch notifications");
    }
    return res.json();
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: [queryKey, filterKey, filterValue],
      queryFn: fetchNotifications,
      getNextPageParam: (lastPage) => lastPage?.nextCursor,
      refetchInterval: false, // auto refetch nếu socket mất kết nối
    });

  return {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  };
};
