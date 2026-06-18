import { mkdir, readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const IMAGE_PATTERN = /\.(avif|jpe?g|png|webp)$/i;
const tasks = [
  {
    sourceDir: "public/ogp",
    outputDir: "public/thumbs/ogp",
    widths: [480, 960, 1200],
    ratio: 9 / 16,
    quality: 78,
  },
  {
    sourceDir: "public/wallpaper",
    outputDir: "public/thumbs/wallpaper",
    widths: [640, 1200, 1600],
    ratio: 1 / 2,
    quality: 72,
  },
];

async function generateThumbnails(task) {
  const sourceDir = path.resolve(task.sourceDir);
  const outputDir = path.resolve(task.outputDir);

  await mkdir(outputDir, { recursive: true });

  const sourceFiles = (
    await readdir(sourceDir, { withFileTypes: true })
  ).filter((file) => file.isFile() && IMAGE_PATTERN.test(file.name));
  const expectedThumbnails = new Set(
    sourceFiles.flatMap((file) => {
      const baseName = path.parse(file.name).name;
      return task.widths.map((width) => `${baseName}-${width}.webp`);
    }),
  );

  for (const file of await readdir(outputDir, { withFileTypes: true })) {
    if (file.isFile() && !expectedThumbnails.has(file.name)) {
      await unlink(path.join(outputDir, file.name));
    }
  }

  for (const file of sourceFiles) {
    const sourcePath = path.join(sourceDir, file.name);
    const baseName = path.parse(file.name).name;
    const sourceStat = await stat(sourcePath);

    for (const width of task.widths) {
      const outputPath = path.join(outputDir, `${baseName}-${width}.webp`);
      const outputIsFresh = await stat(outputPath)
        .then((outputStat) => outputStat.mtimeMs >= sourceStat.mtimeMs)
        .catch(() => false);

      if (outputIsFresh) {
        continue;
      }

      await sharp(sourcePath)
        .resize(width, Math.round(width * task.ratio), {
          fit: "cover",
          position: "attention",
        })
        .webp({ quality: task.quality })
        .toFile(outputPath);
    }
  }
}

for (const task of tasks) {
  await generateThumbnails(task);
}
