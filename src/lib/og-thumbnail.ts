const OGP_IMAGE_PATTERN = /^\/ogp\/([^/]+)\.(?:avif|jpe?g|png|webp)$/i;

export function getOgThumbnailSet(
  image: string | undefined,
  fallbackWidth = 480,
) {
  const match = image?.match(OGP_IMAGE_PATTERN);

  if (!match) {
    return undefined;
  }

  const baseName = match[1];

  return {
    src: `/thumbs/ogp/${baseName}-${fallbackWidth}.webp`,
    srcset: [480, 960, 1200]
      .map((width) => `/thumbs/ogp/${baseName}-${width}.webp ${width}w`)
      .join(", "),
  };
}
