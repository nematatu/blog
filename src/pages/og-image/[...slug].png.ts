import { getCollection } from "astro:content";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import type { APIContext, InferGetStaticPropsType } from "astro";
import { jaModel, Parser } from "budoux";
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

type TitleLine = {
  text: string;
  weight: number;
};

const TITLE_TEXT_WIDTH = 930;
const TITLE_TEXT_SAFE_WIDTH = 900;
const PAPER_COLOR = "#fffdfa";
const japaneseParser = new Parser(jaModel);

const getTextWeight = (text: string) =>
  [...text].reduce((total, character) => {
    if (/\s/.test(character)) {
      return total + 0.35;
    }

    if (/[\u0020-\u007e]/.test(character)) {
      return total + 0.62;
    }

    if (/[、。，．・：；！？!?\])）］｝〉》」』】]/.test(character)) {
      return total + 0.55;
    }

    return total + 1;
  }, 0);

const closingPunctuationPattern = /^[、。，．・：；！？!?\])）］｝〉》」』】]+/;
const closingQuoteWithParticlePattern =
  /^([、。，．・：；！？!?\])）］｝〉》」』】]+(?:って)?)(.+)$/;
const hiraganaPattern = /^[ぁ-んー]+$/;
const leadingTitleLabelPattern = /^(【[^】]+】)(.+)$/;

const normalizeTitlePhrases = (phrases: string[]) => {
  const normalized: string[] = [];

  for (const phrase of phrases) {
    const closingQuoteMatch = phrase.match(closingQuoteWithParticlePattern);

    if (closingQuoteMatch && normalized.length > 0) {
      normalized[normalized.length - 1] += closingQuoteMatch[1];

      if (closingQuoteMatch[2]) {
        normalized.push(closingQuoteMatch[2]);
      }

      continue;
    }

    if (closingPunctuationPattern.test(phrase) && normalized.length > 0) {
      normalized[normalized.length - 1] += phrase;
      continue;
    }

    normalized.push(phrase);
  }

  const merged: string[] = [];

  for (const phrase of normalized) {
    const previous = merged.at(-1);

    if (
      previous &&
      ((previous.endsWith("の") && getTextWeight(previous) <= 4) ||
        (previous === "気に" && hiraganaPattern.test(phrase)))
    ) {
      merged[merged.length - 1] += phrase;
      continue;
    }

    merged.push(phrase);
  }

  return merged;
};

const getTitlePhrases = (title: string) =>
  normalizeTitlePhrases(
    japaneseParser
      .parse(title.replace(/\s+/g, " ").trim())
      .filter((phrase) => phrase.trim().length > 0),
  );

const getLineCandidates = (
  phrases: string[],
  lineCount: number,
  startIndex = 0,
): string[][] => {
  if (lineCount === 1) {
    return [[phrases.slice(startIndex).join("")]];
  }

  const candidates: string[][] = [];
  const maxEndIndex = phrases.length - lineCount + 1;

  for (let endIndex = startIndex + 1; endIndex <= maxEndIndex; endIndex++) {
    const line = phrases.slice(startIndex, endIndex).join("");
    for (const rest of getLineCandidates(phrases, lineCount - 1, endIndex)) {
      candidates.push([line, ...rest]);
    }
  }

  return candidates;
};

const getTitleFontSize = (lines: TitleLine[]) => {
  const maxWeight = Math.max(...lines.map((line) => line.weight));
  const widthLimitedSize = Math.floor(TITLE_TEXT_SAFE_WIDTH / maxWeight);

  if (lines.length === 1) {
    return Math.min(104, widthLimitedSize);
  }

  if (lines.length === 2) {
    return Math.min(92, widthLimitedSize);
  }

  return Math.min(76, widthLimitedSize);
};

const scoreLineCandidate = (lines: TitleLine[]) => {
  const fontSize = getTitleFontSize(lines);
  const weights = lines.map((line) => line.weight);
  const totalWeight = weights.reduce((total, weight) => total + weight, 0);
  const targetWeight = totalWeight / lines.length;
  const balancePenalty = weights.reduce(
    (score, weight) => score + Math.abs(weight - targetWeight) ** 2,
    0,
  );
  const shortestWeight = Math.min(...weights);
  const shortLinePenalty = shortestWeight < targetWeight * 0.48 ? 32 : 0;
  const lineCountPenalty = (lines.length - 1) * 18;

  return -fontSize * 2 + balancePenalty + shortLinePenalty + lineCountPenalty;
};

const splitTitleLines = (title: string): TitleLine[] => {
  const leadingLabelMatch = title.match(leadingTitleLabelPattern);

  if (leadingLabelMatch) {
    const [, label, restTitle] = leadingLabelMatch;
    const restPhrases = getTitlePhrases(restTitle);
    const maxRestLineCount = Math.min(2, restPhrases.length);
    const labelCandidates = Array.from(
      { length: maxRestLineCount },
      (_, index) => getLineCandidates(restPhrases, index + 1),
    )
      .flat()
      .map((lines) =>
        [label, ...lines].map((line) => ({
          text: line,
          weight: getTextWeight(line),
        })),
      );
    const labelCandidate = labelCandidates.sort(
      (a, b) => scoreLineCandidate(a) - scoreLineCandidate(b),
    )[0];

    if (labelCandidate) {
      return labelCandidate;
    }
  }

  const phrases = getTitlePhrases(title);
  const maxLineCount = Math.min(3, phrases.length);
  const candidates = Array.from({ length: maxLineCount }, (_, index) =>
    getLineCandidates(phrases, index + 1),
  )
    .flat()
    .map((lines) =>
      lines.map((line) => ({
        text: line,
        weight: getTextWeight(line),
      })),
    );
  const candidate = candidates.sort(
    (a, b) => scoreLineCandidate(a) - scoreLineCandidate(b),
  )[0] ?? [
    {
      text: title,
      weight: getTextWeight(title),
    },
  ];

  return candidate;
};

const markup = (title: string): SatoriNode => {
  const titleLines = splitTitleLines(title);
  const titleFontSize = getTitleFontSize(titleLines);

  return h(
    "div",
    {
      style: {
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
    },
    h("img", {
      src: background,
      width: OG_WIDTH,
      height: OG_HEIGHT,
      style: {
        position: "absolute",
        top: "0",
        left: "0",
      },
    }),
    h("div", {
      style: {
        position: "absolute",
        top: "37px",
        left: "37px",
        width: "1126px",
        height: "556px",
        backgroundColor: PAPER_COLOR,
        borderRadius: "20px",
      },
    }),
    h(
      "div",
      {
        style: {
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
      },
      h(
        "div",
        {
          style: {
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
        },
        titleLines.map((line) =>
          h(
            "div",
            {
              style: {
                display: "flex",
                justifyContent: "center",
                width: "100%",
                whiteSpace: "nowrap",
                wordBreak: "keep-all",
                overflow: "visible",
              },
            },
            line.text,
          ),
        ),
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            color: "#3f3f46",
            fontSize: "26px",
            fontWeight: 700,
          },
        },
        h("img", {
          src: avatar,
          width: 64,
          height: 64,
          style: {
            borderRadius: "50%",
          },
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
