export function getOgThumbnailSet(
  image: string | undefined,
  fallbackWidth = 480,
) {
  const name = image?.match(/^\/ogp\/([^/]+)\.(?:avif|jpe?g|png|webp)$/i)?.[1];
  if (!name) return undefined;
  const base = `/thumbs/ogp/${name}`;
  const widths = [240, 480, 960, 1200];
  const src = (width: number) => `${base}-${width}.webp`;
  return {
    src: src(fallbackWidth),
    srcset: widths.map((width) => `${src(width)} ${width}w`).join(", "),
  };
}
