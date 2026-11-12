export type TextStats = {
  wordCount: number;
  charCount: number;
  readingMinutes: number;
};

const normalizeText = (value: string) =>
  value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/[#>*_~=-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const getTextStats = (value: string): TextStats => {
  const text = normalizeText(value);
  const wordCount = text ? text.split(/\s+/).length : 0;
  const charCount = text ? text.replace(/\s/g, "").length : 0;
  const readingMinutes = Math.max(1, Math.round(charCount / 450));
  return { wordCount, charCount, readingMinutes };
};

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const dateKey = (date: Date) => dateFormatter.format(date);

// description のない記事で、meta description や構造化データに使う本文の抜粋。
export const getExcerpt = (value: string, maxLength = 120) => {
  const text = value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/^\s*\[\^[^\]]+]:.*$/gm, " ")
    .replace(/\[\^[^\]]+]:?/g, "")
    .replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/^:{2,}.*$/gm, " ")
    .replace(/^\s*(?:#{1,6}|>|[-*+]|\d+\.)\s+/gm, "")
    .replace(/[*_~`]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const chars = [...text];
  return chars.length > maxLength
    ? `${chars.slice(0, maxLength).join("").trimEnd()}…`
    : text;
};
