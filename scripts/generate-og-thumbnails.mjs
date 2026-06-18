import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sourceDir = path.resolve("public/ogp");
const outputDir = path.resolve("public/thumbs/ogp");
const widths = [480, 960, 1200];

await mkdir(outputDir, { recursive: true });

const files = await readdir(sourceDir, { withFileTypes: true });

for (const file of files) {
  if (!file.isFile() || !/\.(avif|jpe?g|png|webp)$/i.test(file.name)) {
    continue;
  }

  const sourcePath = path.join(sourceDir, file.name);
  const parsed = path.parse(file.name);
  const sourceStat = await stat(sourcePath);

  for (const width of widths) {
    const outputPath = path.join(outputDir, `${parsed.name}-${width}.webp`);
    const outputIsFresh = await stat(outputPath)
      .then((outputStat) => outputStat.mtimeMs >= sourceStat.mtimeMs)
      .catch(() => false);

    if (outputIsFresh) {
      continue;
    }

    await sharp(sourcePath)
      .resize(width, Math.round((width * 9) / 16), {
        fit: "cover",
        position: "attention",
      })
      .webp({ quality: 78 })
      .toFile(outputPath);
  }
}
