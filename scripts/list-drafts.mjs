import { readFile } from "node:fs/promises";
import path from "node:path";
import { listMarkdownFiles } from "./post-files.mjs";
import { parseFrontmatter } from "./post-frontmatter.mjs";

const rootDir = path.resolve(import.meta.dirname, "..");
const postsDir = path.join(rootDir, "src", "content", "blog");

function slugFromFile(file) {
	return path
		.relative(postsDir, file)
		.replace(/\.(md|mdx)$/i, "")
		.replaceAll(path.sep, "/");
}

async function getDraftPosts() {
	const files = await listMarkdownFiles(postsDir, ["archive"]);
	const posts = [];

	for (const file of files) {
		const contents = await readFile(file, "utf8");
		const frontmatter = parseFrontmatter(contents);
		if (frontmatter.draft?.toLowerCase() !== "true") continue;

		posts.push({
			title: frontmatter.title || "(no title)",
			date: frontmatter.date?.split("T")[0] ?? "-",
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
	const headers = ["date", "slug", "title", "path"];
	const rows = [headers, ...posts.map((post) => [
		post.date,
		post.slug,
		post.title,
		post.path,
	])];
	const maxWidths = [10, 36, 32, 56];
	const widths = headers.map((_, column) =>
		Math.min(
			maxWidths[column],
			Math.max(...rows.map((row) => stringWidth(row[column]))),
		),
	);
	const formatCell = (value, width) => {
		const text = stringWidth(value) > width
			? `${sliceByWidth(value, width - 3)}...`
			: value;
		return padEndByWidth(text, width);
	};

	console.log(headers.map((header, column) => formatCell(header, widths[column])).join("  "));
	console.log(widths.map((width) => "-".repeat(width)).join("  "));

	for (const row of rows.slice(1)) {
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
