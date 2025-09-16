import { useSocket } from "@/providers/socket-provider";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

type ChatSocketProps = {
  addKey: string;
  updateKey: string;
  queryKey: string;
};

type MessageWithSender = {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  sender: {
    id: string;
    name: string;
    picture: string;
  };
};

export const useChatSocket = ({
  addKey,
  updateKey,
  queryKey,
}: ChatSocketProps) => {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.on(updateKey, (message: MessageWithSender) => {
      queryClient.setQueryData([queryKey], (oldData: any) => {
        if (!oldData || !oldData.pages || oldData.pages.length === 0) {
          return oldData;
        }

        const newPages = [...oldData.pages];
        const firstPage = newPages[0];
        const updatedItems = firstPage.items.map((item: MessageWithSender) =>
          item.id === message.id ? message : item
        );

        newPages[0] = {
          ...firstPage,
          items: updatedItems,
        };

        return {
          ...oldData,
          pages: newPages,
        };
      });
    });

    socket.on(addKey, (message: MessageWithSender) => {
      queryClient.setQueryData([queryKey], (oldData: any) => {
        // Nếu chưa có dữ liệu, khởi tạo trang đầu với item mới
        if (!oldData || !oldData.pages || oldData.pages.length === 0) {
          return {
            pages: [
              {
                items: [message],
                nextCursor: null,
              },
            ],
          };
        }

        const newPages = [...oldData.pages];
        const firstPage = newPages[0];

        // Append vào CUỐI danh sách để giữ thứ tự tăng dần (cũ -> mới)
        newPages[0] = {
          ...firstPage,
          items: [...firstPage.items, message],
        };

        return {
          ...oldData,
          pages: newPages,
        };
      });
    });

    return () => {
      socket.off(addKey);
      socket.off(updateKey);
    };
  }, [queryClient, addKey, queryKey, socket, updateKey]);
};
