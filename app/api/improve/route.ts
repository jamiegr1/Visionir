import { NextResponse } from "next/server";
import { getMockCurrentUser } from "@/lib/current-user";
import { hasPermission } from "@/lib/permissions";

function normaliseWhitespace(text: string) {
  return text
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .trim();
}

function titleCaseWords(text: string) {
  return text
    .split(" ")
    .map((word, index) => {
      if (!word) return word;

      const lower = word.toLowerCase();

      if (index > 0 && lower.length <= 2) {
        return lower;
      }

      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function sentenceCase(text: string) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function preserveEndingPunctuation(original: string, next: string) {
  const originalEndsWithPeriod = /\.\s*$/.test(original);
  const originalEndsWithExclamation = /!\s*$/.test(original);
  const originalEndsWithQuestion = /\?\s*$/.test(original);

  let result = next.replace(/[.!?]+\s*$/g, "").trim();

  if (originalEndsWithExclamation) return `${result}!`;
  if (originalEndsWithQuestion) return `${result}?`;
  if (originalEndsWithPeriod) return `${result}.`;

  return result;
}

function shortenIfTooLong(original: string, improved: string) {
  const cleanOriginal = original.trim();
  const cleanImproved = improved.trim();

  if (cleanImproved.length <= cleanOriginal.length + 4) {
    return cleanImproved;
  }

  return cleanOriginal;
}

function applyPhraseReplacements(text: string) {
  const replacements: Array<[RegExp, string]> = [
    [/\bhelp\b/gi, "support"],
    [/\bhelps\b/gi, "supports"],
    [/\bhelping\b/gi, "supporting"],
    [/\bmake sure\b/gi, "ensure"],
    [/\bmake it easy to\b/gi, "simplify"],
    [/\beasy to use\b/gi, "intuitive"],
    [/\beasy\b/gi, "simple"],
    [/\beasier\b/gi, "simpler"],
    [/\bquick\b/gi, "fast"],
    [/\bquickly\b/gi, "efficiently"],
    [/\bnice\b/gi, "refined"],
    [/\bgood\b/gi, "strong"],
    [/\bgreat\b/gi, "high-impact"],
    [/\bshow\b/gi, "highlight"],
    [/\bshows\b/gi, "highlights"],
    [/\buse\b/gi, "apply"],
    [/\buses\b/gi, "applies"],
    [/\bget\b/gi, "gain"],
    [/\bgets\b/gi, "gains"],
    [/\bbuy\b/gi, "select"],
    [/\bbig\b/gi, "strong"],
    [/\bsmall\b/gi, "focused"],
    [/\ba lot of\b/gi, "many"],
    [/\bkind of\b/gi, ""],
    [/\bsort of\b/gi, ""],
  ];

  let result = text;

  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }

  return normaliseWhitespace(result);
}

function improveEyebrow(text: string) {
  let original = text.trim();
  let improved = original;

  improved = applyPhraseReplacements(improved);
  improved = improved.replace(/\band\b/gi, " & ");
  improved = improved.replace(/[.!?]+$/g, "");
  improved = titleCaseWords(normaliseWhitespace(improved));

  if (improved.toLowerCase() === original.toLowerCase()) {
    const words = original.split(" ").filter(Boolean);

    if (words.length >= 2) {
      improved = titleCaseWords(words.join(" & "));
    } else {
      improved = titleCaseWords(original);
    }
  }

  improved = improved.replace(/[.!?]+$/g, "");
  improved = shortenIfTooLong(original, improved);

  return improved;
}

function improveHeadline(text: string) {
  let original = text.trim();
  let improved = original;

  improved = applyPhraseReplacements(improved);

  const transforms: Array<[RegExp, string]> = [
    [/\bwhy choose\b\s*/i, "Why Leading Teams Choose "],
    [/\bthe best way to\b\s*/i, "A Smarter Way to "],
    [/\bhow to\b\s*/i, "How to "],
    [/\bimprove\b/gi, "Enhance"],
    [/\bmanage\b/gi, "Streamline"],
    [/\bbuild\b/gi, "Create"],
    [/\bget\b/gi, "Unlock"],
    [/\bmake\b/gi, "Deliver"],
    [/\bbetter\b/gi, "Stronger"],
  ];

  for (const [pattern, replacement] of transforms) {
    improved = improved.replace(pattern, replacement);
  }

  improved = improved.replace(/\band\b/gi, " & ");

  if (improved.toLowerCase() === original.toLowerCase()) {
    const words = original.split(" ").filter(Boolean);

    if (words.length >= 3) {
      improved = `${words[0]} ${words[1]} Optimised`;
    } else if (words.length === 2) {
      improved = `${words[0]} Enhanced`;
    } else {
      improved = `Enhanced ${original}`;
    }
  }

  improved = normaliseWhitespace(improved).replace(/[.]+$/g, "");
  improved = shortenIfTooLong(original, improved);

  return sentenceCase(improved);
}

function improveSubheading(text: string) {
  let original = text.trim();
  let improved = original;

  improved = applyPhraseReplacements(improved);

  const subheadingPatterns: Array<[RegExp, string]> = [
    [/\bso that\b/gi, "to"],
    [/\bin order to\b/gi, "to"],
    [/\bthat helps\b/gi, "that supports"],
    [/\bdesigned to help\b/gi, "designed to support"],
    [/\bhigh-quality\b/gi, "strong"],
  ];

  for (const [pattern, replacement] of subheadingPatterns) {
    improved = improved.replace(pattern, replacement);
  }

  improved = improved.replace(/\band\b/gi, " & ");
  improved = normaliseWhitespace(improved);
  improved = preserveEndingPunctuation(original, improved);

  if (improved.toLowerCase() === original.toLowerCase()) {
    improved = preserveEndingPunctuation(
      original,
      normaliseWhitespace(original.replace(/\band\b/gi, " & "))
    );
  }

  improved = shortenIfTooLong(original, improved);

  return sentenceCase(improved);
}

function improveValuePointTitle(text: string) {
  let original = text.trim();
  let improved = original;

  improved = applyPhraseReplacements(improved);

  const transforms: Array<[RegExp, string]> = [
    [/\bmore control\b/gi, "Greater Control"],
    [/\bbetter visibility\b/gi, "Clearer Visibility"],
    [/\bfast setup\b/gi, "Faster Setup"],
    [/\beasy management\b/gi, "Simplified Management"],
    [/\bdata insights\b/gi, "Actionable Insights"],
    [/\bbetter results\b/gi, "Stronger Results"],
    [/\bmore efficient\b/gi, "Greater Efficiency"],
    [/\bteam collaboration\b/gi, "Stronger Collaboration"],
    [/\bbrand consistency\b/gi, "Consistent Branding"],
    [/\bcontent control\b/gi, "Stronger Control"],
  ];

  for (const [pattern, replacement] of transforms) {
    improved = improved.replace(pattern, replacement);
  }

  improved = improved.replace(/\band\b/gi, " & ");

  if (improved.toLowerCase() === original.toLowerCase()) {
    const words = original.split(" ").filter(Boolean);

    if (words.length >= 2) {
      improved = `${words[0]} Optimisation`;
    } else {
      improved = `Enhanced ${original}`;
    }
  }

  improved = normaliseWhitespace(improved).replace(/[.!?]+$/g, "");
  improved = shortenIfTooLong(original, improved);

  return sentenceCase(improved);
}

function improveValuePointText(text: string) {
  let original = text.trim();
  let improved = original;

  improved = applyPhraseReplacements(improved);

  const bodyPatterns: Array<[RegExp, string]> = [
    [/\bwe help\b/gi, "We support"],
    [/\bit helps\b/gi, "It supports"],
    [/\bthis helps\b/gi, "This supports"],
    [/\bmake decisions\b/gi, "make informed decisions"],
    [/\bmore efficiently\b/gi, "more effectively"],
  ];

  for (const [pattern, replacement] of bodyPatterns) {
    improved = improved.replace(pattern, replacement);
  }

  improved = improved.replace(/\band\b/gi, " & ");
  improved = normaliseWhitespace(improved);
  improved = preserveEndingPunctuation(original, improved);

  if (improved.toLowerCase() === original.toLowerCase()) {
    improved = preserveEndingPunctuation(
      original,
      normaliseWhitespace(original.replace(/\band\b/gi, " & "))
    );
  }

  improved = shortenIfTooLong(original, improved);

  return sentenceCase(improved);
}

function improveMockText(field: string, text: string) {
  const cleaned = normaliseWhitespace(text);
  if (!cleaned) return cleaned;

  const fieldKey = field.toLowerCase();

  if (fieldKey.includes("eyebrow")) {
    return improveEyebrow(cleaned);
  }

  if (fieldKey.includes("headline")) {
    return improveHeadline(cleaned);
  }

  if (fieldKey.includes("subheading")) {
    return improveSubheading(cleaned);
  }

  if (fieldKey.includes("valuepointtitle")) {
    return improveValuePointTitle(cleaned);
  }

  if (fieldKey.includes("valuepointtext")) {
    return improveValuePointText(cleaned);
  }

  let improved = applyPhraseReplacements(cleaned);
  improved = preserveEndingPunctuation(cleaned, improved);
  improved = shortenIfTooLong(cleaned, improved);

  return improved.trim();
}

export async function POST(req: Request) {
  try {
    const currentUser = getMockCurrentUser(req);

    if (
      !currentUser ||
      !(
        hasPermission(currentUser.role, "block.edit.any") ||
        hasPermission(currentUser.role, "block.edit.own")
      )
    ) {
      return NextResponse.json(
        { error: "You do not have permission to improve block content." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);

    const field = typeof body?.field === "string" ? body.field.trim() : "";
    const text = typeof body?.text === "string" ? body.text.trim() : "";

    if (!field || !text) {
      return NextResponse.json(
        { error: "Missing required field or text." },
        { status: 400 }
      );
    }

    const improved = improveMockText(field, text);

    return NextResponse.json({ improved });
  } catch (error) {
    console.error("Improve route failed:", error);

    return NextResponse.json(
      { error: "Failed to improve field." },
      { status: 500 }
    );
  }
}