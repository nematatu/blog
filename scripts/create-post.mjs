import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import translate from "google-translate-api-x";
import inquirer from "inquirer";
import { listMarkdownFiles } from "./post-files.mjs";

const rootDir = path.resolve(import.meta.dirname, "..");
const postsDir = path.join(rootDir, "src", "content", "blog");
const categories = ["develop", "badminton", "hobby"];

function formatDateTime(date = new Date()) {
  const two = (value) => String(value).padStart(2, "0");
  const year = date.getFullYear();
  const offsetMinutes = -date.getTimezoneOffset();
  const offsetSign = offsetMinutes >= 0 ? "+" : "-";
  const offset = Math.abs(offsetMinutes);
  return `${year}-${two(date.getMonth() + 1)}-${two(date.getDate())}T${two(date.getHours())}:${two(date.getMinutes())}:${two(date.getSeconds())}${offsetSign}${two(Math.floor(offset / 60))}${two(offset % 60)}`;
}

function sanitizeSlug(raw) {
  const trimmed = raw.trim().replaceAll(" ", "-");
  return /^[A-Za-z0-9-]+$/.test(trimmed) ? trimmed : "";
}

function slugifyEnglishText(text) {
  return text
    .normalize("NFKD")
    .toLowerCase()
    .replaceAll("&", " and ")
    .replaceAll(/['’]/g, "")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
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
  if (!includesJapanese(title)) return slugifyEnglishText(title);

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
  };
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
  const { category, slug, title } = await promptForPost();
  const publishDate = formatDateTime();

  const categoryDir = path.join(postsDir, category);
  const filePath = path.join(categoryDir, `${slug}.md`);
  const existingPost = await findExistingPost(slug);
  if (existingPost) {
    console.error(`既に存在します: ${path.relative(rootDir, existingPost)}`);
    process.exitCode = 1;
    return;
  }

  await mkdir(categoryDir, { recursive: true });
  await writeFile(
    filePath,
    [
      "---",
      `title: ${JSON.stringify(title)}`,
      `date: "${publishDate}"`,
      "draft: true",
      "tags: []",
      "---",
      "",
      "",
    ].join("\n"),
    { flag: "wx" },
  );

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
