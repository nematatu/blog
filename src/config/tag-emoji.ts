export const tagEmojiMap: Record<string, string> = {
	"バドミントン": "🏸",
	"日常": "🗒️",
	"写真": "📷",
	"radio": "📻",
	"audry": "🎧",
	"markdown-guide": "📝",
};

export const getTagEmoji = (tag: string): string | undefined => {
	const key = tag.toLowerCase();
	return tagEmojiMap[key] ?? tagEmojiMap[tag];
};
