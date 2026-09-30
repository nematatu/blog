import { jaModel, Parser } from "budoux";

type TitleLine = {
  text: string;
  weight: number;
};

const TITLE_TEXT_SAFE_WIDTH = 900;
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

function* getLineCandidates(
  phrases: string[],
  lineCount: number,
  startIndex = 0,
): Generator<string[]> {
  if (lineCount === 1) {
    yield [phrases.slice(startIndex).join("")];
    return;
  }

  const maxEndIndex = phrases.length - lineCount + 1;
  for (let endIndex = startIndex + 1; endIndex <= maxEndIndex; endIndex++) {
    const line = phrases.slice(startIndex, endIndex).join("");
    for (const rest of getLineCandidates(phrases, lineCount - 1, endIndex)) {
      yield [line, ...rest];
    }
  }
}

export const getTitleFontSize = (lines: TitleLine[]) => {
  const maxWeight = Math.max(...lines.map((line) => line.weight));
  const widthLimitedSize = Math.floor(TITLE_TEXT_SAFE_WIDTH / maxWeight);
  return Math.min(
    [104, 92, 76][Math.min(lines.length, 3) - 1],
    widthLimitedSize,
  );
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

export const splitTitleLines = (title: string): TitleLine[] => {
  const leadingLabelMatch = title.match(leadingTitleLabelPattern);
  const bestCandidate = (phrases: string[], label = "") => {
    let best: TitleLine[] | undefined;
    let bestScore = Infinity;
    for (
      let count = 1;
      count <= Math.min(label ? 2 : 3, phrases.length);
      count++
    ) {
      for (const candidate of getLineCandidates(phrases, count)) {
        const lines = (label ? [label, ...candidate] : candidate).map(
          (text) => ({
            text,
            weight: getTextWeight(text),
          }),
        );
        const score = scoreLineCandidate(lines);
        if (score < bestScore) {
          best = lines;
          bestScore = score;
        }
      }
    }
    return best;
  };

  if (leadingLabelMatch) {
    const candidate = bestCandidate(
      getTitlePhrases(leadingLabelMatch[2]),
      leadingLabelMatch[1],
    );
    if (candidate) return candidate;
  }

  return (
    bestCandidate(getTitlePhrases(title)) ?? [
      { text: title, weight: getTextWeight(title) },
    ]
  );
};
