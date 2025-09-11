"use client";

import { Participant, Track } from "livekit-client";
import { useEffect, useRef, useState } from "react";
import { useTracks } from "@livekit/components-react";
import { useEventListener } from "usehooks-ts";
import FullscreenControl from "@/components/stream-player/fullscreen-control";
import VolumnControl from "@/components/stream-player/volumn-control";
interface LiveVideoProps {
  participant: Participant ;
}
export const LiveVideo = ({ participant }: LiveVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volumn, setVolumn] = useState(0);
  const toggleFull = () => {
    if (isFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    } else if (wrapperRef?.current) {
      wrapperRef.current.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  const onValueChange = (value: number) => {
    setVolumn(+value);
    if (videoRef.current) {
      videoRef.current.muted = value === 0;
      videoRef.current.volume = +value / 100;
    }
  };
  const toggleMuted = () => {
    const isMuted = volumn === 0;
    setVolumn(isMuted ? 50 : 0);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      videoRef.current.volume = isMuted ? 0.5 : 0;
    }
  };
  useEffect(() => {
    onValueChange(0);
  }, []);
  useTracks([Track.Source.Camera, Track.Source.Microphone])
    .filter((track) => track.participant.identity === participant.identity)
    .forEach((track) => {
      if (videoRef.current) {
        track.publication.track?.attach(videoRef.current);
      }
    });
  const handleFullScreenChange = () => {
    const isCurrentlyFull = document.fullscreenElement !== null;
    setIsFullscreen(isCurrentlyFull);
  };
  useEventListener("fullscreenchange", handleFullScreenChange, wrapperRef);
  return (
    <div ref={wrapperRef} className="relative h-full flex">
      <video width={"100%"} ref={videoRef} />
      <div className="absolute top-0 h-full w-full opacity-0 hover:opacity-100 hover:transition-all">
        <div className="absolute bottom-0 flex h-14 w-full items-center justify-between bg-gradient-to-r from-neutral-900 px-4">
          <VolumnControl
            onChange={onValueChange}
            value={volumn}
            onToggle={toggleMuted}
          />
          <FullscreenControl
            isFullscreen={isFullscreen}
            onToggle={toggleFull}
          />
        </div>
      </div>
    </div>
  );
};
