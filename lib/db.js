import { Redis } from '@upstash/redis';
import { timingSafeEqual } from 'node:crypto';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

const KEY = 'dtk:codes';

const SEED = {
  '54896727': { name: 'DIDJOTHEKID', role: 'FONDATEUR' },
  '73140582': { name: 'LORENZO', role: 'MANAGER' },
  '29481653': { name: 'NATHAN', role: 'MEMBRE' },
  '86027391': { name: 'LOUIS', role: 'MEMBRE' },
  '41592876': { name: 'LENNY', role: 'MEMBRE' },
  '67218340': { name: 'MATTEO', role: 'MEMBRE' },
  '90357164': { name: 'LOÏC', role: 'MEMBRE' },
  '12864975': { name: 'IYED', role: 'MEMBRE' },
};

export function cleanCode(v) {
  return String(v ?? '').replace(/\D/g, '').slice(0, 8);
}

async function ensureSeeded() {
  const done = await redis.get('dtk:seeded');
  if (done) return;
  const entries = {};
  for (const [c, m] of Object.entries(SEED)) entries[c] = { ...m, file: null };
  await redis.hset(KEY, entries);
  await redis.set('dtk:seeded', '1');
}

export async function getMember(code) {
  await ensureSeeded();
  const m = await redis.hget(KEY, code);
  if (!m) return null;
  return typeof m === 'string' ? JSON.parse(m) : m;
}

export async function setMember(code, member) {
  await redis.hset(KEY, { [code]: member });
}

export async function deleteMember(code) {
  await redis.hdel(KEY, code);
}

export async function listMembers() {
  await ensureSeeded();
  const all = (await redis.hgetall(KEY)) || {};
  return Object.entries(all)
    .map(([code, m]) => ({ code, ...(typeof m === 'string' ? JSON.parse(m) : m) }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

export function isAdmin(req) {
  const given = Buffer.from(String(req.headers['x-admin-password'] || ''));
  const real = Buffer.from(String(process.env.ADMIN_PASSWORD || ''));
  if (!real.length || given.length !== real.length) return false;
  return timingSafeEqual(given, real);
}
