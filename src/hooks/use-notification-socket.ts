import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/providers/socket-provider";

type NotificationSocketProps<T> = {
  addKey: string;
  updateKey: string;
  queryKey: string;
};

export const useNotificationSocket = <T>({
  addKey,
  updateKey,
  queryKey,
}: NotificationSocketProps<T>) => {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    socket.on(updateKey, (notification: T) => {
      queryClient.setQueryData([queryKey], (oldData: any) => {
        if (!oldData?.pages?.length) return oldData;

        const newPages = oldData.pages.map((page: any) => ({
          ...page,
          items: page.items.map((item: T & { id: string }) =>
            item.id === (notification as any).id ? notification : item
          ),
        }));

        return { ...oldData, pages: newPages };
      });
    });

    socket.on(addKey, (notification: T) => {
      queryClient.setQueryData([queryKey], (oldData: any) => {
        if (!oldData?.pages?.length) {
          return { pages: [{ items: [notification] }] };
        }

        const newPages = [...oldData.pages];
        newPages[0] = {
          ...newPages[0],
          items: [notification, ...newPages[0].items],
        };

        return { ...oldData, pages: newPages };
      });
    });

    return () => {
      socket.off(addKey);
      socket.off(updateKey);
    };
  }, [socket, queryClient, addKey, updateKey, queryKey]);
};
