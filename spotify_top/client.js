// spotify_top, Spectra list-with-hero archetype. The #1 item from
// the chosen window (tracks / artists / albums-derived) sits as a
// large cover-art card on the left; the remaining items form a
// vertical list of small art + name + secondary rows on the right.
// Size-tiered:
//
//   sm  hero only (no list); time-range chip in the title row.
//   md  hero + 3 list rows (default cell footprint).
//   lg  hero + 5 list rows + a "of N" footnote pinned to the time
//       range so a long list still reads as a window snapshot, not
//       an unbounded scroll.
//
// The shape ctx.data follows is:
//   {
//     kind:       "tracks" | "artists" | "albums",
//     time_range: "short_term" | "medium_term" | "long_term",
//     items: [
//       { name, secondary, art_large, art_small,
//         album?, track_count?, followers?, popularity? },
//       ...
//     ],
//   }

const TIME_LABEL = {
  short_term:  "Last 4 weeks",
  medium_term: "Last 6 months",
  long_term:   "All time",
};

const KIND_LABEL = {
  tracks:  "Top tracks",
  artists: "Top artists",
  albums:  "Top albums",
};

const KIND_ICON = {
  tracks:  "ph-music-notes",
  artists: "ph-user-circle",
  albums:  "ph-vinyl-record",
};

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function placeholderArt(seed) {
  // No-art fallback: a tinted square so the layout doesn't reflow
  // when an artist/album has no image attached. Seeded so a given
  // missing-art item keeps the same shade across renders rather than
  // flickering between cells.
  const hash = String(seed || "").split("")
    .reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0);
  const hue = Math.abs(hash) % 360;
  return `linear-gradient(135deg,
    hsl(${hue}, 25%, 78%),
    hsl(${(hue + 30) % 360}, 30%, 64%))`;
}

function heroCard(item, rank, showRank) {
  const name = escapeHtml(item?.name || "");
  const secondary = escapeHtml(item?.secondary || "");
  const art = item?.art_large || item?.art_small;
  const artStyle = art
    ? `background-image: url('${escapeHtml(art)}'); background-size: cover; background-position: center;`
    : `background: ${placeholderArt(item?.name)};`;
  const rankBadge = showRank
    ? `<span class="st-rank">${rank}</span>`
    : "";
  return `
    <div class="st-hero">
      <div class="st-hero-art" role="img" aria-label="${name}" style="${artStyle}">
        ${rankBadge}
      </div>
      <div class="st-hero-meta">
        <div class="st-hero-name">${name}</div>
        ${secondary ? `<div class="st-hero-sec">${secondary}</div>` : ""}
      </div>
    </div>`;
}

function listRow(item, rank, showRank) {
  const name = escapeHtml(item?.name || "");
  const secondary = escapeHtml(item?.secondary || "");
  const art = item?.art_small || item?.art_large;
  const artStyle = art
    ? `background-image: url('${escapeHtml(art)}'); background-size: cover; background-position: center;`
    : `background: ${placeholderArt(item?.name)};`;
  const rankCell = showRank ? `<span class="st-list-rank">${rank}</span>` : "";
  return `
    <li class="st-list-row">
      ${rankCell}
      <span class="st-list-art" role="img" aria-label="${name}" style="${artStyle}"></span>
      <span class="st-list-body">
        <span class="st-list-name">${name}</span>
        ${secondary ? `<span class="st-list-sec">${secondary}</span>` : ""}
      </span>
    </li>`;
}

