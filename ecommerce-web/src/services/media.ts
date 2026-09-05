const apiOrigin = import.meta.env.VITE_API_ORIGIN || "https://localhost:7090";

export function assetUrl(url?: string | null) {
  if (!url) return "/src/assets/dexora-hero-3.png";
  if (url.includes("example.com")) return "/src/assets/dexora-hero-3.png";
  if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:")) return url;
  return `${apiOrigin}${url.startsWith("/") ? url : `/${url}`}`;
}