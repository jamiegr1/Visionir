import type { Accent, ValuePoint, BlockData } from "@/lib/types";

const ACCENT_BORDER: Record<Accent, string> = {
  blue: "#2f6df6",
  green: "#22c55e",
  orange: "#f59e0b",
  purple: "#7c3aed",
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function makePreviewHtml(data: BlockData) {
  const points = (data.valuePoints || []).slice(0, 4);

  const pointsHtml = points
    .map((point) => {
      const border = ACCENT_BORDER[point.accent] || ACCENT_BORDER.blue;

      return `
        <article class="vp-card" style="border-left-color:${border}">
          <h3>${escapeHtml(point.title || "")}</h3>
          <p>${escapeHtml(point.text || "")}</p>
        </article>
      `;
    })
    .join("");

  const imageHtml = data.imageUrl
    ? `<img src="${escapeHtml(data.imageUrl)}" alt="" />`
    : `<div class="image-placeholder"></div>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<base href="/" />
  <meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" /> 
 <title>Preview</title>
  <style>
    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #ffffff;
      overflow: hidden;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #0f172a;
    }

    body {
      display: flex;
      align-items: stretch;
      justify-content: stretch;
    }

    /* IMPORTANT:
       This is ONLY the block itself.
       No grey stage, no extra outer wrapper, no second framed preview shell.
    */
    .block-shell {
      width: 100%;
      height: 100%;
      background: #ffffff;
      padding: 42px 48px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .block {
      width: 100%;
      max-width: 1120px;
      display: grid;
      grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.82fr);
      gap: 48px;
      align-items: center;
    }

    .content {
      min-width: 0;
    }

    .eyebrow {
      margin: 0 0 14px;
      font-size: 12px;
      line-height: 1;
      font-weight: 800;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #1d63ed;
    }

    .headline {
      margin: 0;
      font-size: 34px;
      line-height: 1.08;
      letter-spacing: -0.035em;
      font-weight: 800;
      color: #0f2343;
      max-width: 580px;
    }

    .subheading {
      margin: 22px 0 0;
      max-width: 700px;
      font-size: 16px;
      line-height: 1.7;
      color: #44556f;
    }

    .rule {
      margin: 28px 0 24px;
      height: 1px;
      background: #e6ebf2;
      border: 0;
    }

    .points {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 24px 24px;
    }

    .vp-card {
      min-height: 126px;
      border: 1px solid #d9e2ec;
      border-left-width: 4px;
      border-radius: 18px;
      background: #ffffff;
      padding: 18px 18px 16px;
      box-shadow: 0 1px 0 rgba(15, 23, 42, 0.02);
    }

    .vp-card h3 {
      margin: 0 0 10px;
      font-size: 14px;
      line-height: 1.45;
      font-weight: 700;
      color: #24364d;
    }

    .vp-card p {
      margin: 0;
      font-size: 13px;
      line-height: 1.75;
      color: #5b6b81;
    }

    .media {
      width: 100%;
    }

    .media-card {
      width: 100%;
      border-radius: 26px;
      overflow: hidden;
      background: #f8fafc;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.10);
      aspect-ratio: 1 / 1;
    }

    .media-card img,
    .image-placeholder {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .image-placeholder {
      background:
        linear-gradient(180deg, rgba(91,124,255,0.10), rgba(255,255,255,0)),
        #f8fafc;
      position: relative;
    }

    .image-placeholder::before {
      content: "";
      position: absolute;
      inset: 18px 18px auto 18px;
      height: 1px;
      background: rgba(148, 163, 184, 0.5);
      box-shadow: 0 10px 0 rgba(148, 163, 184, 0.35);
    }

    @media (max-width: 980px) {
      .block-shell {
        padding: 28px;
      }

      .block {
        grid-template-columns: 1fr;
        gap: 28px;
      }

      .headline {
        max-width: none;
        font-size: 30px;
      }

      .subheading {
        max-width: none;
      }

      .points {
        grid-template-columns: 1fr;
      }

      .media-card {
        aspect-ratio: 16 / 10;
      }
    }
  </style>
</head>
<body>
  <div class="block-shell">
    <section class="block">
      <div class="content">
        <p class="eyebrow">${escapeHtml(data.eyebrow || "")}</p>
        <h1 class="headline">${escapeHtml(data.headline || "")}</h1>
        <p class="subheading">${escapeHtml(data.subheading || "")}</p>
        <div class="rule"></div>
        <div class="points">
          ${pointsHtml}
        </div>
      </div>

      <div class="media">
        <div class="media-card">
          ${imageHtml}
        </div>
      </div>
    </section>
  </div>
</body>
</html>
  `;
}