"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseVideoSource } from "@/lib/video-source";

type VideoPreviewProps = {
  id: string;
  src: string;
  label: string;
  accent: string;
  accentSoft: string;
  className?: string;
  detail?: boolean;
};

export function VideoPreview({ id, src, label, accent, accentSoft, className = "", detail = false }: VideoPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const source = useMemo(() => parseVideoSource(src), [src]);
  const isFile = source.provider === "file";

  const pause = (reset = false) => {
    if (!isFile) {
      setPlaying(false);
      setMuted(true);
      return;
    }

    const video = videoRef.current;
    if (!video) return;
    video.pause();
    if (reset) video.currentTime = 0;
    setPlaying(false);
  };

  const play = async () => {
    window.dispatchEvent(new CustomEvent("skill-preview-play", { detail: id }));

    if (!isFile) {
      setPlaying(true);
      return;
    }

    const video = videoRef.current;
    if (!video) return;
    try {
      await video.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  };

  const toggleSound = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);

    if (source.provider === "youtube") {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: nextMuted ? "mute" : "unMute", args: [] }),
        "https://www.youtube-nocookie.com",
      );
    }
  };

  useEffect(() => {
    const stopOther = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      if (customEvent.detail !== id) pause(false);
    };
    window.addEventListener("skill-preview-play", stopOther);
    return () => window.removeEventListener("skill-preview-play", stopOther);
  }, [id]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || detail || !window.matchMedia("(pointer: coarse)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.6) void play();
        else pause(false);
      },
      { threshold: [0, 0.35, 0.6, 0.85] },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [detail, id]);

  return (
    <div
      ref={containerRef}
      className={`video-frame ${detail ? "video-frame-detail" : ""} ${className}`}
      style={{
        "--accent": accent,
        "--accent-soft": accentSoft,
        ...(source.posterUrl
          ? {
              backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.05), rgba(0,0,0,.55)), url(${source.posterUrl})`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }
          : {}),
      } as React.CSSProperties}
      onMouseEnter={() => !detail && void play()}
      onMouseLeave={() => !detail && pause(true)}
    >
      {isFile ? (
        <video
          ref={videoRef}
          muted={muted}
          loop
          playsInline
          preload="metadata"
          aria-label={`Video kết quả ${label}`}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        >
          <source src={src} />
        </video>
      ) : null}
      {!isFile && playing && source.embedUrl ? (
        <iframe
          ref={iframeRef}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          aria-label={`${source.providerLabel}: ${label}`}
          loading="lazy"
          src={source.provider === "youtube" ? `${source.embedUrl}&controls=${detail ? "1" : "0"}` : source.embedUrl}
          title={`${source.providerLabel}: ${label}`}
        />
      ) : null}
      <div className="video-vignette" />
      <span className="video-badge">{source.providerLabel}</span>
      {!playing && (
        <button className="play-button" type="button" onClick={() => void play()} aria-label={`Phát video ${label}`}>
          <span aria-hidden="true">▶</span>
        </button>
      )}
      {playing && (isFile || source.provider === "youtube") && (
        <button
          className="sound-button"
          type="button"
          onClick={toggleSound}
          aria-label={muted ? "Bật âm thanh" : "Tắt âm thanh"}
        >
          {muted ? "Tắt tiếng" : "Có tiếng"}
        </button>
      )}
      <div className="video-label">
        <span>{label}</span>
        <small>{playing ? (source.provider === "instagram" ? "Chạm để phát" : "Đang phát") : detail ? "Nhấn để xem" : "Di chuột để xem"}</small>
      </div>
    </div>
  );
}
