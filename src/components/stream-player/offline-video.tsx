import { WifiOff } from "lucide-react";
interface OfflineVideoProps {
  username: string;
}
const OfflineVideo = ({ username }: OfflineVideoProps) => {
  return (
    <div className="h-full flex flex-col space-y-4 justify-center items-center">
      <WifiOff className="w-10 h-10 text-muted-foreground" />
      <p className="text-center text-sm text-muted-foreground">
        {username} is offline
      </p>
    </div>
  );
};

export default OfflineVideo;
