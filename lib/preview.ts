import type { Accent, BlockData } from "@/lib/types";

const ACCENT_BORDER: Record<Accent, string> = {
  blue: "#2f6df6",
  green: "#22c55e",
  orange: "#f59e0b",
  purple: "#7c3aed",
};

const DEFAULT_BLOCK_IMAGE = "/farmerimage.jpg";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolvePreviewImageUrl(imageUrl?: string) {
  const raw =
    typeof imageUrl === "string" && imageUrl.trim()
      ? imageUrl.trim()
      : DEFAULT_BLOCK_IMAGE;

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  const cleanPath = raw.startsWith("/") ? raw : `/${raw}`;
  return cleanPath;
}

function isHeroComponent(componentType?: string) {
  return (componentType || "").toLowerCase().includes("hero");
}

function isValueGridComponent(componentType?: string) {
  const value = (componentType || "").toLowerCase();
  return (
    value.includes("value") ||
    value.includes("benefit") ||
    value.includes("feature")
  );
}

function isTestimonialComponent(componentType?: string) {
  const value = (componentType || "").toLowerCase();
  return value.includes("testimonial") || value.includes("quote");
}

function isCtaComponent(componentType?: string) {
  const value = (componentType || "").toLowerCase();
  return (
    value.includes("cta") ||
    value.includes("contact") ||
    value.includes("conversion")
  );
}

function isStatsComponent(componentType?: string) {
  return (componentType || "").toLowerCase().includes("stats");
}

function isLogoComponent(componentType?: string) {
  const value = (componentType || "").toLowerCase();
  return value.includes("logo") || value.includes("trust");
}

function isFaqComponent(componentType?: string) {
  return (componentType || "").toLowerCase().includes("faq");
}

function buildPointsHtml(points: BlockData["valuePoints"]) {
  return (points || [])
    .slice(0, 4)
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
}

function buildImageHtml(imageUrl?: string) {
  const resolvedImageUrl = resolvePreviewImageUrl(imageUrl);
  const safeImageUrl = escapeHtml(resolvedImageUrl);
  const safeFallbackUrl = escapeHtml(DEFAULT_BLOCK_IMAGE);

  return resolvedImageUrl
    ? `<img src="${safeImageUrl}" alt="" onerror="if(this.dataset.fallbackApplied==='true'){this.style.display='none';}else{this.dataset.fallbackApplied='true';this.src='${safeFallbackUrl}';}" />`
    : `<div class="image-placeholder"></div>`;
}

function renderHeroBlock(data: BlockData) {
  const pointsHtml = buildPointsHtml(data.valuePoints || []);
  const imageHtml = buildImageHtml(data.imageUrl);
  const centered = data.componentVariant === "centered";

  return `
    <section class="block ${centered ? "block-centered" : "block-split"}">
      <div class="content">
        <p class="eyebrow">${escapeHtml(data.eyebrow || "")}</p>
        <h1 class="headline">${escapeHtml(data.headline || "")}</h1>
        <p class="subheading">${escapeHtml(data.subheading || "")}</p>
        ${
          pointsHtml
            ? `
          <div class="rule"></div>
          <div class="points">
            ${pointsHtml}
          </div>
        `
            : ""
        }
      </div>

      <div class="media">
        <div class="media-card">
          ${imageHtml}
        </div>
      </div>
    </section>
  `;
}

function renderValueGridBlock(data: BlockData) {
  const pointsHtml = buildPointsHtml(data.valuePoints || []);

  return `
    <section class="value-grid-block">
      <div class="section-intro">
        <p class="eyebrow">${escapeHtml(data.eyebrow || "")}</p>
        <h1 class="headline compact">${escapeHtml(data.headline || "")}</h1>
        <p class="subheading compact">${escapeHtml(data.subheading || "")}</p>
      </div>

      <div class="value-grid">
        ${pointsHtml}
      </div>
    </section>
  `;
}

