import type { BlockData } from "@/lib/types";

function esc(s: string) {
  return (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function makePreviewHtml(data: BlockData) {
  const eyebrow = esc(data.eyebrow);
  const headline = esc(data.headline);
  const sub = esc(data.subheading);

  const accentMap: Record<string, string> = {
    blue: "#0B5CAB",
    green: "#0A7A4B",
    orange: "#D97A00",
    purple: "#6A4BD9",
  };

  const cards = (data.valuePoints || [])
    .slice(0, 4)
    .map((vp) => {
      const c = accentMap[vp.accent] || "#0B5CAB";
      return `
        <div class="card" style="border-color:${c}1f">
          <div class="bar" style="background:${c}"></div>
          <div class="ct">${esc(vp.title)}</div>
          <div class="cb">${esc(vp.text)}</div>
        </div>
      `;
    })
    .join("");

  const img = data.imageUrl
    ? `<img class="img" src="${esc(data.imageUrl)}" alt="" />`
    : `<div class="img placeholder"><div class="ph">Image placeholder</div></div>`;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  :root{
    --ink:#0B1F3B;
    --muted:#5B6B7C;
    --bg:#ffffff;
    --shadow: 0 18px 55px rgba(15,23,42,0.12);
  }
  *{box-sizing:border-box}
  body{
    margin:0;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
    color:var(--ink);
    background:#fff;
  }
  .wrap{
    padding:34px;
  }
  .layout{
    display:grid;
    grid-template-columns: 1.15fr 0.95fr;
    gap:34px;
    align-items:start;
  }
  .eyebrow{
    font-size:11px;
    letter-spacing:1.4px;
    font-weight:800;
    color:#0B5CAB;
    text-transform:uppercase;
  }
  h1{
    margin:10px 0 12px;
    font-size:40px;
    line-height:1.08;
    letter-spacing:-0.02em;
  }
  .sub{
    max-width:52ch;
    font-size:14px;
    line-height:1.6;
    color:var(--muted);
    margin-bottom:18px;
  }
  .grid{
    margin-top:10px;
    display:grid;
    grid-template-columns: 1fr 1fr;
    gap:12px;
    max-width:640px;
  }
  .card{
    position:relative;
    border:1px solid rgba(15,23,42,0.10);
    border-radius:14px;
    background:#fff;
    padding:14px 14px 14px 14px;
    box-shadow: 0 10px 26px rgba(15,23,42,0.06);
    overflow:hidden;
    min-height:104px;
  }
  .bar{
    position:absolute;
    top:0; left:0; bottom:0;
    width:3px;
    opacity:0.9;
  }
  .ct{
    font-weight:800;
    font-size:12px;
    margin-left:8px;
  }
  .cb{
    margin-left:8px;
    margin-top:6px;
    font-size:12px;
    line-height:1.5;
    color:var(--muted);
  }
  .img{
    width:100%;
    border-radius:22px;
    height:340px;
    object-fit:cover;
    box-shadow: var(--shadow);
    border:1px solid rgba(15,23,42,0.10);
  }
  .placeholder{
    display:grid;
    place-items:center;
    background: linear-gradient(135deg, rgba(11,92,171,0.10), rgba(15,23,42,0.06));
  }
  .ph{
    color:rgba(15,23,42,0.55);
    font-weight:700;
    font-size:13px;
  }

  /* responsive inside iframe */
  @media (max-width: 860px){
    .layout{ grid-template-columns:1fr; }
    h1{ font-size:32px; }
    .img{ height:280px; }
  }
</style>
</head>
<body>
  <div class="wrap">
    <div class="layout">
      <div>
        <div class="eyebrow">${eyebrow}</div>
        <h1>${headline}</h1>
        <div class="sub">${sub}</div>
        <div class="grid">${cards}</div>
      </div>
      <div>${img}</div>
    </div>
  </div>
</body>
</html>`;
}