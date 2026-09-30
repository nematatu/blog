import { readdir } from "node:fs/promises";
import path from "node:path";

export async function listMarkdownFiles(dir, excludedDirectories = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  const paths = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !excludedDirectories.includes(entry.name))
        return listMarkdownFiles(fullPath, excludedDirectories);
      return entry.isFile() &&
        (entry.name.endsWith(".md") || entry.name.endsWith(".mdx"))
        ? [fullPath]
        : [];
    }),
  );
  return paths.flat();
}
