import { beforeEach, describe, expect, it, vi } from 'vitest';

// Node has no localStorage; the store must see one when it is created.
vi.hoisted(() => {
  const m = new Map<string, string>();
  (globalThis as { localStorage?: Storage }).localStorage = {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() {
      return m.size;
    },
  } as Storage;
});

import { useAcademy } from './academyStore';
import { CATALOG, SCENARIO_AR_IDS } from './catalog';
import { TOURS } from './tours/tours';
import { SCENARIOS } from './practice/scenarios';

const KEY = 'clm-academy:progress:v1';

describe('Academy language state', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to English and only changes through setTourLang', () => {
    useAcademy.setState({ tourLang: 'en', tourLangChosen: false });
    expect(useAcademy.getState().tourLang).toBe('en');
    useAcademy.getState().setLocation('/academy/learn', '');
    useAcademy.getState().startTour('intro', 0);
    useAcademy.getState().exitTour();
    expect(useAcademy.getState().tourLang).toBe('en');
    useAcademy.getState().setTourLang('ar');
    expect(useAcademy.getState()).toMatchObject({ tourLang: 'ar', tourLangChosen: true });
  });

  it('switching language keeps the active walkthrough and its step', () => {
    useAcademy.getState().startTour('coc', 3);
    useAcademy.getState().setTourLang('ar');
    useAcademy.getState().setTourLang('en');
    expect(useAcademy.getState().activeTour).toEqual({ id: 'coc', step: 3 });
  });

  it('restores an explicit Arabic choice but drops an unconfirmed v1 value', async () => {
    localStorage.setItem(KEY, JSON.stringify({ state: { tourLang: 'ar', tours: { intro: { status: 'started', step: 5, updatedAt: '' } } }, version: 0 }));
    await useAcademy.persist.rehydrate();
    expect(useAcademy.getState().tourLang).toBe('en');
    expect(useAcademy.getState().tours.intro?.step).toBe(5); // progress kept

    localStorage.setItem(KEY, JSON.stringify({ state: { tourLang: 'ar', tourLangChosen: true }, version: 2 }));
    await useAcademy.persist.rehydrate();
    expect(useAcademy.getState().tourLang).toBe('ar');
  });
});

describe('Scenario catalog', () => {
  it('lists every walkthrough and practice scenario exactly once', () => {
    const tours = CATALOG.flatMap((g) => g.tours);
    const scenarios = CATALOG.flatMap((g) => g.scenarios);
    expect([...tours].sort()).toEqual(TOURS.map((t) => t.id).sort());
    expect([...scenarios].sort()).toEqual(SCENARIOS.map((s) => s.id).sort());
  });
  it('covers every implemented case type', () => {
    expect(CATALOG.map((g) => g.id)).toEqual(expect.arrayContaining(['edd', 'coc', 'zatca', 'license', 'authorization', 'delegation', 'iban']));
  });
  it('has Arabic titles for every practice scenario', () => {
    expect([...SCENARIO_AR_IDS].sort()).toEqual(SCENARIOS.map((s) => s.id).sort());
  });
});
