// src/redis.ts
import Redis, { RedisOptions } from 'ioredis';
import { URL } from 'node:url';

const RAW = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Ưu tiên IPv4 để tránh AggregateError do ::1
let opts: RedisOptions | string = RAW;
try {
  const u = new URL(RAW);
  opts = {
    host: u.hostname === 'localhost' ? '127.0.0.1' : u.hostname,
    port: Number(u.port || 6379),
    password: u.password || undefined,
    family: 4,            // <- IPv4
    lazyConnect: false,
    enableReadyCheck: true,
    maxRetriesPerRequest: 1, // request không treo vô hạn
    // Ngừng reconnect sau 5 lần, mỗi lần cách nhau tối đa 2s
    retryStrategy(times) {
      if (times >= 5) return null;                   // null = dừng reconnect
      return Math.min(times * 300, 2000);
    },
    reconnectOnError(err) {
      // có thể log/điều kiện tinh hơn; true = thử reconnect theo retryStrategy
      return true;
    }
  };
} catch {
  // nếu REDIS_URL không phải URL, cứ để ioredis tự parse chuỗi
}

export const redis = typeof opts === 'string' ? new Redis(opts) : new Redis(opts);

// log để biết trạng thái, tránh “Unhandled error event”
redis.on('ready', () => console.log('[redis] ready'));
redis.on('end', () => console.warn('[redis] connection closed'));
redis.on('reconnecting', (delay: number) => console.warn('[redis] reconnecting in', delay, 'ms'));
redis.on('error', (err: unknown) => console.error('[redis] error:', (err as Error)?.message || err));