function renderTestimonialBlock(data: BlockData) {
  const quote =
    data.subheading?.trim() ||
    "Trusted by organisations that value clarity, control and consistency.";

  const authorName = data.pageName?.trim() || "Client Team";
  const authorRole = data.sectionLabel?.trim() || "Verified Customer";
  const company = data.templateName?.trim() || "Visionir Client";

  return `
    <section class="testimonial-block">
      <p class="eyebrow">${escapeHtml(data.eyebrow || "")}</p>
      <h1 class="headline compact">${escapeHtml(data.headline || "")}</h1>
      <div class="testimonial-card">
        <div class="quote-mark">“</div>
        <blockquote>${escapeHtml(quote)}</blockquote>
        <div class="testimonial-meta">
          <div class="avatar">${escapeHtml(authorName.charAt(0).toUpperCase())}</div>
          <div>
            <div class="author-name">${escapeHtml(authorName)}</div>
            <div class="author-role">${escapeHtml(authorRole)} • ${escapeHtml(company)}</div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderCtaBlock(data: BlockData) {
  const primaryCtaLabel = "Speak to an Expert";
  const secondaryCtaLabel = "Learn More";

  return `
    <section class="cta-block">
      <div class="cta-panel">
        <p class="eyebrow">${escapeHtml(data.eyebrow || "")}</p>
        <h1 class="headline compact centered">${escapeHtml(data.headline || "")}</h1>
        <p class="subheading compact centered">${escapeHtml(data.subheading || "")}</p>

        <div class="cta-actions">
          <a class="cta-button cta-primary" href="#">${escapeHtml(primaryCtaLabel)}</a>
          <a class="cta-button cta-secondary" href="#">${escapeHtml(secondaryCtaLabel)}</a>
        </div>
      </div>
    </section>
  `;
}

function renderStatsBlock(data: BlockData) {
  const points = (data.valuePoints || []).slice(0, 4);

  const statsHtml =
    points.length > 0
      ? points
          .map((point) => {
            const statValue = point.title || "120+";
            const statLabel = point.text || "Metric";

            return `
              <article class="stat-card">
                <div class="stat-value">${escapeHtml(statValue)}</div>
                <div class="stat-label">${escapeHtml(statLabel)}</div>
              </article>
            `;
          })
          .join("")
      : `
        <article class="stat-card">
          <div class="stat-value">120+</div>
          <div class="stat-label">Projects Delivered</div>
        </article>
        <article class="stat-card">
          <div class="stat-value">42</div>
          <div class="stat-label">Regions Supported</div>
        </article>
        <article class="stat-card">
          <div class="stat-value">350+</div>
          <div class="stat-label">Governed Components</div>
        </article>
      `;

  return `
    <section class="stats-block">
      <div class="section-intro">
        <p class="eyebrow">${escapeHtml(data.eyebrow || "")}</p>
        <h1 class="headline compact">${escapeHtml(data.headline || "")}</h1>
        <p class="subheading compact">${escapeHtml(data.subheading || "")}</p>
      </div>

      <div class="stats-grid">
        ${statsHtml}
      </div>
    </section>
  `;
}

function renderLogoBlock(data: BlockData) {
  const points = (data.valuePoints || []).slice(0, 6);

  const logosHtml =
    points.length > 0
      ? points
          .map((point) => {
            const name = point.title || "Trusted Brand";

            return `
              <div class="logo-chip">${escapeHtml(name)}</div>
            `;
          })
          .join("")
      : `
        <div class="logo-chip">Enterprise Partner 1</div>
        <div class="logo-chip">Enterprise Partner 2</div>
        <div class="logo-chip">Enterprise Partner 3</div>
        <div class="logo-chip">Enterprise Partner 4</div>
      `;

  return `
    <section class="logo-block">
      <div class="section-intro">
        <p class="eyebrow">${escapeHtml(data.eyebrow || "")}</p>
        <h1 class="headline compact centered">${escapeHtml(data.headline || "")}</h1>
        <p class="subheading compact centered">${escapeHtml(data.subheading || "")}</p>
      </div>

      <div class="logo-grid">
        ${logosHtml}
      </div>
    </section>
  `;
}

function renderFaqBlock(data: BlockData) {
  const items = (data.valuePoints || []).slice(0, 4);

  const faqHtml =
    items.length > 0
      ? items
          .map(
            (item) => `
              <article class="faq-item">
                <h3>${escapeHtml(item.title || "Question")}</h3>
                <p>${escapeHtml(item.text || "Answer")}</p>
              </article>
            `
          )
          .join("")
      : `
        <article class="faq-item">
          <h3>What does this include?</h3>
          <p>A governed structure designed for clarity, consistency and reuse.</p>
        </article>
        <article class="faq-item">
          <h3>Can this be reused across pages?</h3>
          <p>Yes, it is designed to support repeatable, enterprise-ready workflows.</p>
        </article>
      `;

  return `
    <section class="faq-block">
      <div class="section-intro">
        <p class="eyebrow">${escapeHtml(data.eyebrow || "")}</p>
        <h1 class="headline compact">${escapeHtml(data.headline || "")}</h1>
        <p class="subheading compact">${escapeHtml(data.subheading || "")}</p>
      </div>

      <div class="faq-list">
        ${faqHtml}
      </div>
    </section>
  `;
}

function renderDefaultBlock(data: BlockData) {
  return renderHeroBlock(data);
}

function renderBlockByType(data: BlockData) {
  const componentType = data.componentType || "";

  if (isTestimonialComponent(componentType)) {
    return renderTestimonialBlock(data);
  }

  if (isCtaComponent(componentType)) {
    return renderCtaBlock(data);
  }

  if (isStatsComponent(componentType)) {
    return renderStatsBlock(data);
  }

  if (isLogoComponent(componentType)) {
    return renderLogoBlock(data);
  }

  if (isFaqComponent(componentType)) {
    return renderFaqBlock(data);
  }

  if (isValueGridComponent(componentType)) {
    return renderValueGridBlock(data);
  }

  if (isHeroComponent(componentType)) {
    return renderHeroBlock(data);
  }

  return renderDefaultBlock(data);
}

export function makePreviewHtml(data: BlockData) {
  const renderedBlock = renderBlockByType(data);

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
      min-height: 100%;
      background: #ffffff;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #0f172a;
    }

    body {
      display: block;
    }

    .block-shell {
      width: 100%;
      min-height: 100vh;
      background: #ffffff;
      padding: 42px 48px;
      display: flex;
      align-items: flex-start;
      justify-content: center;
    }

    .block,
    .value-grid-block,
    .testimonial-block,
    .cta-block,
    .stats-block,
    .logo-block,
    .faq-block {
      width: 100%;
      max-width: 1120px;
    }

    .block {
      display: grid;
      gap: 48px;
      align-items: center;
    }

    .block-split {
      grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.82fr);
    }

    .block-centered {
      grid-template-columns: 1fr;
      text-align: center;
    }

    .block-centered .content {
      max-width: 860px;
      margin: 0 auto;
    }

    .block-centered .headline,
    .block-centered .subheading {
      margin-left: auto;
      margin-right: auto;
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

    .headline.compact {
      max-width: 760px;
      font-size: 30px;
    }

    .headline.centered {
      margin-left: auto;
      margin-right: auto;
      text-align: center;
    }

    .subheading {
      margin: 22px 0 0;
      max-width: 700px;
      font-size: 16px;
      line-height: 1.7;
      color: #44556f;
    }

    .subheading.compact {
      max-width: 760px;
    }

    .subheading.centered {
      margin-left: auto;
      margin-right: auto;
      text-align: center;
    }

    .rule {
      margin: 28px 0 24px;
      height: 1px;
      background: #e6ebf2;
      border: 0;
    }

    .points,
    .value-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 24px;
      margin-top: 30px;
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

    .section-intro {
      margin-bottom: 30px;
    }

    .testimonial-card {
      position: relative;
      margin-top: 28px;
      border: 1px solid #d9e2ec;
      border-radius: 24px;
      background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
      padding: 34px 30px 26px;
      box-shadow: 0 14px 32px rgba(15, 23, 42, 0.06);
    }

    .quote-mark {
      position: absolute;
      top: 18px;
      left: 24px;
      font-size: 48px;
      line-height: 1;
      font-weight: 700;
      color: #c9d8ff;
    }

    .testimonial-card blockquote {
      margin: 0;
      padding-top: 18px;
      font-size: 22px;
      line-height: 1.6;
      letter-spacing: -0.02em;
      color: #0f2343;
    }

    .testimonial-meta {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-top: 24px;
    }

    .avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 999px;
      background: #e9efff;
      color: #2f6df6;
      font-size: 16px;
      font-weight: 700;
    }

    .author-name {
      font-size: 14px;
      font-weight: 700;
      color: #0f2343;
    }

    .author-role {
      margin-top: 4px;
      font-size: 13px;
      color: #64748b;
    }

    .cta-panel {
      border-radius: 28px;
      padding: 40px 34px;
      background: linear-gradient(135deg, #0f2343 0%, #1d4ed8 100%);
      color: white;
      text-align: center;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
    }

    .cta-panel .eyebrow {
      color: #c8d8ff;
    }

    .cta-panel .headline {
      color: white;
      max-width: 760px;
    }

    .cta-panel .subheading {
      color: rgba(255, 255, 255, 0.82);
      max-width: 760px;
    }

    .cta-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 14px;
      margin-top: 28px;
    }

    .cta-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 48px;
      padding: 0 18px;
      border-radius: 14px;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
    }

    .cta-primary {
      background: white;
      color: #0f2343;
    }

    .cta-secondary {
      background: rgba(255,255,255,0.12);
      color: white;
      border: 1px solid rgba(255,255,255,0.18);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 22px;
      margin-top: 30px;
    }

    .stat-card {
      border: 1px solid #d9e2ec;
      border-radius: 22px;
      background: white;
      padding: 24px 22px;
      box-shadow: 0 10px 28px rgba(15, 23, 42, 0.04);
    }

    .stat-value {
      font-size: 36px;
      line-height: 1;
      font-weight: 800;
      letter-spacing: -0.04em;
      color: #0f2343;
    }

    .stat-label {
      margin-top: 10px;
      font-size: 14px;
      line-height: 1.6;
      color: #5b6b81;
    }

    .logo-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
      margin-top: 30px;
    }

    .logo-chip {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 72px;
      border: 1px solid #d9e2ec;
      border-radius: 18px;
      background: white;
      padding: 12px;
      text-align: center;
      font-size: 14px;
      font-weight: 700;
      color: #334155;
      box-shadow: 0 8px 22px rgba(15, 23, 42, 0.03);
    }

    .faq-list {
      display: grid;
      gap: 16px;
      margin-top: 30px;
    }

    .faq-item {
      border: 1px solid #d9e2ec;
      border-radius: 18px;
      background: white;
      padding: 20px 20px 18px;
      box-shadow: 0 6px 18px rgba(15, 23, 42, 0.03);
    }

    .faq-item h3 {
      margin: 0 0 10px;
      font-size: 16px;
      line-height: 1.4;
      font-weight: 700;
      color: #24364d;
    }

    .faq-item p {
      margin: 0;
      font-size: 14px;
      line-height: 1.7;
      color: #5b6b81;
    }

    @media (max-width: 980px) {
      .block-shell {
        padding: 28px;
      }

      .block-split {
        grid-template-columns: 1fr;
        gap: 28px;
      }

      .headline {
        max-width: none;
        font-size: 30px;
      }

      .headline.compact {
        font-size: 28px;
      }

      .subheading {
        max-width: none;
      }

      .points,
      .value-grid,
      .stats-grid,
      .logo-grid {
        grid-template-columns: 1fr;
      }

      .media-card {
        aspect-ratio: 16 / 10;
      }

      .testimonial-card blockquote {
        font-size: 18px;
      }

      .cta-panel {
        padding: 30px 22px;
      }
    }
  </style>
</head>
<body>
  <div class="block-shell">
    ${renderedBlock}
  </div>
</body>
</html>
  `;
}