// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

// Its own file: framer-motion reads prefers-reduced-motion once per module instance.
beforeAll(() => {
  class RO {
    constructor(private cb: ResizeObserverCallback) {}
    observe() {
      this.cb([], this as unknown as ResizeObserver);
    }
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = RO as unknown as typeof ResizeObserver;
  window.matchMedia = ((q: string) => ({
    matches: q.includes('reduced-motion'),
    media: q,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  Element.prototype.getBoundingClientRect = function () {
    return { x: 0, y: 0, left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600, toJSON() {} } as DOMRect;
  };
});

afterEach(cleanup);

async function renderPage() {
  const { default: Page } = await import('@/app/classic/page');
  render(<Page />);
}

const main = () => document.querySelector('main')!;
const heading = () =>
  within(screen.getByRole('complementary', { name: 'Motif detail' })).getByRole('heading', { level: 2 }).textContent;

async function explore(expectedLanding: string) {
  fireEvent.click(await screen.findByRole('button', { name: /Explore this connection/ }));
  await waitFor(() => expect(heading()).toBe(expectedLanding), { timeout: 4000 });
  await waitFor(() => expect(screen.getByRole('button', { name: /Explore this connection/ })).toHaveProperty('disabled', false));
}

describe('reduced motion', () => {
  it('Step Inside enters at once and crossfades instead of flying the painting', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Step Inside/ }));
    // No handoff flight: the experience is live on the same tick.
    expect(main().hasAttribute('data-pre-entry')).toBe(false);
    expect(main().hasAttribute('inert')).toBe(false);
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Welcome to ARTSCAPE' })).toBeNull());
  });
});

describe('Your path, through the interface', () => {
  it('stays hidden on a partial journey, then shows the whole route when complete', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Step Inside/ }));
    fireEvent.click(screen.getByRole('button', { name: /The Boats in the Trough.*Start the journey here/ }));

    await explore('The Sailor on the Drifting Boat');
    await explore('The Black King and His Gift');
    await explore('The Pitcher and Basin');
    expect(screen.queryByRole('dialog', { name: 'Your path' })).toBeNull();
    expect(screen.queryByRole('button', { name: /See your whole path/ })).toBeNull();
    expect(screen.getByText('Where you have been')).toBeTruthy();

    await explore('The Lit Face');
    const dialog = await screen.findByRole('dialog', { name: 'Your path' });
    expect(main().hasAttribute('inert')).toBe(true);
    expect(within(dialog).getByText(/5 works · 4 relationships followed/)).toBeTruthy();

    const route = within(dialog).getByRole('list', { name: 'Route travelled' });
    const names = ['Katsushika Hokusai', 'Winslow Homer', 'Gerard David', 'Johannes Vermeer', 'Rembrandt van Rijn'];
    expect(within(route).getAllByRole('button', { name: /Return$/ })).toHaveLength(5);
    const positions = names.map((name) => route.textContent!.indexOf(name));
    expect(positions.every((p, i) => p >= 0 && (i === 0 || p > positions[i - 1]))).toBe(true);
    expect(within(route).getByText('Shared motif')).toBeTruthy();
    expect(within(route).getAllByText('Similar technique')).toHaveLength(2);
    const legs = [...route.querySelectorAll('p')].map((p) => p.textContent!.replace(/\s+/g, ' ').trim());
    expect(legs).toContain('The Boats in the Trough → The Sailor on the Drifting Boat');

    // Existing trail is still there alongside the card.
    expect(screen.getByText('Where you have been')).toBeTruthy();

    // Return to Homer through the card.
    fireEvent.click(within(route).getByTitle('Return to The Sailor on the Drifting Boat in The Gulf Stream'));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Your path' })).toBeNull());
    expect(within(screen.getByRole('banner')).getByText('The Gulf Stream')).toBeTruthy();
    await waitFor(() => expect(heading()).toBe('The Sailor on the Drifting Boat'));

    // Return through the existing trail still works, and the path can be reopened from it.
    fireEvent.click(screen.getByTitle(/Return to The Boats in the Trough/));
    await waitFor(() => expect(heading()).toBe('The Boats in the Trough'));
    fireEvent.click(screen.getByRole('button', { name: /See your whole path/ }));
    await screen.findByRole('dialog', { name: 'Your path' });

    // Escape closes the card without clearing the selection underneath.
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Your path' })).toBeNull());
    expect(heading()).toBe('The Boats in the Trough');

    // Begin again: back to the opening, journey cleared.
    fireEvent.click(screen.getByRole('button', { name: /See your whole path/ }));
    const last = await screen.findByRole('dialog', { name: 'Your path' });
    fireEvent.click(within(last).getByRole('button', { name: 'Begin a new journey' }));
    expect(await screen.findByRole('region', { name: 'Welcome to ARTSCAPE' })).toBeTruthy();
    expect(main().hasAttribute('data-pre-entry')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /Step Inside/ }));
    expect(screen.queryByText('Where you have been')).toBeNull();
  }, 30000);
});
