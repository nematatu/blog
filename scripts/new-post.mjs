import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const postsDir = path.join(rootDir, "src", "content", "post");

const rl = readline.createInterface({ input, output });

function formatDate(date = new Date()) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

async function ask(question, { required = false, defaultValue = "" } = {}) {
	const suffix = defaultValue ? ` (default: ${defaultValue})` : "";
	while (true) {
		const questionMessage = required
			? `${question} (${required ? "required" : ""})${suffix}: `
			: question;
		const answer = (await rl.question(questionMessage)).trim();
		if (answer) return answer;
		if (!answer && defaultValue) return defaultValue;
		if (!required) return "";
	}
}

function sanitizeSlug(raw) {
	const trimmed = raw.trim().replaceAll(" ", "-");
	if (!trimmed) return "";
	if (trimmed.includes("..") || trimmed.includes("/") || trimmed.includes("\\")) return "";
	return trimmed;
}

async function main() {
	const rawSlug = await ask("slug", { required: true });
	const slug = sanitizeSlug(rawSlug);
	if (!slug) {
		console.error("slugが不正です。英数字とハイフンのみで指定してください。");
		process.exit(1);
	}

	const title = await ask("title", { required: true });
	const description = await ask("description");
	const publishDate = formatDate();
	const tagInput = await ask("tags（comma separated）");

	let coverSrc = "";
	let coverAlt = "";

	const tags = tagInput
		.split(",")
		.map((t) => t.trim())
		.filter(Boolean);

	const lines = [
		"---",
		`title: "${title}"`,
		...(description ? [`description: "${description}"`] : []),
		`publishDate: "${publishDate}"`,
    `draft: true`,
	];

	if (tags.length > 0) {
		const tagList = tags.map((t) => `"${t}"`).join(", ");
		lines.push(`tags: [${tagList}]`);
	} else {
		lines.push("tags: []");
	}

	lines.push("---", "", "");

	const filePath = path.join(postsDir, `${slug}.md`);
	await writeFile(filePath, lines.join("\n"), "utf8");

	console.log(`作成しました: ${path.relative(rootDir, filePath)}`);
}

try {
	await main();
} finally {
	rl.close();
}
