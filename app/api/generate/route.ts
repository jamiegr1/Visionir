import { NextResponse } from "next/server";
import type { BlockData } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const blockName =
    typeof body?.blockName === "string" && body.blockName.trim()
      ? body.blockName.trim()
      : "Why Choose Kiwa Agri-Food";

  const location =
    typeof body?.location === "string" && body.location.trim()
      ? body.location.trim()
      : "Kiwa Agri-Food";

  const blockData: BlockData = {
    eyebrow: location.toUpperCase(),
    headline: blockName,
    subheading:
      "From accredited certification to tailored technical support, Kiwa Agri-Food gives you confidence in compliance, credibility and business growth.",
    imageUrl: "/farmer.jpg",
    valuePoints: [
      {
        title: "Independent and UKAS-accredited",
        text: "Across food safety, feed and organic standards — with 20+ years of certified service under ISO/IEC 17065.",
        accent: "blue",
      },
      {
        title: "Holistic technical support",
        text: "From certification to training — tailored to your operations and supported by in-house technical experts.",
        accent: "green",
      },
      {
        title: "Local auditors, practical insight",
        text: "Support that fits the realities of your operation, with clear guidance and responsive coordination.",
        accent: "orange",
      },
      {
        title: "Scalable enterprise assurance",
        text: "From local needs to complex supply chains — backed by global Kiwa expertise and consistent governance.",
        accent: "purple",
      },
    ],
    design: {
      theme: "enterprise",
      layout: "split",
      cardStyle: "soft",
      headingAlign: "left",
      borderRadius: "xl",
      shadow: "soft",
      background: "#f5f7fb",
      surface: "#ffffff",
      headingColor: "#0f172a",
      textColor: "#475569",
      eyebrowColor: "#1457d1",
      cardColors: {
        blue: "#3b82f6",
        green: "#22c55e",
        orange: "#f59e0b",
        purple: "#8b5cf6",
      },
    },
  };

  return NextResponse.json({
    ok: true,
    blockData,
    notes: ["Mock output generated successfully."],
  });
}

export async function GET() {
  return NextResponse.json({ ok: true, hint: "POST to this endpoint" });
}