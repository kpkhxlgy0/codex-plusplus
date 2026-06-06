interface ElementWaiter {
  selector: string;
  resolve: (el: Element) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

const elementWaiters = new Set<ElementWaiter>();
let observer: MutationObserver | null = null;
let frame: number | null = null;

export function waitForElement(
  selector: string,
  timeoutMs = 5000,
): Promise<Element> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    const waiter: ElementWaiter = {
      selector,
      resolve,
      reject,
      timer: setTimeout(() => {
        elementWaiters.delete(waiter);
        reject(new Error(`timeout waiting for ${selector}`));
        disconnectIfIdle();
      }, Math.max(0, timeoutMs)),
    };

    elementWaiters.add(waiter);
    ensureObserver();
  });
}

export function cancelAllElementWaiters(reason: string): void {
  for (const waiter of Array.from(elementWaiters)) {
    clearTimeout(waiter.timer);
    elementWaiters.delete(waiter);
    waiter.reject(new Error(`${reason}: ${waiter.selector}`));
  }
  disconnectIfIdle();
}

function ensureObserver(): void {
  if (observer) return;
  observer = new MutationObserver(() => {
    scheduleCheck();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

function scheduleCheck(): void {
  if (frame !== null) return;
  frame = requestAnimationFrame(() => {
    frame = null;
    checkWaiters();
  });
}

function checkWaiters(): void {
  for (const waiter of Array.from(elementWaiters)) {
    const el = document.querySelector(waiter.selector);
    if (!el) continue;
    clearTimeout(waiter.timer);
    elementWaiters.delete(waiter);
    waiter.resolve(el);
  }
  disconnectIfIdle();
}

function disconnectIfIdle(): void {
  if (elementWaiters.size > 0) return;
  if (frame !== null) {
    cancelAnimationFrame(frame);
    frame = null;
  }
  observer?.disconnect();
  observer = null;
}
