import { redis, getMember } from './db.js';
import { randomInt } from 'node:crypto';

const KEY = 'dtk:requests';
const parse = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

export async function addRequest(r) {
  await redis.hset(KEY, { [r.id]: r });
}
export async function getRequest(id) {
  const v = await redis.hget(KEY, id);
  return v ? parse(v) : null;
}
export async function setRequest(r) {
  await redis.hset(KEY, { [r.id]: r });
}
export async function deleteRequest(id) {
  await redis.hdel(KEY, id);
}
export async function listRequests() {
  const all = (await redis.hgetall(KEY)) || {};
  return Object.values(all)
    .map(parse)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function newCode() {
  for (let i = 0; i < 30; i++) {
    const c = String(randomInt(0, 100000000)).padStart(8, '0');
    if (!(await getMember(c))) return c;
  }
  throw new Error('Impossible de générer un code');
}
