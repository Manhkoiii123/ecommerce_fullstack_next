import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/providers/socket-provider";

type NotificationSocketProps<T> = {
  addKey: string;
  // updateKey: string;
  queryKey: string;
};

export const useNotificationSocket = <T>({
  addKey,
  queryKey,
}: NotificationSocketProps<T>) => {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    // socket.on(updateKey, (notification: T) => {
    //   queryClient.setQueryData([queryKey], (oldData: any) => {
    //     if (!oldData?.pages?.length) return oldData;

    //     const newPages = oldData.pages.map((page: any) => ({
    //       ...page,
    //       items: page.items.map((item: T & { id: string }) =>
    //         item.id === (notification as any).id ? notification : item
    //       ),
    //     }));

    //     return { ...oldData, pages: newPages };
    //   });
    // });

    socket.on(addKey, (notification: T) => {
      const newQueryKey = queryKey.split(":").slice(1);
      queryClient.setQueryData([queryKey, ...newQueryKey], (oldData: any) => {
        if (!oldData?.pages?.length) {
          return { pages: [{ items: [notification] }] };
        }

        const newPages = [...oldData.pages];
        newPages[0] = {
          ...newPages[0],
          items: [notification, ...newPages[0].items],
          unreadCount: (newPages[0].unreadCount || 0) + 1,
        };

        return { ...oldData, pages: newPages };
      });
    });

    return () => {
      socket.off(addKey);
      // socket.off(updateKey);
    };
  }, [socket, queryClient, addKey, queryKey]);
  // }, [socket, queryClient, addKey, updateKey, queryKey]);
};
