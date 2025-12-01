"use client";
import { Tv } from "lucide-react";
import { useRouter } from "next/navigation";

const LiveButton = ({ isLive }: { isLive: boolean }) => {
  const router = useRouter();
  const handleRedirectToLive = () => {
    router.push(`/live`);
  };
  return (
    <div
      className="mb-1.5 cursor-pointer relative"
      onClick={handleRedirectToLive}
    >
      <Tv />
      {isLive && (
        <div className="absolute top-[-40%] left-[80%] !w-3 !h-3 rounded-full bg-red-600" />
      )}
    </div>
  );
};

export default LiveButton;
