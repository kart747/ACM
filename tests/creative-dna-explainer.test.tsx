// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Page from '@/app/page';
import { V2_ARTWORKS } from '@/data/artworks-v2';

const originalScroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');
beforeEach(() => {
  window.history.replaceState(null, '', '/');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
});
afterEach(() => {
  cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks();
  window.history.replaceState(null, '', '/');
  if (originalScroll) Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', originalScroll);
  else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
});

describe('How CreativeDNA works', () => {
  it('links to a real focusable explanation without requiring Gemini', () => {
    render(<Page />);
    const link = screen.getByRole('link', { name: 'How CreativeDNA Works' });
    expect(link.getAttribute('href')).toBe('#concept');
    const heading = screen.getByRole('heading', { name: 'How CreativeDNA works' });
    expect(heading.id).toBe('concept');
    expect(heading.tabIndex).toBe(-1);
    const section = within(screen.getByRole('region', { name: 'How CreativeDNA works' }));
    expect(section.getByText(/hand-drawn guide/)).toBeTruthy();
    expect(section.getByText(/not proof of shared origins|not proof|not.*historical influence/)).toBeTruthy();
    expect(section.getByText(/Starting a story reads a saved story or a prepared guide/)).toBeTruthy();
    expect(vi.mocked(fetch).mock.calls.every(([url]) => url === '/api/health')).toBe(true);
  });

  it('returns to the top when Home is clicked from the explanation on the same screen', () => {
    window.history.replaceState(null, '', '/#concept');
    render(<Page />);
    fireEvent.click(screen.getByRole('button', { name: 'Home' }));
    expect(window.location.hash).toBe('');
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'instant' });
  });

  it('honors a direct fragment link and preserves the route query while entering the gallery', () => {
    window.history.replaceState({ retained: true }, '', '/v2?demo=1#concept');
    render(<Page />);
    const heading = screen.getByRole('heading', { name: 'How CreativeDNA works' });
    expect(document.activeElement).toBe(heading);
    expect(heading.scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
    fireEvent.click(screen.getByRole('button', { name: 'Explore motifs in the gallery →' }));
    expect(window.location.pathname + window.location.search).toBe('/v2?demo=1');
    expect(window.location.hash).toBe('');
    expect(window.history.state).toEqual({ retained: true });
    expect(screen.queryByRole('heading', { name: 'How CreativeDNA works' })).toBeNull();
    expect(screen.getAllByRole('button', { name: /^Explore/ })).toHaveLength(V2_ARTWORKS.length);
    fireEvent.click(screen.getByRole('button', { name: 'Home' }));
    expect(screen.getByRole('link', { name: 'How CreativeDNA Works' })).toBeTruthy();
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'instant' });
  });
});
