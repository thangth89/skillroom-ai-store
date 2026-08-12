export type VideoProvider = "file" | "youtube" | "facebook" | "instagram";

export type ParsedVideoSource = {
  provider: VideoProvider;
  providerLabel: string;
  embedUrl: string | null;
  posterUrl: string | null;
};

function getUrl(value: string) {
  try {
    return new URL(value, "https://skillroom.local");
  } catch {
    return null;
  }
}

function cleanHost(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");
}

function safeId(value: string | null | undefined) {
  if (!value) return null;
  return /^[a-zA-Z0-9_-]{6,30}$/.test(value) ? value : null;
}

function getYouTubeId(url: URL) {
  const host = cleanHost(url.hostname);
  if (host === "youtu.be") return safeId(url.pathname.split("/").filter(Boolean)[0]);
  if (host !== "youtube.com" && host !== "youtube-nocookie.com") return null;

  const queryId = safeId(url.searchParams.get("v"));
  if (queryId) return queryId;

  const parts = url.pathname.split("/").filter(Boolean);
  if (["shorts", "embed", "live"].includes(parts[0])) return safeId(parts[1]);
  return null;
}

function getInstagramEmbed(url: URL) {
  const parts = url.pathname.split("/").filter(Boolean);
  if (!["p", "reel", "reels", "tv"].includes(parts[0])) return null;
  const code = safeId(parts[1]);
  if (!code) return null;
  const type = parts[0] === "reels" ? "reel" : parts[0];
  return `https://www.instagram.com/${type}/${code}/embed/`;
}

export function parseVideoSource(src: string): ParsedVideoSource {
  const url = getUrl(src);
  if (!url || url.hostname === "skillroom.local") {
    return { provider: "file", providerLabel: "Result video", embedUrl: null, posterUrl: null };
  }

  const host = cleanHost(url.hostname);
  const youtubeId = getYouTubeId(url);
  if (youtubeId) {
    const params = new URLSearchParams({
      autoplay: "1",
      mute: "1",
      playsinline: "1",
      loop: "1",
      playlist: youtubeId,
      rel: "0",
      enablejsapi: "1",
    });
    return {
      provider: "youtube",
      providerLabel: "YouTube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}?${params}`,
      posterUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
    };
  }

  if (host === "facebook.com" || host === "fb.watch" || host === "fb.com") {
    const params = new URLSearchParams({
      href: url.toString(),
      show_text: "false",
      autoplay: "true",
      width: "1280",
    });
    return {
      provider: "facebook",
      providerLabel: "Facebook",
      embedUrl: `https://www.facebook.com/plugins/video.php?${params}`,
      posterUrl: null,
    };
  }

  if (host === "instagram.com") {
    const embedUrl = getInstagramEmbed(url);
    if (embedUrl) {
      return {
        provider: "instagram",
        providerLabel: "Instagram",
        embedUrl,
        posterUrl: null,
      };
    }
  }

  return { provider: "file", providerLabel: "Result video", embedUrl: null, posterUrl: null };
}
