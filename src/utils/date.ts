import type { CollectionEntry } from "astro:content";
import { siteConfig } from "@/site.config";

export function getFormattedDate(
	date: Date | undefined,
	options?: Intl.DateTimeFormatOptions,
): string {
	if (date === undefined) {
		return "Invalid Date";
	}

	return new Intl.DateTimeFormat(siteConfig.date.locale, {
		...(siteConfig.date.options as Intl.DateTimeFormatOptions),
		...options,
	}).format(date);
}

export function ymd(date: Date | string | number | undefined) {
	const safeDate = coerceDate(date);
	if (Number.isNaN(safeDate.getTime())) {
		return "Invalid Date";
	}
	return `${safeDate.getFullYear()}-${safeDate.getMonth() + 1}-${safeDate.getDate()}`;
}

function coerceDate(value: Date | string | number | undefined) {
	if (value instanceof Date) return value;
	return new Date(value ?? "");
}

export function collectionDateSort(
	a: CollectionEntry<"post" | "note">,
	b: CollectionEntry<"post" | "note">,
) {
	const dateA = coerceDate(a.data.publishDate);
	const dateB = coerceDate(b.data.publishDate);
	return dateB.getTime() - dateA.getTime();
}
