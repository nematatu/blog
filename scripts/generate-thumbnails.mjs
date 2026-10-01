import { mkdir, readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const IMAGE_PATTERN = /\.(avif|jpe?g|png|webp)$/i;
const widths = [240, 480, 960, 1200];
const sourceDir = path.resolve("public/ogp");
const outputDir = path.resolve("public/thumbs/ogp");

async function imageFiles(dir, prefix = "") {
  return (
    await Promise.all(
      (await readdir(path.join(dir, prefix), { withFileTypes: true })).map(
        (entry) => {
          const relative = path.join(prefix, entry.name);
          return entry.isDirectory()
            ? imageFiles(dir, relative)
            : entry.isFile() && IMAGE_PATTERN.test(entry.name)
              ? relative
              : [];
        },
      ),
    )
  ).flat();
}

const sources = await imageFiles(sourceDir);
const thumbnailName = (source, width) =>
  path.join(path.dirname(source), `${path.parse(source).name}-${width}.webp`);
const expected = new Set(
  sources.flatMap((source) =>
    widths.map((width) => thumbnailName(source, width)),
  ),
);
const existing = await imageFiles(outputDir).catch(() => []);

for (const file of existing) {
  if (!expected.has(file)) await unlink(path.join(outputDir, file));
}

for (const source of sources) {
  const sourcePath = path.join(sourceDir, source);
  const metadata = await sharp(sourcePath).metadata();
  const dimensionsFor = (width) => {
    const outputWidth = Math.min(width, metadata.width);
    return {
      width: outputWidth,
      height: Math.round(outputWidth * (metadata.height / metadata.width)),
    };
  };
  const sourceStat = await stat(sourcePath);

  for (const width of widths) {
    const relativeOutput = thumbnailName(source, width);
    const outputPath = path.join(outputDir, relativeOutput);
    const dimensions = dimensionsFor(width);
    const outputMetadata = await sharp(outputPath)
      .metadata()
      .catch(() => null);
    const fresh =
      outputMetadata?.width === dimensions.width &&
      outputMetadata?.height === dimensions.height &&
      (await stat(outputPath)
        .then((outputStat) => outputStat.mtimeMs >= sourceStat.mtimeMs)
        .catch(() => false));
    if (fresh) continue;

    await mkdir(path.dirname(outputPath), { recursive: true });
    await sharp(sourcePath)
      .resize(width, undefined, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(outputPath);
  }
}
