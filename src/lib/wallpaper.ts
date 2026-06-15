import { readdirSync } from "node:fs";
import path from "node:path";

const IMAGE_EXTENSION_PATTERN = /\.(?:avif|webp|png|jpe?g)$/i;

let wallpapers: string[] | undefined;

export function getWallpapers() {
  if (wallpapers) return wallpapers;

  const wallpaperDir = path.join(process.cwd(), "public", "wallpaper");
  wallpapers = readdirSync(wallpaperDir)
    .filter((filename) => IMAGE_EXTENSION_PATTERN.test(filename))
    .sort()
    .map((filename) => `/wallpaper/${filename}`);

  return wallpapers;
}

export function getRandomWallpaper() {
  const candidates = getWallpapers();
  if (candidates.length === 0) return "/DSC_0098.webp";

  return candidates[Math.floor(Math.random() * candidates.length)];
}