export default function render(shadow, ctx) {
  const data = ctx?.data || {};
  const opts = ctx?.cell?.options || {};
  const showHero = opts.show_hero !== false;
  const showRank = opts.show_rank !== false;
  const css = `<link rel="stylesheet" href="/static/style/spectra-widgets.css">`;

  if (data.error) {
    shadow.innerHTML = `
      ${css}
      <div class="w" data-widget="spotify_top">
        <div class="w-title">
          <i class="ph-bold ph-warning-circle"></i>
          <h3>Spotify Top</h3>
        </div>
        <div class="w-body"><p class="u-muted">${escapeHtml(data.error)}</p></div>
      </div>`;
    return;
  }

  const items = Array.isArray(data.items) ? data.items.filter(Boolean) : [];
  const kind = data.kind || "tracks";
  const timeRange = data.time_range || "short_term";
  const kindLabel = KIND_LABEL[kind] || "Top";
  const kindIcon = KIND_ICON[kind] || "ph-music-notes";
  const timeLabel = TIME_LABEL[timeRange] || "";

  if (items.length === 0) {
    shadow.innerHTML = `
      ${css}
      <div class="w" data-widget="spotify_top">
        <div class="w-title">
          <i class="ph-bold ${kindIcon}"></i>
          <h3>${escapeHtml(kindLabel)}</h3>
        </div>
        <div class="w-body"><p class="u-muted">No items yet for the chosen window. Listen to more music on Spotify and check back.</p></div>
      </div>`;
    return;
  }

  const hero = showHero ? heroCard(items[0], 1, showRank) : "";
  const listStart = showHero ? 1 : 0;
  const listItems = items.slice(listStart);
  const list = listItems
    .map((it, i) => listRow(it, i + 1 + listStart, showRank))
    .join("");

  const layout = `
    .w[data-widget="spotify_top"] .w-body {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      min-height: 0;
    }
    .w[data-widget="spotify_top"] .w-title { gap: var(--space-2); }
    .st-window {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      margin-left: auto;
      padding: 2px var(--space-2);
      font-size: var(--fs-caption);
      font-weight: var(--fw-bold);
      text-transform: uppercase;
      letter-spacing: var(--ls-label);
      color: var(--text-secondary);
      background: var(--surface-sunk, color-mix(in oklab, var(--text-primary) 6%, var(--surface)));
      border-radius: var(--radius-pill, 999px);
    }
    .st-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-3);
      flex: 1 1 auto;
      min-height: 0;
    }
    .st-hero {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      min-width: 0;
    }
    .st-hero-art {
      position: relative;
      width: 100%;
      aspect-ratio: 1 / 1;
      border-radius: var(--radius-1, 8px);
      box-shadow: 0 1px 3px color-mix(in oklab, black 12%, transparent);
    }
    .st-rank {
      position: absolute;
      top: var(--space-2);
      left: var(--space-2);
      min-width: 1.4em;
      padding: 0 var(--space-2);
      font-size: var(--fs-body);
      font-weight: var(--fw-black);
      color: var(--on-accent, white);
      background: var(--accent-1, #C24F2C);
      border-radius: var(--radius-pill, 999px);
      text-align: center;
      line-height: 1.5;
    }
    .st-hero-meta { min-width: 0; }
    .st-hero-name {
      font-size: var(--fs-lead);
      font-weight: var(--fw-black);
      line-height: var(--lh-tight);
      color: var(--text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .st-hero-sec {
      font-size: var(--fs-body);
      font-weight: var(--fw-semi);
      color: var(--text-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .st-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      min-height: 0;
    }
    .st-list-row {
      display: grid;
      grid-template-columns: auto auto 1fr;
      align-items: center;
      gap: var(--space-2);
      min-width: 0;
    }
    .st-list-rank {
      font-size: var(--fs-caption);
      font-weight: var(--fw-bold);
      color: var(--text-muted);
      min-width: 1.4em;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .st-list-art {
      display: block;
      width: 2.4em;
      height: 2.4em;
      border-radius: var(--radius-0, 4px);
      flex: 0 0 auto;
    }
    .st-list-body {
      display: flex;
      flex-direction: column;
      min-width: 0;
      gap: 2px;
    }
    .st-list-name {
      font-size: var(--fs-body);
      font-weight: var(--fw-bold);
      color: var(--text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .st-list-sec {
      font-size: var(--fs-caption);
      font-weight: var(--fw-semi);
      color: var(--text-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    /* sm: hero only, drop the list and rank cell to keep the art big. */
    @container w (max-width: 280px) {
      .st-list { display: none; }
    }
    /* md: side-by-side hero + list when there's room horizontally. */
    @container w (min-width: 360px) {
      .st-grid {
        grid-template-columns: minmax(40%, 1fr) 1.2fr;
      }
    }
  `;

  shadow.innerHTML = `
    ${css}
    <style>${layout}</style>
    <div class="w" data-widget="spotify_top">
      <div class="w-title">
        <i class="ph-bold ${kindIcon}"></i>
        <h3>${escapeHtml(kindLabel)}</h3>
        ${timeLabel ? `<span class="st-window">${escapeHtml(timeLabel)}</span>` : ""}
      </div>
      <div class="w-body">
        <div class="st-grid">
          ${hero}
          ${list ? `<ul class="st-list">${list}</ul>` : ""}
        </div>
      </div>
    </div>`;
}
