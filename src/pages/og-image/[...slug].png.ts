import { Resvg } from "@resvg/resvg-js";
import type { APIContext, InferGetStaticPropsType } from "astro";
import satori, { type SatoriOptions } from "satori";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getAllPosts } from "@/data/post";
import { siteConfig } from "@/site.config";
import { ymd } from "@/utils/date";

export const prerender = true;

function loadFont(filePath: string) {
	return readFileSync(path.resolve(process.cwd(), filePath));
}

function loadImageData(filePath: string, mimeType: string) {
	const buffer = readFileSync(path.resolve(process.cwd(), filePath));
	return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

const logoUrl = loadImageData("public/ogp/hanabi.png", "image/png");

const ogCachePath = path.resolve(process.cwd(), ".cache/og-image.json");

function loadOgCache(): Record<string, string> {
	try {
		return JSON.parse(readFileSync(ogCachePath, "utf-8")) as Record<string, string>;
	} catch {
		return {};
	}
}

function saveOgCache(cache: Record<string, string>) {
	mkdirSync(path.dirname(ogCachePath), { recursive: true });
	writeFileSync(ogCachePath, JSON.stringify(cache, null, 2));
}

function ogHash(input: unknown) {
	return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

const ogOptions: SatoriOptions = {
	// debug: true,
	fonts: [
		{
			data: loadFont("src/assets/MOBO-Bold.otf"),
			name: "Mobo Bold",
			style: "normal",
			weight: 700,
		},
		{
			data: loadFont("src/assets/Kuramubon.otf"),
			name: "Kuramubon",
			style: "normal",
			weight: 400,
		},
		{
			data: loadFont("src/assets/roboto-mono-regular.ttf"),
			name: "Roboto Mono",
			style: "normal",
			weight: 400,
		},
		{
			data: loadFont("src/assets/roboto-mono-700.ttf"),
			name: "Roboto Mono",
			style: "normal",
			weight: 700,
		},
	],
	height: 630,
	width: 1200,
};

const h = (type: string, props: Record<string, unknown> | null, ...children: unknown[]) => {
	const filteredChildren = children.flat().filter((child) => child !== null && child !== false);
	const nextProps = { ...(props ?? {}) } as Record<string, unknown>;
	if (type === "div") {
		const style = (nextProps.style ?? {}) as Record<string, unknown>;
		if (!("display" in style)) {
			nextProps.style = { ...style, display: "flex" };
		}
	}
	nextProps.children = filteredChildren;
	return { type, props: nextProps };
};

const markup = (title: string, pubDate: string, coverUrl?: string, logoUrl?: string) =>
	h(
		"div",
		{
			style: {
				position: "relative",
				width: "1200px",
				height: "630px",
				display: "flex",
				flexDirection: "column",
				backgroundColor: "#1d1f21",
				color: "#c9cacc",
				fontFamily: "Kuramubon, Roboto Mono",
			},
		},
		coverUrl
			? h("img", {
					src: coverUrl,
					alt: "",
					style: {
						position: "absolute",
						top: 0,
						left: 0,
						width: "1200px",
						height: "630px",
						objectFit: "cover",
						opacity: 0.4,
					},
				})
			: null,
		coverUrl
			? h("div", {
					style: {
						position: "absolute",
						top: 0,
						left: 0,
						width: "1200px",
						height: "630px",
						backgroundColor: "rgba(29, 31, 33, 0.5)",
					},
				})
			: null,
		h(
			"div",
			{
				style: {
					position: "relative",
					display: "flex",
					flexDirection: "column",
					flex: 1,
					padding: "40px",
					justifyContent: "center",
				},
			},
			h("p", { style: { fontSize: "24px", marginBottom: "24px" } }, pubDate),
			h(
				"h1",
				{
					style: {
						fontSize: "60px",
						fontWeight: 700,
						lineHeight: 1.2,
						color: "#ffffff",
						fontFamily: "Mobo Bold",
					},
				},
				title,
			),
		),
		h(
			"div",
			{
				style: {
					position: "relative",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					padding: "40px",
					borderTop: "1px solid #2bbc89",
          backgroundColor: "#1D1F20",
					fontSize: "20px",
				},
			},
			h(
				"div",
				{ style: { display: "flex", alignItems: "center" } },
				h("img", {
					src: logoUrl,
					alt: "",
          width: 40,
          height: 40,
					style: {
						width: "40px",
						height: "40px",
						objectFit: "cover",
					},
				}),
				h("p", { style: { marginLeft: "12px", fontWeight: 600 } }, siteConfig.title),
			),
			h("p", null, `by ${siteConfig.author}`),
		),
	);

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export async function GET(context: APIContext) {
	const { pubDate, title, coverUrl } = context.props as Props;
	const absoluteCoverUrl = coverUrl ? new URL(coverUrl, context.url).href : undefined;
	const slugParam = context.params.slug;
	const slug = Array.isArray(slugParam) ? slugParam.join("/") : slugParam;

	const safePubDate = pubDate instanceof Date ? pubDate : new Date(pubDate);
  const ymdDate = ymd(safePubDate);
	const svg = await satori(markup(title, ymdDate, absoluteCoverUrl, logoUrl), ogOptions);
	const pngBuffer = new Resvg(svg).render().asPng();
	const png = new Uint8Array(pngBuffer);
	if (slug) {
		const outputPath = path.resolve(process.cwd(), "public/og-image", `${slug}.png`);
		mkdirSync(path.dirname(outputPath), { recursive: true });
		writeFileSync(outputPath, png);
	}
	return new Response(png, {
		headers: {
			"Cache-Control": "public, max-age=31536000, immutable",
			"Content-Type": "image/png",
		},
	});
}

export async function getStaticPaths() {
	const posts = await getAllPosts();
	const cache = loadOgCache();
	const nextCache: Record<string, string> = { ...cache };
	const paths = posts
		.filter(({ data }) => !data.ogImage)
		.flatMap((post) => {
			const coverUrl =
				typeof post.data.coverImage?.src === "string"
					? post.data.coverImage.src
					: post.data.coverImage?.src?.src;
			const payload = {
				title: post.data.title,
				coverUrl,
				publishDate: post.data.publishDate,
				updatedDate: post.data.updatedDate,
			};
			const hash = ogHash(payload);
			nextCache[post.id] = hash;

			const outputPath = path.resolve(process.cwd(), "public/og-image", `${post.id}.png`);
			const needsUpdate = !existsSync(outputPath) || cache[post.id] !== hash;
			if (!needsUpdate) {
				return [];
			}

			return [
				{
					params: { slug: post.id },
					props: {
						pubDate: post.data.updatedDate ?? post.data.publishDate,
						title: post.data.title,
						coverUrl,
					},
				},
			];
		});

	saveOgCache(nextCache);
	return paths;
}
