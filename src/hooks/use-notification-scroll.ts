import { useEffect } from "react";

type NotificationScrollProps = {
  chatRef: React.RefObject<HTMLDivElement>;
  shouldLoadMore: boolean;
  loadMore: () => void;
  isOpen: boolean;
};

export const useNotificationScroll = ({
  chatRef,
  shouldLoadMore,
  loadMore,
  isOpen,
}: NotificationScrollProps) => {
  useEffect(() => {
    if (!isOpen) return;
    const div = chatRef.current;
    if (!div) return;

    const handleScroll = () => {
      if (!shouldLoadMore) return;

      const distanceFromBottom =
        div.scrollTop + div.clientHeight - div.scrollHeight;

      if (distanceFromBottom >= -15) {
        loadMore();
      }
    };

    div.addEventListener("scroll", handleScroll);

    return () => div.removeEventListener("scroll", handleScroll);
  }, [chatRef, shouldLoadMore, loadMore, isOpen]);
};
