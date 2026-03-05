import { NextResponse } from "next/server";

type BlockData = {
  eyebrow: string;
  headline: string;
  subheading: string;
  imageUrl?: string;
  valuePoints: Array<{ title: string; text: string; accent: "blue" | "green" | "orange" | "purple" }>;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const blockName =
    typeof (body as any)?.blockName === "string" ? (body as any).blockName : "Why Choose Kiwa Agri-Food";

  // MVP: return structured data (safe to edit) + css template.
  const blockData: BlockData = {
    eyebrow: "THE STRATEGIC ADVANTAGE OF PARTNERING WITH KIWA AGRI-FOOD",
    headline: "Why Partner with Us",
    subheading:
      "From accredited certification to tailored technical support, Kiwa Agri-Food gives you confidence in compliance, credibility and business growth.",
    imageUrl: "/farmer.jpg", // optional: put an image in /public/farmer.jpg
    valuePoints: [
      {
        title: "Independent and UKAS-accredited",
        text: "Across food safety, feed and organic standards — with 20+ years of certified service under ISO/IEC 17065.",
        accent: "blue",
      },
      {
        title: "Holistic support",
        text: "From certification to training — tailored to your operations and supported by in-house technical experts.",
        accent: "purple",
      },
      {
        title: "Practical insight",
        text: "Local auditors offering guidance that fits the realities of your operation.",
        accent: "orange",
      },
      {
        title: "Scalable assurance",
        text: "Support for SMEs through to complex supply chains — backed by global Kiwa expertise.",
        accent: "green",
      },
    ],
  };

  const css = `
.visionir-wrap{padding:56px 0;background:#fff;color:#0b1220;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial}
.visionir-inner{max-width:1100px;margin:0 auto;padding:0 22px}
.visionir-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:28px;align-items:start}
.visionir-eyebrow{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#2b5cff;margin:0 0 12px}
.visionir-h{font-size:42px;line-height:1.05;margin:0 0 14px}
.visionir-sub{font-size:15px;line-height:1.7;color:#334155;margin:0 0 18px;max-width:70ch}
.visionir-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:14px}
.visionir-card{border:1px solid #e2e8f0;border-radius:14px;padding:14px;background:#fff}
.visionir-card .t{margin:0 0 6px;font-size:13px;color:#0f172a;font-weight:700}
.visionir-card .p{margin:0;color:#475569;font-size:13px;line-height:1.55}
.visionir-card.ac-blue{box-shadow:inset 3px 0 0 #2b5cff}
.visionir-card.ac-purple{box-shadow:inset 3px 0 0 #7c3aed}
.visionir-card.ac-orange{box-shadow:inset 3px 0 0 #f59e0b}
.visionir-card.ac-green{box-shadow:inset 3px 0 0 #22c55e}
.visionir-img{border-radius:18px;overflow:hidden;box-shadow:0 18px 50px rgba(15,23,42,.18)}
.visionir-img img{display:block;width:100%;height:auto}
@media (max-width: 920px){.visionir-grid{grid-template-columns:1fr}.visionir-h{font-size:34px}.visionir-cards{grid-template-columns:1fr}}
`.trim();

  return NextResponse.json({
    name: blockName,
    blockData,
    css,
    notes: ["Mock output (next step: connect a real LLM)."],
  });
}

export async function GET() {
  return NextResponse.json({ ok: true, hint: "POST to this endpoint" });
}