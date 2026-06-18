const OGP_IMAGE_PATTERN = /^\/ogp\/([^/]+)\.(?:avif|jpe?g|png|webp)$/i;
const WALLPAPER_IMAGE_PATTERN =
  /^\/wallpaper\/([^/]+)\.(?:avif|jpe?g|png|webp)$/i;

function getLocalThumbnailSet(
  image: string | undefined,
  pattern: RegExp,
  thumbnailDir: string,
  widths: number[],
  fallbackWidth = 480,
) {
  const match = image?.match(pattern);

  if (!match) {
    return undefined;
  }

  const baseName = match[1];

  return {
    src: `/thumbs/${thumbnailDir}/${baseName}-${fallbackWidth}.webp`,
    srcset: widths
      .map(
        (width) =>
          `/thumbs/${thumbnailDir}/${baseName}-${width}.webp ${width}w`,
      )
      .join(", "),
  };
}

export function getOgThumbnailSet(
  image: string | undefined,
  fallbackWidth = 480,
) {
  return getLocalThumbnailSet(
    image,
    OGP_IMAGE_PATTERN,
    "ogp",
    [480, 960, 1200],
    fallbackWidth,
  );
}

export function getWallpaperThumbnailSet(
  image: string | undefined,
  fallbackWidth = 1200,
) {
  return getLocalThumbnailSet(
    image,
    WALLPAPER_IMAGE_PATTERN,
    "wallpaper",
    [640, 1200, 1600],
    fallbackWidth,
  );
}
