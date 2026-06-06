import assert from "node:assert/strict";
import test from "node:test";

test("waitForElement shares one observer and coalesces mutation checks", async () => {
  const prevDocument = (globalThis as unknown as { document?: unknown }).document;
  const prevMutationObserver = (globalThis as unknown as { MutationObserver?: unknown }).MutationObserver;
  const prevRequestAnimationFrame = (globalThis as unknown as { requestAnimationFrame?: unknown }).requestAnimationFrame;
  const prevCancelAnimationFrame = (globalThis as unknown as { cancelAnimationFrame?: unknown }).cancelAnimationFrame;

  let observerCount = 0;
  let observed = false;
  let mutationCallback: (() => void) | null = null;
  let frameCallback: (() => void) | null = null;
  let frameCount = 0;
  const found = new Map<string, Element>();

  class FakeMutationObserver {
    constructor(callback: () => void) {
      observerCount++;
      mutationCallback = callback;
    }

    observe(): void {
      observed = true;
    }

    disconnect(): void {
      observed = false;
    }
  }

  (globalThis as unknown as { document: { documentElement: unknown; querySelector: (selector: string) => Element | null } })
    .document = {
      documentElement: {},
      querySelector: (selector: string) => found.get(selector) ?? null,
    };
  (globalThis as unknown as { MutationObserver: typeof FakeMutationObserver }).MutationObserver = FakeMutationObserver;
  (globalThis as unknown as { requestAnimationFrame: (callback: () => void) => number })
    .requestAnimationFrame = (callback) => {
      frameCount++;
      frameCallback = callback;
      return frameCount;
    };
  (globalThis as unknown as { cancelAnimationFrame: (id: number) => void })
    .cancelAnimationFrame = () => {};

  try {
    const { waitForElement } = await import(`../src/preload/element-waiter?test=${Date.now()}`);
    const first = waitForElement("#first", 10_000);
    const second = waitForElement("#second", 10_000);

    assert.equal(observerCount, 1);
    assert.equal(observed, true);

    mutationCallback?.();
    mutationCallback?.();
    assert.equal(frameCount, 1);

    found.set("#first", {} as Element);
    found.set("#second", {} as Element);
    frameCallback?.();

    await Promise.all([first, second]);
    assert.equal(observed, false);
  } finally {
    (globalThis as unknown as { document?: unknown }).document = prevDocument;
    (globalThis as unknown as { MutationObserver?: unknown }).MutationObserver = prevMutationObserver;
    (globalThis as unknown as { requestAnimationFrame?: unknown }).requestAnimationFrame = prevRequestAnimationFrame;
    (globalThis as unknown as { cancelAnimationFrame?: unknown }).cancelAnimationFrame = prevCancelAnimationFrame;
  }
});
