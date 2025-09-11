"use client";
import { ConnectionState, Track } from "livekit-client";
import {
  useConnectionState,
  useParticipants,
  useRemoteParticipant,
  useTracks,
} from "@livekit/components-react";
import OfflineVideo from "@/components/stream-player/offline-video";
import LoadingVideo from "@/components/stream-player/loading-video";
import { LiveVideo } from "@/components/stream-player/live-video";
interface VideoProps {
  hostName: string;
  hostIdentity: string;
}
const Video = ({ hostIdentity, hostName }: VideoProps) => {
  console.log("🚀 ~ Video ~ hostIdentity:", hostIdentity);
  const connectionState = useConnectionState();
  console.log("🚀 ~ Video ~ connectionState:", connectionState);

  const participant = useRemoteParticipant(`${hostIdentity}`);
  console.log("🚀 ~ Video ~ participant:", participant);

  const tracks = useTracks([
    Track.Source.Camera,
    Track.Source.Microphone,
  ]).filter((track) => track.participant.identity === `${hostIdentity}`);
  console.log("🚀 ~ Video ~ tracks:", tracks);

  let content;
  if (!participant && connectionState === ConnectionState.Connected) {
    content = <OfflineVideo username={hostName} />;
  } else if (!participant || tracks.length === 0) {
    content = <LoadingVideo label={connectionState} />;
  } else {
    content = <LiveVideo participant={participant} />;
  }
  return <div className="aspect-video border-b group relative">{content}</div>;
};

export default Video;
