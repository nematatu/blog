function stripQuotes(value) {
  return value.replace(/^['"]|['"]$/g, "").trim();
}

export function parseFrontmatter(contents) {
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
