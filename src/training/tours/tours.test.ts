import { describe, expect, it } from 'vitest';
import { placeCard, intersects, type Box } from './placement';
import { TOURS } from './tours';
import { EN } from './content/en';
import { AR } from './content/ar';
import { stepText, tourText } from './i18n';

const VP = { w: 1440, h: 900, top: 36, right: 0 };
const CARD = { w: 360, h: 230 };

describe('tour card placement', () => {
  it('never covers the target', () => {
    const target: Box = { x: 1200, y: 100, w: 150, h: 34 };
    const p = placeCard(target, [], CARD, 132, VP);
    expect(intersects({ x: p.left, y: p.top, w: CARD.w, h: CARD.h }, target)).toBe(false);
    expect(p.mode).toBe('anchored');
  });

  it('moves out of the way of an open dropdown below the target (Status menu case)', () => {
    const target: Box = { x: 1240, y: 100, w: 150, h: 34 };
    const dropdown: Box = { x: 1210, y: 140, w: 180, h: 170 };
    const p = placeCard(target, [dropdown], CARD, 132, VP);
    const card = { x: p.left, y: p.top, w: CARD.w, h: CARD.h };
    expect(intersects(card, target)).toBe(false);
    expect(intersects(card, dropdown)).toBe(false);
  });

  it('stays fully inside the viewport and below the Academy bar', () => {
    const target: Box = { x: 5, y: 40, w: 60, h: 20 };
    const p = placeCard(target, [], CARD, 132, VP);
    expect(p.left).toBeGreaterThanOrEqual(12);
    expect(p.top).toBeGreaterThanOrEqual(VP.top);
    expect(p.left + CARD.w).toBeLessThanOrEqual(VP.w);
    expect(p.top + CARD.h).toBeLessThanOrEqual(VP.h);
  });

  it('avoids a large dialog by docking instead of overlapping it', () => {
    const dialog: Box = { x: 360, y: 60, w: 720, h: 640 };
    const target: Box = { x: 380, y: 200, w: 300, h: 40 }; // field inside the dialog
    const p = placeCard(target, [dialog], CARD, 132, VP);
    expect(intersects({ x: p.left, y: p.top, w: CARD.w, h: p.mode === 'compact' ? 132 : CARD.h }, dialog)).toBe(false);
  });

  it('narrows the docked card beside a wide centred dialog (Confirm Changes)', () => {
    const dialog: Box = { x: 336, y: 64, w: 768, h: 520 };
    const p = placeCard(dialog, [dialog], CARD, 132, VP);
    const box = { x: p.left, y: p.top, w: p.width, h: p.mode === 'compact' ? 132 : Math.round(CARD.h * (360 / 296)) };
    expect(intersects(box, dialog)).toBe(false);
    expect(p.left + p.width).toBeLessThanOrEqual(VP.w);
    expect(p.top + box.h).toBeLessThanOrEqual(VP.h);
  });

  it('falls back to a compact docked card when nothing else fits', () => {
    const small = { w: 800, h: 500, top: 36, right: 0 };
    const target: Box = { x: 100, y: 100, w: 600, h: 300 };
    const p = placeCard(target, [], CARD, 132, small);
    expect(['docked', 'compact']).toContain(p.mode);
  });
});

describe('bilingual walkthrough content', () => {
  it('has English and Arabic text for every tour and step, with matching fields', () => {
    for (const t of TOURS) {
      expect(EN[t.id], t.id).toBeDefined();
      expect(AR[t.id], t.id).toBeDefined();
      expect(AR[t.id].title).toMatch(/[؀-ۿ]/);
      expect(AR[t.id].summary).toMatch(/[؀-ۿ]/);
      expect(Object.keys(EN[t.id].steps).sort()).toEqual(t.steps.map((s) => s.id).sort());
      expect(Object.keys(AR[t.id].steps).sort()).toEqual(t.steps.map((s) => s.id).sort());
      for (const s of t.steps) {
        const en = EN[t.id].steps[s.id];
        const ar = AR[t.id].steps[s.id];
        expect(Object.keys(ar).sort(), `${t.id}.${s.id}`).toEqual(Object.keys(en).sort());
        expect(ar.title + ar.body).toMatch(/[؀-ۿ]/);
        if (s.done) expect(en.action && ar.action, `${t.id}.${s.id} action`).toBeTruthy();
        if (s.wrong) expect(en.wrong && ar.wrong, `${t.id}.${s.id} wrong`).toBeTruthy();
      }
    }
  });

  it('keeps CLM control labels in English inside Arabic instructions', () => {
    const start = stepText('ar', 'first-edd', 'start');
    expect(start.action).toContain('Status');
    expect(start.action).toContain('In Progress');
    expect(stepText('ar', 'close-edd', 'attempt').action).toContain('Approved');
    expect(stepText('ar', 'missing-info', 'fill').action).toContain('Review Changes');
  });

  it('falls back to English for unknown keys', () => {
    expect(tourText('ar', 'does-not-exist').title).toBe('does-not-exist');
    expect(stepText('en', 'first-edd', 'start').title).toBe('Move the case to In Progress');
  });
});
