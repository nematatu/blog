import { Resvg } from "@resvg/resvg-js";
import type { APIContext, InferGetStaticPropsType } from "astro";
import satori, { type SatoriOptions } from "satori";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { getAllPosts } from "@/data/post";
import { siteConfig } from "@/site.config";
import { getFormattedDate } from "@/utils/date";

function loadFont(filePath: string) {
	return readFileSync(path.resolve(process.cwd(), filePath));
}

function getLocalCoverUrl(slug: string | undefined, baseUrl: URL) {
	if (!slug || slug.includes("..") || slug.startsWith("/")) return undefined;
	const normalizedSlug = slug.replace(/\.(png|jpe?g|webp)$/i, "");
	const baseDir = path.resolve(process.cwd(), "public", "ogp");
	const extensions = ["png", "jpg", "jpeg", "webp"];
	for (const ext of extensions) {
		const filePath = path.resolve(baseDir, `${normalizedSlug}.${ext}`);
		if (!existsSync(filePath)) continue;
		return new URL(`/ogp/${normalizedSlug}.${ext}`, baseUrl).href;
	}
	return undefined;
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

const markup = (title: string, pubDate: string, coverUrl?: string) =>
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
					opacity: 0.6,
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
					backgroundColor: "rgba(29, 31, 33, 0.45)",
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
					fontSize: "20px",
				},
			},
			h(
				"div",
				{ style: { display: "flex", alignItems: "center" } },
				h(
					"svg",
					{
						height: "60",
						fill: "none",
						xmlns: "http://www.w3.org/2000/svg",
						viewBox: "0 0 272 480",
					},
					h("path", {
						fill: "#cdffb8",
						d: "M181.334 93.333v-40L226.667 80v40zM136.001 53.333 90.667 26.667v426.666L136.001 480zM45.333 220 0 193.334v140L45.333 360z",
					}),
					h("path", {
						fill: "#d482ab",
						d: "M90.667 26.667 136.001 0l45.333 26.667-45.333 26.666zM181.334 53.33l45.333-26.72L272 53.33 226.667 80zM136 240l-45.333-26.67v53.34zM0 193.33l45.333-26.72 45.334 26.72L45.333 220zM181.334 93.277 226.667 120l-45.333 26.67z",
					}),
					h("path", {
						fill: "#2abc89",
						d: "m136 53.333 45.333-26.666v120L226.667 120V80L272 53.333V160l-90.667 53.333v240L136 480V306.667L45.334 360V220l45.333-26.667v73.334L136 240z",
					}),
				),
				h("p", { style: { marginLeft: "12px", fontWeight: 600 } }, siteConfig.title),
			),
			h("p", null, `by ${siteConfig.author}`),
		),
	);

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export async function GET(context: APIContext) {
	const { pubDate, title } = context.props as Props;
	const slugParam = context.params.slug;
	const slug = Array.isArray(slugParam) ? slugParam.join("/") : slugParam;
	const coverUrl = getLocalCoverUrl(slug, context.url);

	const safePubDate = pubDate instanceof Date ? pubDate : new Date(pubDate);
	const postDate = getFormattedDate(safePubDate, {
		month: "long",
		weekday: "long",
	});
	const svg = await satori(markup(title, postDate, coverUrl), ogOptions);
	const pngBuffer = new Resvg(svg).render().asPng();
	const png = new Uint8Array(pngBuffer);
	return new Response(png, {
		headers: {
			"Cache-Control": "public, max-age=31536000, immutable",
			"Content-Type": "image/png",
		},
	});
}

export async function getStaticPaths() {
	const posts = await getAllPosts();
	return posts
		.filter(({ data }) => !data.ogImage)
		.map((post) => ({
			params: { slug: post.id },
			props: {
				pubDate: post.data.updatedDate ?? post.data.publishDate,
				title: post.data.title,
			},
		}));
}
