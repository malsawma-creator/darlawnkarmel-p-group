// Circular structure and safe serialization utilities for localStorage & Firestore

// 1. Global safeguard: Patch JSON.stringify to prevent "Converting circular structure to JSON"
const originalStringify = JSON.stringify;

// Install monkey-patch safely once
if (typeof JSON !== 'undefined' && !(JSON as any).__circular_patched__) {
  try {
    JSON.stringify = function (value: any, replacer?: any, space?: any) {
      try {
        return originalStringify.call(this, value, replacer, space);
      } catch (err: any) {
        if (err && typeof err.message === 'string' && err.message.toLowerCase().includes('circular')) {
          const seen = new WeakSet();
          return originalStringify.call(
            this,
            value,
            (key: string, val: any) => {
              if (typeof val === 'function' || typeof val === 'symbol') {
                return undefined;
              }
              if (typeof HTMLElement !== 'undefined' && val instanceof HTMLElement) {
                return undefined;
              }
              if (val && (val.$$typeof || val._reactInternals || val.nativeEvent)) {
                return undefined;
              }
              if (val && (val.firestore || val._delegate || val.converter)) {
                return undefined;
              }
              if (val && typeof val.toDate === 'function') {
                try {
                  return val.toDate().toISOString();
                } catch {
                  return undefined;
                }
              }
              if (typeof val === 'object' && val !== null) {
                if (seen.has(val)) {
                  return undefined;
                }
                seen.add(val);
              }
              if (typeof replacer === 'function') {
                return replacer(key, val);
              }
              return val;
            },
            space
          );
        }
        throw err;
      }
    } as typeof JSON.stringify;
    (JSON as any).__circular_patched__ = true;
  } catch (patchErr) {
    console.warn('Could not install circular JSON.stringify patch:', patchErr);
  }
}

// 2. Suppress noisy internal Firestore offline / reconnect logs in browser console
if (typeof console !== 'undefined' && !(console as any).__firestore_filter_patched__) {
  try {
    const origError = console.error;
    console.error = function (...args: any[]) {
      const msg = args.map((a) => (typeof a === 'string' ? a : a?.message || '')).join(' ');
      if (
        msg.includes('@firebase/firestore') ||
        msg.includes('Could not reach Cloud Firestore backend') ||
        msg.includes('code=unavailable') ||
        msg.includes('operate in offline mode')
      ) {
        return;
      }
      origError.apply(console, args);
    };

    const origWarn = console.warn;
    console.warn = function (...args: any[]) {
      const msg = args.map((a) => (typeof a === 'string' ? a : a?.message || '')).join(' ');
      if (
        msg.includes('@firebase/firestore') ||
        msg.includes('Could not reach Cloud Firestore backend') ||
        msg.includes('code=unavailable') ||
        msg.includes('operate in offline mode')
      ) {
        return;
      }
      origWarn.apply(console, args);
    };
    (console as any).__firestore_filter_patched__ = true;
  } catch {
    // ignore
  }
}

/**
 * Safely stringify any object, stripping circular references, DOM elements,
 * React elements, and Firestore internals.
 */
export function safeJSONStringify(data: any): string {
  try {
    const seen = new WeakSet();
    return originalStringify.call(null, data, (key, value) => {
      if (typeof value === 'function' || typeof value === 'symbol') {
        return undefined;
      }
      if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) {
        return undefined;
      }
      if (value && (value.$$typeof || value._reactInternals || value.nativeEvent)) {
        return undefined;
      }
      if (value && (value.firestore || value._delegate || value.converter || value._key)) {
        return undefined;
      }
      if (value && typeof value.toDate === 'function') {
        try {
          return value.toDate().toISOString();
        } catch {
          return undefined;
        }
      }
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return undefined;
        }
        seen.add(value);
      }
      return value;
    });
  } catch (err) {
    console.warn('safeJSONStringify encountered error, falling back:', err);
    try {
      return JSON.stringify(data);
    } catch {
      return '[]';
    }
  }
}

/**
 * Safely set item in localStorage with circular-reference protection and quota error handling.
 */
export function safeSetItem(key: string, value: any): void {
  try {
    const serialized = typeof value === 'string' ? value : safeJSONStringify(value);
    localStorage.setItem(key, serialized);
  } catch (err) {
    console.warn(`safeSetItem failed for key "${key}":`, err);
  }
}

/**
 * Safely get and parse item from localStorage.
 */
export function safeGetItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`safeGetItem JSON parse failed for key "${key}":`, err);
    return fallback;
  }
}
