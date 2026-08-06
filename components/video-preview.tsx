"use client";

import { useEffect, useRef, useState } from "react";

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
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  const pause = (reset = false) => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    if (reset) video.currentTime = 0;
    setPlaying(false);
  };

  const play = async () => {
    const video = videoRef.current;
    if (!video) return;
    window.dispatchEvent(new CustomEvent("skill-preview-play", { detail: id }));
    try {
      await video.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
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
      style={{ "--accent": accent, "--accent-soft": accentSoft } as React.CSSProperties}
      onMouseEnter={() => !detail && void play()}
      onMouseLeave={() => !detail && pause(true)}
    >
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
        <source src={src} type="video/mp4" />
      </video>
      <div className="video-vignette" />
      <span className="video-badge">Video kết quả</span>
      {!playing && (
        <button className="play-button" type="button" onClick={() => void play()} aria-label={`Phát video ${label}`}>
          <span aria-hidden="true">▶</span>
        </button>
      )}
      {playing && (
        <button
          className="sound-button"
          type="button"
          onClick={() => setMuted((value) => !value)}
          aria-label={muted ? "Bật âm thanh" : "Tắt âm thanh"}
        >
          {muted ? "Tắt tiếng" : "Có tiếng"}
        </button>
      )}
      <div className="video-label">
        <span>{label}</span>
        <small>{playing ? "Đang phát" : detail ? "Nhấn để xem" : "Di chuột để xem"}</small>
      </div>
    </div>
  );
}
