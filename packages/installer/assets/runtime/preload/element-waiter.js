"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForElement = waitForElement;
exports.cancelAllElementWaiters = cancelAllElementWaiters;
const elementWaiters = new Set();
let observer = null;
let frame = null;
function waitForElement(selector, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(selector);
        if (existing) {
            resolve(existing);
            return;
        }
        const waiter = {
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
function cancelAllElementWaiters(reason) {
    for (const waiter of Array.from(elementWaiters)) {
        clearTimeout(waiter.timer);
        elementWaiters.delete(waiter);
        waiter.reject(new Error(`${reason}: ${waiter.selector}`));
    }
    disconnectIfIdle();
}
function ensureObserver() {
    if (observer)
        return;
    observer = new MutationObserver(() => {
        scheduleCheck();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
}
function scheduleCheck() {
    if (frame !== null)
        return;
    frame = requestAnimationFrame(() => {
        frame = null;
        checkWaiters();
    });
}
function checkWaiters() {
    for (const waiter of Array.from(elementWaiters)) {
        const el = document.querySelector(waiter.selector);
        if (!el)
            continue;
        clearTimeout(waiter.timer);
        elementWaiters.delete(waiter);
        waiter.resolve(el);
    }
    disconnectIfIdle();
}
function disconnectIfIdle() {
    if (elementWaiters.size > 0)
        return;
    if (frame !== null) {
        cancelAnimationFrame(frame);
        frame = null;
    }
    observer?.disconnect();
    observer = null;
}
//# sourceMappingURL=element-waiter.js.map