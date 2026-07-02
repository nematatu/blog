import { access, mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import translate from "google-translate-api-x";
import inquirer from "inquirer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const postsDir = path.join(rootDir, "src", "content", "blog");
const categories = ["develop", "badminton", "hobby"];

function formatDateTime(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const offsetMinutes = -date.getTimezoneOffset();
  const offsetSign = offsetMinutes >= 0 ? "+" : "-";
  const offsetHours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(
    2,
    "0",
  );
  const offsetRemainder = String(Math.abs(offsetMinutes) % 60).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetRemainder}`;
}

function sanitizeSlug(raw) {
  const trimmed = raw.trim().replaceAll(" ", "-");
  if (!trimmed) return "";
  if (trimmed.includes("..") || trimmed.includes("/") || trimmed.includes("\\"))
    return "";
  if (!/^[A-Za-z0-9-]+$/.test(trimmed)) return "";
  return trimmed;
}

function slugifyEnglishText(text) {
  const normalized = text
    .normalize("NFKD")
    .toLowerCase()
    .replaceAll("&", " and ")
    .replaceAll(/['’]/g, "")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "")
    .replaceAll(/-{2,}/g, "-");

  if (normalized) return normalized;
  return "";
}

function includesJapanese(text) {
  return /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(text);
}

async function translateTitleToEnglish(title) {
  const result = await translate(title, {
    from: "ja",
    to: "en",
    client: "gtx",
    autoCorrect: true,
  });
  return result.text;
}

async function generateSlugFromTitle(title) {
  if (!includesJapanese(title)) {
    return slugifyEnglishText(title);
  }

  try {
    const translatedTitle = await translateTitleToEnglish(title);
    return slugifyEnglishText(translatedTitle);
  } catch (error) {
    console.warn(
      `slug自動生成に失敗しました。手入力してください: ${error.message}`,
    );
    return "";
  }
}

async function listMarkdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listMarkdownFiles(fullPath)));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".md") || entry.name.endsWith(".mdx"))
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

async function promptForPost() {
  const { category, title } = await inquirer.prompt([
    {
      type: "select",
      name: "category",
      message: "category (required)",
      choices: categories,
    },
    {
      type: "input",
      name: "title",
      message: "title (required)",
      validate: (value) => (value.trim() ? true : "titleは必須です。"),
    },
  ]);

  const generatedSlug = await generateSlugFromTitle(title.trim());
  if (!generatedSlug) {
    console.warn(
      "日本語タイトルから英語slugを自動生成できませんでした。手入力してください。",
    );
  }

  const { slug: rawSlug } = await inquirer.prompt([
    {
      type: "input",
      name: "slug",
      message: "slug (required)",
      default: generatedSlug,
      filter: (value) => value.trim().replaceAll(" ", "-"),
      validate: (value) =>
        sanitizeSlug(value)
          ? true
          : "slugが不正です。英数字とハイフンのみで指定してください。",
    },
  ]);

  return {
    category,
    slug: sanitizeSlug(rawSlug),
    title: title.trim(),
    tags: [],
  };
}

async function ensureNotExists(filePath) {
  try {
    await access(filePath);
    return false;
  } catch {
    return true;
  }
}

async function findExistingPost(slug) {
  const files = await listMarkdownFiles(postsDir);
  return files.find(
    (file) =>
      path.basename(file, path.extname(file)).toLowerCase() ===
      slug.toLowerCase(),
  );
}

async function main() {
  const { category, slug, title, tags } = await promptForPost();
  const publishDate = formatDateTime();

  const categoryDir = path.join(postsDir, category);
  const filePath = path.join(categoryDir, `${slug}.md`);
  const existingPost = await findExistingPost(slug);
  if (existingPost || !(await ensureNotExists(filePath))) {
    console.error(
      `既に存在します: ${path.relative(rootDir, existingPost ?? filePath)}`,
    );
    process.exitCode = 1;
    return;
  }

  const lines = [
    "---",
    `title: "${title}"`,
    `date: "${publishDate}"`,
    "draft: true",
  ];

  if (tags.length > 0) {
    const tagList = tags.map((tag) => `"${tag}"`).join(", ");
    lines.push(`tags: [${tagList}]`);
  } else {
    lines.push("tags: []");
  }

  lines.push("---", "", "");

  await mkdir(categoryDir, { recursive: true });
  await writeFile(filePath, lines.join("\n"), "utf8");

  console.log(`作成しました: ${path.relative(rootDir, filePath)}`);
}

main().catch((error) => {
  if (error?.isTtyError) {
    console.error("この環境では対話入力ができません。");
    process.exitCode = 1;
    return;
  }
  if (error?.name === "ExitPromptError") {
    process.exitCode = 130;
    return;
  }
  console.error(error);
  process.exitCode = 1;
});
