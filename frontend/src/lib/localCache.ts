type CacheEnvelope<T> = {
  value: T;
  savedAt: number;
};

export function getCachedValue<T>(key: string, ttlMs: number): T | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (!parsed?.savedAt) return null;

    if (Date.now() - parsed.savedAt > ttlMs) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.value;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function setCachedValue<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;

  const payload: CacheEnvelope<T> = {
    value,
    savedAt: Date.now(),
  };

  localStorage.setItem(key, JSON.stringify(payload));
}

export function clearCachedValue(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}
