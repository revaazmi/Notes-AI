export interface RateLimitConfig {
  max: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  retryAfter: number;
}

const stores = new Map<string, number[]>();

export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  let timestamps = stores.get(key);
  if (!timestamps) {
    timestamps = [];
    stores.set(key, timestamps);
  }

  const valid = timestamps.filter((t) => t > windowStart);

  if (valid.length >= config.max) {
    const oldest = valid[0];
    const retryAfter = Math.ceil((oldest + config.windowMs - now) / 1000);
    stores.set(key, valid);
    return { success: false, retryAfter };
  }

  valid.push(now);
  stores.set(key, valid);
  return { success: true, retryAfter: 0 };
}

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const cutoff = Date.now() - 60_000;
    for (const [key, timestamps] of stores) {
      const valid = timestamps.filter((t) => t > cutoff);
      if (valid.length === 0) stores.delete(key);
      else stores.set(key, valid);
    }
  }, 60_000);
}
