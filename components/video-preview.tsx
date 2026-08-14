"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseVideoSource } from "@/lib/video-source";
import type { StoreLocale } from "@/lib/locale";

type VideoPreviewProps = {
  id: string;
  src: string;
  label: string;
  accent: string;
  accentSoft: string;
  className?: string;
  detail?: boolean;
  locale?: StoreLocale;
};

export function VideoPreview({ id, src, label, accent, accentSoft, className = "", detail = false, locale = "en" }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activated, setActivated] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const source = useMemo(() => parseVideoSource(src), [src]);
  const isFile = source.provider === "file";

  const pause = (reset = false) => {
    if (!isFile) {
      setActivated(false);
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

    if (!activated) {
      setActivated(true);
      setPlaying(true);
      return;
    }

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
    if (!activated || !isFile) return;
    const video = videoRef.current;
    if (!video) return;
    video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [activated, isFile]);

  return (
    <div
      data-active={activated ? "true" : "false"}
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
    >
      {isFile && activated ? (
        <video
          ref={videoRef}
          muted={muted}
          controls
          playsInline
          preload="none"
          aria-label={locale === "vi" ? `Video kết quả của ${label}` : `Result video for ${label}`}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        >
          <source src={src} />
        </video>
      ) : null}
      {!isFile && activated && source.embedUrl ? (
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
        <button className="play-button" type="button" onClick={() => void play()} aria-label={locale === "vi" ? `Phát video của ${label}` : `Play video for ${label}`}>
          <span aria-hidden="true">▶</span><b>{locale === "vi" ? "Xem video" : "Watch video"}</b>
        </button>
      )}
      {playing && (isFile || source.provider === "youtube") && (
        <button
          className="sound-button"
          type="button"
          onClick={toggleSound}
          aria-label={muted ? (locale === "vi" ? "Bật âm thanh" : "Turn sound on") : (locale === "vi" ? "Tắt âm thanh" : "Mute video")}
        >
          {muted ? (locale === "vi" ? "Đang tắt tiếng" : "Muted") : (locale === "vi" ? "Đã bật tiếng" : "Sound on")}
        </button>
      )}
      <div className="video-label">
        <span>{label}</span>
        <small>{playing ? (source.provider === "instagram" ? (locale === "vi" ? "Chạm để phát" : "Tap to play") : (locale === "vi" ? "Đang phát" : "Now playing")) : (locale === "vi" ? "Bấm để xem" : "Click to watch")}</small>
      </div>
    </div>
  );
}
