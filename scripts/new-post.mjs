import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";
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
		const answer = await new Promise((resolve) => {
			rl.question(questionMessage, (value) => resolve(value));
		});
		const trimmed = answer.trim();
		if (trimmed) return trimmed;
		if (!trimmed && defaultValue) return defaultValue;
		if (!required) return "";
	}
}

function sanitizeSlug(raw) {
	const trimmed = raw.trim().replaceAll(" ", "-");
	if (!trimmed) return "";
	if (trimmed.includes("..") || trimmed.includes("/") || trimmed.includes("\\")) return "";
	return trimmed;
}

async function listMarkdownFiles(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await listMarkdownFiles(fullPath)));
		} else if (entry.isFile() && (entry.name.endsWith(".md") || entry.name.endsWith(".mdx"))) {
			files.push(fullPath);
		}
	}
	return files;
}

function stripQuotes(value) {
	return value.replace(/^['"]|['"]$/g, "").trim();
}

function parseTagsFromFrontmatter(contents) {
	const lines = contents.split(/\r?\n/);
	const tags = [];
	let inFrontmatter = false;
	let listMode = false;
	for (const line of lines) {
		const trimmed = line.trim();
		if (!inFrontmatter) {
			if (trimmed === "---") {
				inFrontmatter = true;
				continue;
			}
			break;
		}
		if (trimmed === "---") break;
		if (listMode) {
			if (trimmed.startsWith("-")) {
				const value = stripQuotes(trimmed.slice(1).trim());
				if (value) tags.push(value);
				continue;
			}
			if (trimmed !== "") listMode = false;
		}
		const match = trimmed.match(/^tags:\s*(.*)$/);
		if (!match) continue;
		const rest = match[1].trim();
		if (rest.startsWith("[")) {
			const inner = rest.replace(/^\[/, "").replace(/\]$/, "");
			inner
				.split(",")
				.map((item) => stripQuotes(item.trim()))
				.filter(Boolean)
				.forEach((tag) => tags.push(tag));
		} else if (rest) {
			tags.push(stripQuotes(rest));
		} else {
			listMode = true;
		}
	}
	return tags;
}

async function getExistingTags() {
	const files = await listMarkdownFiles(postsDir);
	const tagSet = new Set();
	for (const file of files) {
		const content = await readFile(file, "utf8");
		parseTagsFromFrontmatter(content).forEach((tag) => tagSet.add(tag));
	}
	return Array.from(tagSet).sort((a, b) => a.localeCompare(b, "ja"));
}

async function selectTagsFallback() {
	const tagInput = await ask("tags（comma separated）");
	return tagInput
		.split(",")
		.map((t) => t.trim())
		.filter(Boolean);
}

async function selectTags(existingTags) {
	if (!input.isTTY || !output.isTTY) {
		return selectTagsFallback();
	}
	return new Promise((resolve, reject) => {
		const selected = new Set();
		const selectedOrder = [];
		const existingLower = new Map(
			existingTags.map((tag) => [tag.toLowerCase(), tag]),
		);
		let query = "";
		let cursor = 0;
		let lastRenderLines = 0;

		const addTag = (tag) => {
			if (selected.has(tag)) return;
			selected.add(tag);
			selectedOrder.push(tag);
		};

		const removeTag = (tag) => {
			if (!selected.delete(tag)) return;
			const index = selectedOrder.indexOf(tag);
			if (index >= 0) selectedOrder.splice(index, 1);
		};

		const getItems = () => {
			const q = query.trim().toLowerCase();
			const filtered = q
				? existingTags.filter((tag) => tag.toLowerCase().includes(q))
				: [...existingTags];
			const items = filtered.map((tag) => ({ type: "existing", value: tag }));
			if (query.trim()) {
				const exact = existingLower.get(q);
				if (!exact) items.unshift({ type: "new", value: query.trim() });
			}
			return items;
		};

		const activateItem = (items) => {
			if (items.length === 0) {
				const value = query.trim();
				if (!value) return;
				const existing = existingLower.get(value.toLowerCase());
				addTag(existing ?? value);
				query = "";
				return;
			}
			const item = items[cursor] ?? items[0];
			if (item.type === "existing") {
				if (selected.has(item.value)) removeTag(item.value);
				else addTag(item.value);
				return;
			}
			const value = item.value.trim();
			if (!value) return;
			const existing = existingLower.get(value.toLowerCase());
			addTag(existing ?? value);
			query = "";
		};

		const render = () => {
			const items = getItems();
			if (cursor >= items.length) cursor = Math.max(0, items.length - 1);
			if (lastRenderLines > 0) {
				readline.moveCursor(output, 0, -lastRenderLines);
			}
			readline.cursorTo(output, 0);
			readline.clearScreenDown(output);
			output.write(
				"tags: 候補から選択（j/k移動、space=選択、enter=終了、文字入力で絞り込み）\n",
			);
			output.write(`選択済み: ${selectedOrder.join(", ") || "(なし)"}\n`);
			output.write(`絞り込み: ${query}\n`);
			if (items.length === 0) {
				output.write("  (候補なし)\n");
				lastRenderLines = 4;
				return;
			}
			items.forEach((item, index) => {
				const active = index === cursor;
				const prefix = active ? ">" : " ";
				if (item.type === "existing") {
					const mark = selected.has(item.value) ? "[x]" : "[ ]";
					output.write(`${prefix} ${mark} ${item.value}\n`);
					return;
				}
				output.write(`${prefix} [+] 新規: ${item.value}\n`);
			});
			lastRenderLines = 3 + items.length;
		};

		const onKeypress = (str, key) => {
			if (key?.ctrl && key.name === "c") {
				cleanup();
				const error = new Error("Cancelled");
				error.code = "CANCELLED";
				reject(error);
				return;
			}
			if (key?.name === "return") {
				if (!query.trim()) {
					cleanup();
					resolve(selectedOrder);
					return;
				}
				activateItem(getItems());
				render();
				return;
			}
			if (key?.name === "backspace") {
				if (query.length > 0) query = query.slice(0, -1);
				render();
				return;
			}
			if (key?.name === "up" || key?.name === "k") {
				cursor = Math.max(0, cursor - 1);
				render();
				return;
			}
			if (key?.name === "down" || key?.name === "j") {
				const items = getItems();
				cursor = Math.min(items.length - 1, cursor + 1);
				render();
				return;
			}
			if (key?.name === "escape") {
				if (query.length > 0) {
					query = "";
					render();
					return;
				}
				cleanup();
				resolve(selectedOrder);
				return;
			}
			if (key?.name === "space") {
				activateItem(getItems());
				render();
				return;
			}
			if (str && !key?.ctrl && !key?.meta) {
				if (str === "j" || str === "k") {
					const items = getItems();
					cursor =
						str === "j"
							? Math.min(items.length - 1, cursor + 1)
							: Math.max(0, cursor - 1);
					render();
					return;
				}
				query += str;
				cursor = 0;
				render();
			}
		};

		const cleanup = () => {
			input.removeListener("keypress", onKeypress);
			if (input.isTTY) input.setRawMode(false);
			input.pause();
			rl.resume();
			output.write("\n");
		};

		rl.pause();
		readline.emitKeypressEvents(input, rl);
		if (input.isTTY) input.setRawMode(true);
		input.resume();
		input.on("keypress", onKeypress);
		render();
	});
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
	const existingTags = await getExistingTags();
	const tags = await selectTags(existingTags);

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

main()
	.then(() => {
		rl.close();
	})
	.catch((error) => {
		rl.close();
		if (error?.code === "CANCELLED") {
			process.exitCode = 130;
			return;
		}
		console.error(error);
		process.exitCode = 1;
	});
