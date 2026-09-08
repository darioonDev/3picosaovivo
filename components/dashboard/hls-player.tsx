"use client";

import { useEffect, useRef } from "react";

/**
 * Plays an HLS (.m3u8) live stream via hls.js wherever the browser has Media
 * Source Extensions (Chrome, Firefox, desktop Safari); iOS Safari falls back
 * to native HLS. hls.js is imported on demand so its weight never lands in the
 * initial bundle. Mirrors the Sentinela (camera-24h) player.
 *
 * hls.js is pinned to 1.5.17 (do not bump past 1.6/1.7 without retesting live
 * playback — newer versions stall live-edge streams). Chrome reports
 * canPlayType("application/vnd.apple.mpegurl") === "maybe" but cannot actually
 * play HLS natively, so try hls.js FIRST.
 */
export function HlsPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    let hls: import("hls.js").default | null = null;

    import("hls.js").then(({ default: Hls }) => {
      if (cancelled) return;
      if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(src);
        hls.attachMedia(video);
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
      }
    });

    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 h-full w-full object-cover"
      autoPlay
      muted
      playsInline
    />
  );
}
