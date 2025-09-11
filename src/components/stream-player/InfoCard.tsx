"use client";

import InfoModal from "@/components/stream-player/InfoModal";
import { Separator } from "@/components/ui/separator";
import { Pencil } from "lucide-react";
import Image from "next/image";

interface InfoCardProps {
  hostIdentity: string;
  viewerIdentity: string;
  name: string;
  thumbnailUrl: string | null;
}
const InfoCard = ({
  hostIdentity,
  name,
  thumbnailUrl,
  viewerIdentity,
}: InfoCardProps) => {
  const hostAsViewer = `host-${hostIdentity}`;
  const isHost = viewerIdentity === hostAsViewer;
  if (!isHost) return null;
  return (
    <div className="px-4 border-gray-100 border-2">
      <div className="rounded-xl ">
        <div className="flex items-center gap-x-2.5 p-4">
          <div className="rounded-md  p-2 h-auto w-auto">
            <Pencil className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm lg:text-lg font-semibold capitalize">
              Edit your stream info
            </h2>
            <p className="text-muted-foreground text-xs lg:text-sm">
              Maximize your visibility
            </p>
          </div>
          <InfoModal initialName={name} initialThumbnailUrl={thumbnailUrl} />
        </div>
        <Separator />
        <div className="p-4 lg:p-6 space-y-4">
          <div>
            <h3 className="text-sm text-muted-foreground mb-2">Name</h3>
            <p className="text-sm font-semibold">{name}</p>
          </div>
          <div>
            <h3 className="text-sm text-muted-foreground mb-2">Thumbnail</h3>
            <p className="text-sm font-semibold">
              {thumbnailUrl && (
                <div className="relative aspect-video rounded-md overflow-hidden w-[200px] border border-white/10">
                  <Image src={thumbnailUrl} alt="thumbnail" fill />
                </div>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoCard;
