import type {
  Accent,
  BlockData,
  BlockExtraContent,
  ContactFormExtraContent,
  CtaExtraContent,
  FaqExtraContent,
  LogoCloudExtraContent,
  RichTextExtraContent,
  StatsBandExtraContent,
  TestimonialExtraContent,
} from "@/lib/types";

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

function resolvePreviewImageUrl(data: BlockData) {
  if (data.imageSourceMode === "none") {
    return undefined;
  }

  const raw =
    typeof data.imageUrl === "string" && data.imageUrl.trim()
      ? data.imageUrl.trim()
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
  return value.includes("cta");
}

function isContactComponent(componentType?: string) {
  const value = (componentType || "").toLowerCase();
  return value.includes("contact");
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

function isRichTextComponent(componentType?: string) {
  return (componentType || "").toLowerCase().includes("rich-text");
}

function isMediaTextComponent(componentType?: string) {
  return (componentType || "").toLowerCase().includes("media-text");
}

function asTestimonialExtraContent(
  extraContent?: BlockExtraContent
): TestimonialExtraContent | undefined {
  if (!extraContent) return undefined;
  return extraContent as TestimonialExtraContent;
}

function asCtaExtraContent(
  extraContent?: BlockExtraContent
): CtaExtraContent | undefined {
  if (!extraContent) return undefined;
  return extraContent as CtaExtraContent;
}

function asContactExtraContent(
  extraContent?: BlockExtraContent
): ContactFormExtraContent | undefined {
  if (!extraContent) return undefined;
  return extraContent as ContactFormExtraContent;
}

function asStatsExtraContent(
  extraContent?: BlockExtraContent
): StatsBandExtraContent | undefined {
  if (!extraContent) return undefined;
  return extraContent as StatsBandExtraContent;
}

function asLogoExtraContent(
  extraContent?: BlockExtraContent
): LogoCloudExtraContent | undefined {
  if (!extraContent) return undefined;
  return extraContent as LogoCloudExtraContent;
}

function asFaqExtraContent(
  extraContent?: BlockExtraContent
): FaqExtraContent | undefined {
  if (!extraContent) return undefined;
  return extraContent as FaqExtraContent;
}

function asRichTextExtraContent(
  extraContent?: BlockExtraContent
): RichTextExtraContent | undefined {
  if (!extraContent) return undefined;
  return extraContent as RichTextExtraContent;
}

function getVariant(value?: string) {
  return (value || "").toLowerCase().trim();
}

function buildPointsHtml(points: BlockData["valuePoints"]) {
  return (points || [])
    .slice(0, 6)
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

function buildImageHtml(data: BlockData) {
  const resolvedImageUrl = resolvePreviewImageUrl(data);

  if (!resolvedImageUrl) {
    return `<div class="image-placeholder"></div>`;
  }

  const safeImageUrl = escapeHtml(resolvedImageUrl);
  const safeFallbackUrl = escapeHtml(DEFAULT_BLOCK_IMAGE);

  return `<img src="${safeImageUrl}" alt="" onerror="if(this.dataset.fallbackApplied==='true'){this.style.display='none';}else{this.dataset.fallbackApplied='true';this.src='${safeFallbackUrl}';}" />`;
}

function renderSectionIntro(data: BlockData, compact = false, centered = false) {
  return `
    <div class="section-intro">
      <p class="eyebrow">${escapeHtml(data.eyebrow || "")}</p>
      <h1 class="headline ${compact ? "compact" : ""} ${
    centered ? "centered" : ""
  }">${escapeHtml(data.headline || "")}</h1>
      <p class="subheading ${compact ? "compact" : ""} ${
    centered ? "centered" : ""
  }">${escapeHtml(data.subheading || "")}</p>
    </div>
  `;
}

function renderHeroBlock(data: BlockData) {
  const pointsHtml = buildPointsHtml(data.valuePoints || []);
  const imageHtml = buildImageHtml(data);
  const variant = getVariant(data.componentVariant);

  const centered = variant === "centered";
  const stacked = variant.includes("stacked");
  const imageLeft =
    variant.includes("left-image") ||
    variant.includes("image-left") ||
    variant.includes("media-left");

  const blockClass = centered
    ? "block-centered"
    : stacked
      ? "block-stacked"
      : imageLeft
        ? "block-split-reverse"
        : "block-split";

  return `
    <section class="block ${blockClass}">
      <div class="content">
        <p class="eyebrow">${escapeHtml(data.eyebrow || "")}</p>
        <h1 class="headline ${centered ? "centered" : ""}">${escapeHtml(
    data.headline || ""
  )}</h1>
        <p class="subheading ${centered ? "centered" : ""}">${escapeHtml(
    data.subheading || ""
  )}</p>
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
  const variant = getVariant(data.componentVariant);

  const gridClass =
    variant === "three-up"
      ? "value-grid-cols-3"
      : variant === "four-up"
        ? "value-grid-cols-4"
        : "value-grid-cols-2";

  return `
    <section class="value-grid-block">
      ${renderSectionIntro(data, true, false)}
      <div class="value-grid ${gridClass}">
        ${pointsHtml}
      </div>
    </section>
  `;
}

function renderTestimonialBlock(data: BlockData) {
  const extra = asTestimonialExtraContent(data.extraContent);

  const quote =
    typeof extra?.quote === "string" && extra.quote.trim()
      ? extra.quote.trim()
      : data.subheading?.trim() ||
        "Trusted by organisations that value clarity, control and consistency.";

  const authorName =
    typeof extra?.authorName === "string" && extra.authorName.trim()
      ? extra.authorName.trim()
      : "Client Team";

  const authorRole =
    typeof extra?.authorRole === "string" && extra.authorRole.trim()
      ? extra.authorRole.trim()
      : "Verified Customer";

  const company =
    typeof extra?.company === "string" && extra.company.trim()
      ? extra.company.trim()
      : data.templateName?.trim() || "Visionir Client";

  return `
    <section class="testimonial-block">
      ${renderSectionIntro(data, true, false)}
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
  const extra = asCtaExtraContent(data.extraContent);

  const primaryCtaLabel =
    typeof extra?.primaryCtaLabel === "string" && extra.primaryCtaLabel.trim()
      ? extra.primaryCtaLabel.trim()
      : "Speak to an Expert";

  const secondaryCtaLabel =
    typeof extra?.secondaryCtaLabel === "string" && extra.secondaryCtaLabel.trim()
      ? extra.secondaryCtaLabel.trim()
      : "Learn More";

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

function renderContactBlock(data: BlockData) {
  const extra = asContactExtraContent(data.extraContent);

  const formTitle =
    typeof extra?.formTitle === "string" && extra.formTitle.trim()
      ? extra.formTitle.trim()
      : "Start Your Enquiry";

  const submitLabel =
    typeof extra?.submitLabel === "string" && extra.submitLabel.trim()
      ? extra.submitLabel.trim()
      : "Submit Enquiry";

  return `
    <section class="contact-block">
      <div class="contact-layout">
        <div class="contact-content">
          <p class="eyebrow">${escapeHtml(data.eyebrow || "")}</p>
          <h1 class="headline compact">${escapeHtml(data.headline || "")}</h1>
          <p class="subheading compact">${escapeHtml(data.subheading || "")}</p>
        </div>

        <div class="contact-form-card">
          <div class="form-title">${escapeHtml(formTitle)}</div>
          <div class="form-field"></div>
          <div class="form-field"></div>
          <div class="form-field form-field-large"></div>
          <button class="form-submit">${escapeHtml(submitLabel)}</button>
        </div>
      </div>
    </section>
  `;
}

function renderStatsBlock(data: BlockData) {
  const extra = asStatsExtraContent(data.extraContent);
  const stats = Array.isArray(extra?.stats) ? extra.stats.slice(0, 4) : [];

  const statsHtml =
    stats.length > 0
      ? stats
          .map((item) => {
            const statValue =
              typeof item.value === "string" && item.value.trim()
                ? item.value.trim()
                : "120+";
            const statLabel =
              typeof item.label === "string" && item.label.trim()
                ? item.label.trim()
                : "Metric";

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
      ${renderSectionIntro(data, true, false)}
      <div class="stats-grid">
        ${statsHtml}
      </div>
    </section>
  `;
}

function renderLogoBlock(data: BlockData) {
  const extra = asLogoExtraContent(data.extraContent);
  const logos = Array.isArray(extra?.logos) ? extra.logos.slice(0, 8) : [];

  const logosHtml =
    logos.length > 0
      ? logos
          .map((item) => {
            const name =
              typeof item.name === "string" && item.name.trim()
                ? item.name.trim()
                : "Trusted Brand";

            return `<div class="logo-chip">${escapeHtml(name)}</div>`;
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
      ${renderSectionIntro(data, true, true)}
      <div class="logo-grid">
        ${logosHtml}
      </div>
    </section>
  `;
}

function renderFaqBlock(data: BlockData) {
  const extra = asFaqExtraContent(data.extraContent);
  const faqItems = Array.isArray(extra?.faqItems) ? extra.faqItems.slice(0, 6) : [];

  const faqHtml =
    faqItems.length > 0
      ? faqItems
          .map(
            (item) => `
              <article class="faq-item">
                <h3>${escapeHtml(item.question || "Question")}</h3>
                <p>${escapeHtml(item.answer || "Answer")}</p>
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
      ${renderSectionIntro(data, true, false)}
      <div class="faq-list">
        ${faqHtml}
      </div>
    </section>
  `;
}

function renderRichTextBlock(data: BlockData) {
  const extra = asRichTextExtraContent(data.extraContent);
  const body =
    typeof extra?.body === "string" && extra.body.trim()
      ? extra.body.trim()
      : "This section provides supporting information in a clean editorial format.";

  return `
    <section class="rich-text-block">
      ${renderSectionIntro(data, true, false)}
      <div class="rich-text-card">
        <p>${escapeHtml(body)}</p>
      </div>
    </section>
  `;
}

function renderMediaTextBlock(data: BlockData) {
  const extra = asRichTextExtraContent(data.extraContent);
  const body =
    typeof extra?.body === "string" && extra.body.trim()
      ? extra.body.trim()
      : data.subheading;

  const imageHtml = buildImageHtml(data);
  const variant = getVariant(data.componentVariant);

  const stacked = variant.includes("stacked");
  const reverse =
    variant.includes("media-left") ||
    variant.includes("image-left") ||
    variant.includes("left-image");

  const layoutClass = stacked
    ? "media-text-stacked"
    : reverse
      ? "media-text-split media-text-reverse"
      : "media-text-split";

  return `
    <section class="media-text-block ${layoutClass}">
      <div class="media-text-copy">
        <p class="eyebrow">${escapeHtml(data.eyebrow || "")}</p>
        <h1 class="headline compact">${escapeHtml(data.headline || "")}</h1>
        <p class="subheading compact">${escapeHtml(body || "")}</p>
      </div>

      <div class="media-text-media">
        <div class="media-card">
          ${imageHtml}
        </div>
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

  if (isContactComponent(componentType)) {
    return renderContactBlock(data);
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

  if (isRichTextComponent(componentType)) {
    return renderRichTextBlock(data);
  }

  if (isMediaTextComponent(componentType)) {
    return renderMediaTextBlock(data);
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

  const background = data.design?.background || "#ffffff";
  const surface = data.design?.surface || "#ffffff";
  const headingColor = data.design?.headingColor || "#0f2343";
  const textColor = data.design?.textColor || "#44556f";
  const eyebrowColor = data.design?.eyebrowColor || "#1d63ed";
  const shadow = data.design?.shadow === "soft"
    ? "0 18px 40px rgba(15, 23, 42, 0.10)"
    : "0 24px 60px rgba(15, 23, 42, 0.16)";
  const radius =
    data.design?.borderRadius === "xl" ? "26px" : "18px";

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
      background: ${background};
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: ${headingColor};
    }

    body {
      display: block;
    }

    .block-shell {
      width: 100%;
      min-height: 100vh;
      background: ${background};
      padding: 42px 48px;
      display: flex;
      align-items: flex-start;
      justify-content: center;
    }

    .block,
    .value-grid-block,
    .testimonial-block,
    .cta-block,
    .contact-block,
    .stats-block,
    .logo-block,
    .faq-block,
    .rich-text-block,
    .media-text-block {
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

    .block-split-reverse {
      grid-template-columns: minmax(320px, 0.82fr) minmax(0, 1.05fr);
    }

    .block-split-reverse .media {
      order: 1;
    }

    .block-split-reverse .content {
      order: 2;
    }

    .block-stacked {
      grid-template-columns: 1fr;
      gap: 28px;
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
      color: ${eyebrowColor};
    }

    .headline {
      margin: 0;
      font-size: 34px;
      line-height: 1.08;
      letter-spacing: -0.035em;
      font-weight: 800;
      color: ${headingColor};
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
      color: ${textColor};
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

    .points {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 24px;
      margin-top: 30px;
    }

    .value-grid {
      display: grid;
      gap: 24px;
      margin-top: 30px;
    }

    .value-grid-cols-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .value-grid-cols-3 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .value-grid-cols-4 {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .vp-card {
      min-height: 126px;
      border: 1px solid #d9e2ec;
      border-left-width: 4px;
      border-radius: ${radius};
      background: ${surface};
      padding: 18px 18px 16px;
      box-shadow: 0 1px 0 rgba(15, 23, 42, 0.02);
    }

    .vp-card h3 {
      margin: 0 0 10px;
      font-size: 14px;
      line-height: 1.45;
      font-weight: 700;
      color: ${headingColor};
    }

    .vp-card p {
      margin: 0;
      font-size: 13px;
      line-height: 1.75;
      color: ${textColor};
    }

    .media {
      width: 100%;
    }

    .media-card {
      width: 100%;
      border-radius: ${radius};
      overflow: hidden;
      background: #f8fafc;
      box-shadow: ${shadow};
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
      border-radius: ${radius};
      background: linear-gradient(180deg, ${surface} 0%, #f8fbff 100%);
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
      color: ${headingColor};
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
      color: ${headingColor};
    }

    .author-role {
      margin-top: 4px;
      font-size: 13px;
      color: ${textColor};
    }

    .cta-panel {
      border-radius: ${radius};
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

    .contact-layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(320px, 0.9fr);
      gap: 32px;
      align-items: start;
    }

    .contact-form-card {
      border: 1px solid #d9e2ec;
      border-radius: ${radius};
      background: ${surface};
      padding: 24px;
      box-shadow: 0 14px 32px rgba(15, 23, 42, 0.06);
    }

    .form-title {
      font-size: 18px;
      font-weight: 700;
      color: ${headingColor};
      margin-bottom: 18px;
    }

    .form-field {
      height: 48px;
      border-radius: 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      margin-bottom: 12px;
    }

    .form-field-large {
      height: 110px;
    }

    .form-submit {
      width: 100%;
      min-height: 48px;
      border: 0;
      border-radius: 14px;
      background: #1d4ed8;
      color: white;
      font-size: 14px;
      font-weight: 700;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 22px;
      margin-top: 30px;
    }

    .stat-card {
      border: 1px solid #d9e2ec;
      border-radius: ${radius};
      background: ${surface};
      padding: 24px 22px;
      box-shadow: 0 10px 28px rgba(15, 23, 42, 0.04);
    }

    .stat-value {
      font-size: 36px;
      line-height: 1;
      font-weight: 800;
      letter-spacing: -0.04em;
      color: ${headingColor};
    }

    .stat-label {
      margin-top: 10px;
      font-size: 14px;
      line-height: 1.6;
      color: ${textColor};
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
      background: ${surface};
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
      background: ${surface};
      padding: 20px 20px 18px;
      box-shadow: 0 6px 18px rgba(15, 23, 42, 0.03);
    }

    .faq-item h3 {
      margin: 0 0 10px;
      font-size: 16px;
      line-height: 1.4;
      font-weight: 700;
      color: ${headingColor};
    }

    .faq-item p {
      margin: 0;
      font-size: 14px;
      line-height: 1.7;
      color: ${textColor};
    }

    .rich-text-card {
      border: 1px solid #d9e2ec;
      border-radius: ${radius};
      background: ${surface};
      padding: 24px;
      box-shadow: 0 8px 22px rgba(15, 23, 42, 0.03);
    }

    .rich-text-card p {
      margin: 0;
      font-size: 15px;
      line-height: 1.8;
      color: ${textColor};
    }

    .media-text-block {
      display: grid;
      gap: 32px;
      align-items: center;
    }

    .media-text-split {
      grid-template-columns: minmax(0, 1fr) minmax(320px, 0.9fr);
    }

    .media-text-reverse .media-text-copy {
      order: 2;
    }

    .media-text-reverse .media-text-media {
      order: 1;
    }

    .media-text-stacked {
      grid-template-columns: 1fr;
    }

    @media (max-width: 1160px) {
      .value-grid-cols-4 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .value-grid-cols-3 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .logo-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 980px) {
      .block-shell {
        padding: 28px;
      }

      .block-split,
      .block-split-reverse,
      .contact-layout,
      .media-text-split {
        grid-template-columns: 1fr;
        gap: 28px;
      }

      .block-split-reverse .content,
      .block-split-reverse .media,
      .media-text-reverse .media-text-copy,
      .media-text-reverse .media-text-media {
        order: initial;
      }
ss
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