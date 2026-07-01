import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const postsDir = path.join(rootDir, "src", "content", "blog");

async function listMarkdownFiles(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.name === "archive") continue;
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

function stripQuotes(value) {
	return value.replace(/^['"]|['"]$/g, "").trim();
}

function parseFrontmatter(contents) {
	const lines = contents.split(/\r?\n/);
	if (lines[0]?.trim() !== "---") return {};

	const data = {};
	for (let index = 1; index < lines.length; index += 1) {
		const trimmed = lines[index].trim();
		if (trimmed === "---") break;
		if (!trimmed || trimmed.startsWith("#")) continue;

		const match = trimmed.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
		if (!match) continue;

		data[match[1]] = stripQuotes(match[2]);
	}
	return data;
}

function isDraft(value) {
	return value?.toLowerCase() === "true";
}

function formatDate(value) {
	if (!value) return "-";
	return value.split("T")[0];
}

function slugFromFile(file) {
	return path
		.relative(postsDir, file)
		.replace(/\.(md|mdx)$/i, "")
		.split(path.sep)
		.join("/");
}

async function getDraftPosts() {
	const files = await listMarkdownFiles(postsDir);
	const posts = [];

	for (const file of files) {
		const contents = await readFile(file, "utf8");
		const frontmatter = parseFrontmatter(contents);
		if (!isDraft(frontmatter.draft)) continue;

		posts.push({
			title: frontmatter.title || "(no title)",
			date: formatDate(frontmatter.date),
			slug: slugFromFile(file),
			path: path.relative(rootDir, file),
		});
	}

	return posts.sort((a, b) => b.date.localeCompare(a.date));
}

function characterWidth(character) {
	return character.match(/[^\x00-\x7F]/) ? 2 : 1;
}

function stringWidth(value) {
	return Array.from(value).reduce(
		(width, character) => width + characterWidth(character),
		0,
	);
}

function sliceByWidth(value, maxWidth) {
	let width = 0;
	let result = "";
	for (const character of Array.from(value)) {
		const nextWidth = width + characterWidth(character);
		if (nextWidth > maxWidth) break;
		result += character;
		width = nextWidth;
	}
	return result;
}

function padEndByWidth(value, width) {
	return value + " ".repeat(Math.max(0, width - stringWidth(value)));
}

function printTable(posts) {
	const rows = posts.map((post) => [
		post.date,
		post.slug,
		post.title,
		post.path,
	]);
	const headers = ["date", "slug", "title", "path"];
	const maxWidths = [10, 36, 32, 56];
	const widths = headers.map((header, column) =>
		Math.min(
			maxWidths[column],
			Math.max(
				stringWidth(header),
				...rows.map((row) => stringWidth(row[column])),
			),
		),
	);
	const formatCell = (value, width) => {
		if (stringWidth(value) > width) {
			return padEndByWidth(`${sliceByWidth(value, width - 3)}...`, width);
		}
		return padEndByWidth(value, width);
	};

	console.log(
		headers
			.map((header, column) => formatCell(header, widths[column]))
			.join("  "),
	);
	console.log(widths.map((width) => "-".repeat(width)).join("  "));

	for (const row of rows) {
		console.log(
			row.map((value, column) => formatCell(value, widths[column])).join("  "),
		);
	}
}

async function main() {
	const posts = await getDraftPosts();
	if (posts.length === 0) {
		console.log("draft: true の記事はありません。");
		return;
	}

	printTable(posts);
	console.log("\n" + posts.length + "件のdraft記事があります。");
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
