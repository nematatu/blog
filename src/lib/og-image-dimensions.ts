import path from "node:path";
import sharp from "sharp";

// Read the frontmatter image itself, including older images with different ratios.
// This runs on the server, so the browser can reserve the correct space immediately.
export async function getOgImageDimensions(src: string) {
  if (!/^\/ogp\/[^/]+\.(?:avif|jpe?g|png|webp)$/i.test(src)) {
    return undefined;
  }

  const { width, height } = await sharp(
    path.resolve("public", src.slice(1)),
  ).metadata();

  return { width, height };
}
