const OGP_SOURCE = /^\/ogp\/([^/]+)\.(?:avif|jpe?g|png|webp)$/i;

// public/ogp の画像名。scripts/generate-thumbnails.mjs が作る派生画像の名前に使う。
export const ogImageName = (src: string) => src.match(OGP_SOURCE)?.[1];

// SNS のカード用に軽くした画像。元画像は大きすぎて、サービス側の上限を超えることがある。
export const socialImage = (src: string) => {
  const name = ogImageName(src);
  return name ? `/thumbs/ogp/${name}-social.jpg` : src;
};
