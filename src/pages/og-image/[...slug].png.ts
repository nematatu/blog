import { Resvg } from "@resvg/resvg-js";
import type { APIContext, InferGetStaticPropsType } from "astro";
import { getCollection } from "astro:content";
import satori, { type SatoriOptions } from "satori";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { SITE } from "@consts";
import type { ReactNode } from "react";

export const prerender = true;

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

const fontPath = (fileName: string) =>
  path.resolve(process.cwd(), "src/assets", fileName);

const sansRegularPath = fontPath("Kuramubon.otf");
const sansBoldPath = fontPath("MOBO-Bold.otf");

if (!existsSync(sansRegularPath) || !existsSync(sansBoldPath)) {
  throw new Error(
    "OG font not found. Ensure src/assets/Kuramubon.otf and src/assets/MOBO-Bold.otf exist.",
  );
}

const sansRegular = readFileSync(sansRegularPath);
const sansBold = readFileSync(sansBoldPath);

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

const h = (
  type: string,
  props: Record<string, unknown> | null,
  ...children: Child[]
) => {
  const filteredChildren = children
    .flat()
    .filter((child) => child !== null && child !== false);
  const nextProps = { ...(props ?? {}) } as Record<string, unknown>;

  if (type === "div") {
    const style = { ...(nextProps.style ?? {}) } as Record<string, unknown>;
    if (style.display === undefined) {
      style.display = "flex";
    }
    nextProps.style = style;
  }

  return {
    type,
    props: {
      ...nextProps,
      children: filteredChildren,
    },
  };
};

const formatDate = (value: Date) =>
  new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);

const markup = (
  title: string,
  description: string,
  dateLabel: string,
): ReactNode =>
  h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "80px",
        fontFamily: "OgJP",
        backgroundColor: "#0b0f14",
        color: "#f8fafc",
        position: "relative",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
      },
    },
    h("div", {
      style: {
        position: "absolute",
        top: "-180px",
        right: "-140px",
        width: "520px",
        height: "520px",
        borderRadius: "9999px",
        backgroundColor: "rgba(56,189,248,0.15)",
      },
    }),
    h("div", {
      style: {
        position: "absolute",
        bottom: "-140px",
        left: "-120px",
        width: "420px",
        height: "420px",
        borderRadius: "9999px",
        backgroundColor: "rgba(99,102,241,0.12)",
      },
    }),
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          gap: "22px",
          maxWidth: "900px",
          zIndex: 1,
        },
      },
      h(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "18px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#94a3b8",
            fontFamily: "OgJP",
          },
        },
        h("div", {
          style: {
            width: "44px",
            height: "3px",
            borderRadius: "9999px",
            backgroundColor: "#38bdf8",
          },
        }),
        "Article",
      ),
      h(
        "div",
        {
          style: {
            fontSize: "68px",
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          },
        },
        title,
      ),
      h(
        "div",
        {
          style: {
            fontSize: "32px",
            color: "#cbd5e1",
            lineHeight: 1.5,
            fontFamily: "OgJP",
          },
        },
        description,
      ),
    ),
    h(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
          fontSize: "20px",
          color: "#94a3b8",
          zIndex: 1,
        },
      },
      h(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "24px",
            color: "#e2e8f0",
            fontFamily: "OgJP",
          },
        },
        SITE.TITLE,
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "24px",
            fontWeight: 500,
            color: "#f1f5f9",
            letterSpacing: "0.02em",
            fontFamily: "OgJP",
          },
        },
        dateLabel,
      ),
    ),
  );

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export async function GET(context: APIContext) {
  const { title, description, date } = context.props as Props;
  const resolvedDate = date ? new Date(date) : new Date();
  const dateLabel = formatDate(resolvedDate);
  const svg = await satori(
    markup(title, description || SITE.DESCRIPTION, dateLabel),
    ogOptions,
  );
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
      "Cache-Control": "public, max-age=31536000, immutable",
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
      description: entry.data.description ?? SITE.DESCRIPTION,
      date: entry.data.date?.toISOString?.() ?? entry.data.date ?? null,
    },
  }));
}
