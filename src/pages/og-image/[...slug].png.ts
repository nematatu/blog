import { getCollection } from "astro:content";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import type { APIContext, InferGetStaticPropsType } from "astro";
import { getTitleFontSize, splitTitleLines } from "@lib/og-title";
import satori, { type SatoriOptions } from "satori";
import sharp from "sharp";

export const prerender = true;

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

const fontPath = (fileName: string) =>
  path.resolve(process.cwd(), "src/assets", fileName);

const sansRegularPath = fontPath("Kuramubon.otf");
const sansBoldPath = fontPath("MOBO-Bold.otf");
const avatarPath = path.resolve(process.cwd(), "public/icon/icon.svg");
const backgroundPath = path.resolve(process.cwd(), "public/og-background.avif");

if (!existsSync(sansRegularPath) || !existsSync(sansBoldPath)) {
  throw new Error("OG font not found. Ensure src/assets fonts exist.");
}

if (!existsSync(avatarPath) || !existsSync(backgroundPath)) {
  throw new Error("OG asset not found. Ensure fonts and OG assets exist.");
}

const sansRegular = readFileSync(sansRegularPath);
const sansBold = readFileSync(sansBoldPath);
const avatar = `data:image/svg+xml;base64,${readFileSync(avatarPath).toString(
  "base64",
)}`;
const background = `data:image/png;base64,${(
  await sharp(backgroundPath)
    .resize(OG_WIDTH, OG_HEIGHT, { fit: "cover" })
    .png()
    .toBuffer()
).toString("base64")}`;

const ogOptions: SatoriOptions = {
  width: OG_WIDTH,
  height: OG_HEIGHT,
  fonts: [
    {
      data: sansRegular,
      name: "OgJP",
      style: "normal" as const,
      weight: 400 as const,
    },
    {
      data: sansBold,
      name: "OgJP",
      style: "normal" as const,
      weight: 700 as const,
    },
  ],
};

type Child = string | number | boolean | null | undefined | Child[] | object;
type SatoriNode = Parameters<typeof satori>[0];

const node = (type: string, props: Record<string, unknown>) => ({
  type,
  props: { ...props, children: [] },
});
const div = (style: Record<string, unknown>, ...children: Child[]) => ({
  type: "div",
  props: {
    style: { ...style, display: style.display ?? "flex" },
    children: children
      .flat()
      .filter((child) => child !== null && child !== false),
  },
});

const TITLE_TEXT_WIDTH = 930;
const PAPER_COLOR = "#fffdfa";

const markup = (title: string): SatoriNode => {
  const titleLines = splitTitleLines(title);
  const titleFontSize = getTitleFontSize(titleLines);

  return div(
    {
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "52px",
      fontFamily: "OgJP",
      color: "#171717",
      position: "relative",
      overflow: "hidden",
    },
    node("img", {
      src: background,
      width: OG_WIDTH,
      height: OG_HEIGHT,
      style: { position: "absolute", top: "0", left: "0" },
    }),
    div({
      position: "absolute",
      top: "37px",
      left: "37px",
      width: "1126px",
      height: "556px",
      backgroundColor: PAPER_COLOR,
      borderRadius: "20px",
    }),
    div(
      {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "32px",
        width: "100%",
        height: "100%",
        padding: "54px 76px",
        position: "relative",
      },
      div(
        {
          minHeight: "340px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          flexDirection: "column",
          gap: "10px",
          width: `${TITLE_TEXT_WIDTH}px`,
          fontSize: `${titleFontSize}px`,
          fontWeight: 700,
          lineHeight: 1.16,
          letterSpacing: "0",
        },
        titleLines.map((line) =>
          div(
            {
              display: "flex",
              justifyContent: "center",
              width: "100%",
              whiteSpace: "nowrap",
              wordBreak: "keep-all",
              overflow: "visible",
            },
            line.text,
          ),
        ),
      ),
      div(
        {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          color: "#3f3f46",
          fontSize: "26px",
          fontWeight: 700,
        },
        node("img", {
          src: avatar,
          width: 64,
          height: 64,
          style: { borderRadius: "50%" },
        }),
      ),
    ),
  ) as SatoriNode;
};

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export async function GET(context: APIContext) {
  const require = createRequire(import.meta.url);
  const { Resvg } =
    require("@resvg/resvg-js") as typeof import("@resvg/resvg-js");
  const { title } = context.props as Props;
  const svg = await satori(markup(title), ogOptions);
  const pngBuffer = new Resvg(svg, {
    textRendering: 1,
    shapeRendering: 2,
    imageRendering: 0,
    dpi: 192,
  })
    .render()
    .asPng();
  const png = new Uint8Array(pngBuffer);

  return new Response(png, {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=86400",
      "Content-Type": "image/png",
    },
  });
}

export async function getStaticPaths() {
  const showDrafts = import.meta.env.DEV;
  const blog = (await getCollection("blog")).filter(
    (post) => showDrafts || !post.data.draft,
  );
  const projects = (await getCollection("projects")).filter(
    (project) => showDrafts || !project.data.draft,
  );

  const entries = [
    ...blog.map((entry) => ({ entry, prefix: "blog" })),
    ...projects.map((entry) => ({ entry, prefix: "projects" })),
  ];

  return entries.map(({ entry, prefix }) => ({
    params: { slug: `${prefix}/${entry.id}` },
    props: {
      title: entry.data.title,
    },
  }));
}
