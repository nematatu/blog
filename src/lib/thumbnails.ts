export function getOgThumbnailSet(
  image: string | undefined,
  fallbackWidth = 480,
) {
  const name = image?.match(/^\/ogp\/([^/]+)\.(?:avif|jpe?g|png|webp)$/i)?.[1];
  const generated = image?.match(/^\/og-image\/(blog|projects)\/(.+)\.png$/);
  if (!name && !generated) return undefined;
  const base = name
    ? `/thumbs/ogp/${name}`
    : `/thumbs/og-image/${generated?.[1]}/${generated?.[2]}`;
  const widths = [240, 480, 960, 1200];
  const src = (width: number) => `${base}-${width}.webp`;
  return {
    src: src(fallbackWidth),
    srcset: widths.map((width) => `${src(width)} ${width}w`).join(", "),
  };
}
