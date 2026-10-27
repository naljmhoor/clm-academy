// Tooltip placement for the walkthrough engine.
// Pure geometry: given the spotlighted target, the things the trainee may need to reach
// (open dropdowns, dialogs, side panels) and the card size, find a spot that touches none of them.

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Placement {
  left: number;
  top: number;
  /** 'anchored' sits next to the target; 'docked' sits in a screen corner; 'compact' is docked and collapsed. */
  mode: 'anchored' | 'docked' | 'compact';
  /** Card width to use (narrower than requested when docking beside a wide dialog). */
  width: number;
}

/** Narrowest card width allowed when docking. */
export const NARROW_W = 296;

const MARGIN = 12; // distance from viewport edges
const GAP = 14; // distance from the target

export const intersects = (a: Box, b: Box) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const inflate = (b: Box, by: number): Box => ({ x: b.x - by, y: b.y - by, w: b.w + by * 2, h: b.h + by * 2 });

export function placeCard(
  target: Box | null,
  obstacles: Box[],
  card: { w: number; h: number },
  compactH: number,
  viewport: { w: number; h: number; top: number; right: number },
): Placement {
  const minX = MARGIN;
  const maxX = viewport.w - viewport.right - MARGIN;
  const minY = viewport.top + MARGIN;
  const maxY = viewport.h - MARGIN;
  const blocked = [...(target ? [inflate(target, GAP - 4)] : []), ...obstacles.map((o) => inflate(o, 8))];

  const fits = (b: Box) => b.x >= minX && b.y >= minY && b.x + b.w <= maxX && b.y + b.h <= maxY && !blocked.some((o) => intersects(b, o));
  const clampX = (x: number) => Math.min(Math.max(minX, x), maxX - card.w);
  const clampY = (y: number) => Math.min(Math.max(minY, y), maxY - card.h);

  if (!target) {
    const centred = { x: (minX + maxX - card.w) / 2, y: Math.max(minY, (viewport.h - card.h) / 2), w: card.w, h: card.h };
    if (fits(centred)) return { left: centred.x, top: centred.y, mode: 'anchored', width: card.w };
  } else {
    const { x, y, w, h } = target;
    const candidates: Box[] = [
      { x: clampX(x), y: y + h + GAP, w: card.w, h: card.h }, // below, left-aligned
      { x: clampX(x + w - card.w), y: y + h + GAP, w: card.w, h: card.h }, // below, right-aligned
      { x: clampX(x), y: y - GAP - card.h, w: card.w, h: card.h }, // above
      { x: clampX(x + w - card.w), y: y - GAP - card.h, w: card.w, h: card.h },
      { x: x + w + GAP, y: clampY(y), w: card.w, h: card.h }, // right
      { x: x - GAP - card.w, y: clampY(y), w: card.w, h: card.h }, // left
    ];
    const hit = candidates.find(fits);
    if (hit) return { left: hit.x, top: hit.y, mode: 'anchored', width: card.w };
  }

  // Docked guidance: try screen corners — full size, then narrower, then collapsed.
  const narrowFactor = card.w / NARROW_W; // text re-wraps, so a narrower card is taller
  const attempts: [Placement['mode'], number, number][] = [
    ['docked', card.w, card.h],
    ['docked', NARROW_W, Math.round(card.h * narrowFactor)],
    ['compact', card.w, compactH],
    ['compact', NARROW_W, Math.round(compactH * narrowFactor)],
  ];
  for (const [mode, cw, ch] of attempts) {
    const corners: Box[] = [
      { x: maxX - cw, y: maxY - ch, w: cw, h: ch },
      { x: minX, y: maxY - ch, w: cw, h: ch },
      { x: maxX - cw, y: minY, w: cw, h: ch },
      { x: minX, y: minY, w: cw, h: ch },
    ];
    const hit = corners.find(fits);
    if (hit) return { left: hit.x, top: hit.y, mode, width: cw };
  }
  // Nothing is free (very small window): collapse in the corner furthest from the target, inside the viewport.
  const tx = target ? target.x + target.w / 2 : 0;
  const top = Math.max(minY, maxY - compactH);
  return { left: tx > viewport.w / 2 ? minX : Math.max(minX, maxX - NARROW_W), top, mode: 'compact', width: NARROW_W };
}
