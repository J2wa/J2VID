import express, { type Request, type Response, type NextFunction } from 'express';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';

const SESSION_SECONDS = 12 * 60 * 60;
const RETENTION_SECONDS = 24 * 60 * 60;
const ONLINE_MS = 120_000;
const activities: Record<string, string> = {
  workspace: 'Using the workspace', dashboard: 'Viewing live users',
  annotations: 'Reviewing annotations', timeline: 'Viewing timeline',
  json: 'Viewing annotation JSON', workflow: 'Viewing workflow',
  editing: 'Editing an annotation', setup: 'Setting up scenes',
};
type Session = { id: string; username: string; role: 'user' | 'admin'; stamp: string; startedAt: number };
type Row = { id: string; username: string; role: string; ip: string; lastSeen: number; startedAt: number; activity: string; aiRequests: number };
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const prefix = () => `j2vid:${process.env.VERCEL_ENV || 'development'}:`;
const key = (suffix: string) => prefix() + suffix;
const cookieName = () => process.env.VERCEL ? '__Host-j2session' : 'j2session';

function configured() {
  return Boolean(process.env.USER_PASSWORD && process.env.ADMIN_PASSWORD &&
    process.env.USER_PASSWORD !== process.env.ADMIN_PASSWORD &&
    (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
    (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN));
}

async function command(...args: (string | number)[]): Promise<any> {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token || !url.startsWith('https://')) throw new Error('Store unavailable');
  const response = await fetch(url, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args), signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error('Store unavailable');
  const data = await response.json();
  if (data.error) throw new Error('Store unavailable');
  return data.result;
}

export function clientIp(req: Request) {
  // Trust Vercel's platform header only on Vercel, never client-supplied IP fields.
  return (process.env.VERCEL ? req.get('x-vercel-forwarded-for') || req.get('x-forwarded-for') : req.socket.remoteAddress)?.split(',')[0].trim().slice(0,64) || 'Unknown';
}

function tokenFrom(req: Request) {
  const value = (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(`${cookieName()}=`))?.split('=')[1];
  return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
}

function sameOrigin(req: Request) {
  if (req.get('x-j2-request') !== '1') return false;
  const origin = req.get('origin');
  if (!origin) return false;
  try { return new URL(origin).host === req.get('host'); } catch { return false; }
}

async function sessionFor(req: Request): Promise<Session | null> {
  const token = tokenFrom(req);
  if (!token) return null;
  const raw = await command('GET', key(`auth:${digest(token)}`));
  if (!raw) return null;
  const session: Session = JSON.parse(raw);
  const password = session.role === 'admin' ? process.env.ADMIN_PASSWORD : process.env.USER_PASSWORD;
  if (!password || session.stamp !== digest(password)) return null;
  return session;
}

async function touch(session: Session, req: Request, activity?: string) {
  const now = Date.now();
  const rowKey = key(`presence:${session.id}`);
  await command('HSET', rowKey, 'id', session.id, 'username', session.username, 'role', session.role,
    'ip', clientIp(req), 'lastSeen', now, 'startedAt', session.startedAt);
  if (activity) await command('HSET', rowKey, 'activity', activity);
  await command('EXPIRE', rowKey, RETENTION_SECONDS);
  await command('ZADD', key('seen'), now, session.id);
  await command('ZREMRANGEBYSCORE', key('seen'), '-inf', now - RETENTION_SECONDS * 1000);
  await command('EXPIRE', key('seen'), RETENTION_SECONDS);
}

async function record(session: Session, req: Request, activity: string) {
  const now = Date.now();
  await touch(session, req, activity);
  // Whitelisted event labels only: no filenames, video content, prompts, or secrets.
  await command('ZADD', key('events'), now, JSON.stringify({ eventId: randomUUID(), id: session.id,
    username: session.username, role: session.role, ip: clientIp(req), activity, time: now }));
  await command('ZREMRANGEBYSCORE', key('events'), '-inf', now - RETENTION_SECONDS * 1000);
  await command('ZREMRANGEBYRANK', key('events'), 0, -1001);
  await command('EXPIRE', key('events'), RETENTION_SECONDS);
}

function setCookie(res: Response, token: string, maxAge: number) {
  res.setHeader('Set-Cookie', `${cookieName()}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${process.env.VERCEL || process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
}

function unavailable(res: Response) { return res.status(503).json({ error: 'Sign-in and live activity are temporarily unavailable. Please contact the app administrator.' }); }

export const accessApp = express();
accessApp.disable('x-powered-by');
accessApp.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
accessApp.use(express.json({ limit: '4kb' }));
accessApp.all(['/', '/api/access'], async (req, res) => {
  try {
    if (!configured()) { unavailable(res); return; }
    if (req.method !== 'GET' && req.method !== 'POST') { res.setHeader('Allow','GET, POST'); res.sendStatus(405); return; }
    if (req.method === 'POST' && !sameOrigin(req)) { res.status(403).json({ error: 'Please reload the app and try again.' }); return; }
    const action = req.method === 'POST' ? req.body?.action : req.query.action;
    if (action === 'login' && req.method === 'POST') {
      const { username, password } = req.body;
      if (typeof username !== 'string' || !username.trim() || username.trim().length > 40 || /[\x00-\x1f\x7f]/.test(username) || typeof password !== 'string' || password.length > 256) {
        res.status(400).json({ error: 'Enter a username (1–40 characters) and password.' }); return;
      }
      const attempts = await command('EVAL', "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],900) end; return n", 1, key(`login:${digest(clientIp(req))}`));
      if (Number(attempts) > 20) { res.setHeader('Retry-After', '900'); res.status(429).json({ error: 'Too many login attempts. Try again in 15 minutes.' }); return; }
      const supplied = Buffer.from(digest(password),'hex');
      const isAdmin = timingSafeEqual(supplied, Buffer.from(digest(process.env.ADMIN_PASSWORD!), 'hex'));
      const isUser = timingSafeEqual(supplied, Buffer.from(digest(process.env.USER_PASSWORD!), 'hex'));
      if (!isAdmin && !isUser) { res.status(401).json({ error: 'Incorrect password.' }); return; }
      const session: Session = { id: randomUUID(), username: username.trim(), role: isAdmin ? 'admin' : 'user', stamp: digest(password), startedAt: Date.now() };
      const token = randomBytes(32).toString('hex');
      const previous = tokenFrom(req);
      if (previous) {
        const old = await sessionFor(req);
        await command('DEL', key(`auth:${digest(previous)}`));
        if (old) { await command('DEL',key(`presence:${old.id}`)); await command('ZREM',key('seen'),old.id); }
      }
      await command('SET', key(`auth:${digest(token)}`), JSON.stringify(session), 'EX', SESSION_SECONDS);
      await record(session, req, 'Signed in');
      setCookie(res, token, SESSION_SECONDS);
      res.json({ user: { id: session.id, username: session.username, role: session.role }, ownIp: clientIp(req) }); return;
    }
    const session = await sessionFor(req);
    if (!session) { res.status(401).json({ error: 'Please sign in to continue.' }); return; }
    if (req.method === 'GET' && action === 'me') {
      res.json({ user: { id: session.id, username: session.username, role: session.role }, ownIp: clientIp(req) }); return;
    }
    if (req.method === 'POST' && action === 'logout') {
      await command('DEL', key(`auth:${digest(tokenFrom(req)!)}`));
      await record(session, req, 'Signed out');
      await command('DEL', key(`presence:${session.id}`));
      await command('ZREM', key('seen'), session.id);
      setCookie(res, '', 0); res.json({ ok: true }); return;
    }
    if (req.method === 'POST' && action === 'heartbeat') {
      const requested = req.body.activity;
      const label = typeof requested === 'string' && Object.hasOwn(activities, requested) ? activities[requested] : activities.workspace;
      const previous = await command('HGET', key(`presence:${session.id}`), 'activity');
      if (previous !== label) await record(session, req, label);
      else await touch(session, req, label);
      res.json({ ok: true }); return;
    }
    if (req.method === 'GET' && action === 'dashboard') {
      const admin = session.role === 'admin';
      const now = Date.now();
      const since = now - (admin ? RETENTION_SECONDS * 1000 : ONLINE_MS);
      const ids: string[] = await command('ZREVRANGEBYSCORE', key('seen'), '+inf', since, 'LIMIT', 0, 200);
      const rows = await Promise.all(ids.map(async id => {
        const flat: string[] = await command('HGETALL', key(`presence:${id}`));
        if (!flat.length) return null;
        const row: any = {}; for (let i=0;i<flat.length;i+=2) row[flat[i]]=flat[i+1];
        return { ...row, lastSeen: Number(row.lastSeen), startedAt: Number(row.startedAt), aiRequests: Number(row.aiRequests || 0) } as Row;
      }));
      const online = Number(await command('ZCOUNT',key('seen'),now - ONLINE_MS,'+inf'));
      const users = rows.filter((row): row is Row => row !== null).map(row => {
        const common = { id: row.id, alias: `Session ${row.id.slice(0,8)}`, lastSeen: row.lastSeen, online: row.lastSeen >= now - ONLINE_MS, aiRequests: row.aiRequests, isYou: row.id === session.id };
        return admin ? { ...common, username: row.username, role: row.role, ip: row.ip, activity: row.activity || 'Using the workspace', startedAt: row.startedAt }
          : { ...common, activity: 'Using the app' };
      });
      const events = admin ? (await command('ZREVRANGEBYSCORE', key('events'), '+inf', now - RETENTION_SECONDS * 1000, 'LIMIT', 0, 100)).map((s: string) => JSON.parse(s)) : [];
      res.json({ users, events, online, ownIp: clientIp(req), updatedAt: now, admin, limit: 200 }); return;
    }
    res.status(404).json({ error: 'Unknown action.' });
  } catch { unavailable(res); }
});

// Enforce authentication on the AI endpoints themselves, not only in React.
export async function requireSession(req: Request, res: Response, next: NextFunction) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (!configured()) { unavailable(res); return; }
    if (!sameOrigin(req)) { res.status(403).json({ error: 'Please use the signed-in app to run AI requests.' }); return; }
    const session = await sessionFor(req);
    if (!session) { res.status(401).json({ error: 'Your session expired. Sign in again.' }); return; }
    const labels: Record<string, string> = { 'annotate-video': 'Requested video annotation', 'revise-scene': 'Requested scene revision', 'transcribe-audio': 'Requested audio transcription' };
    const route = req.path.split('/').filter(Boolean).pop() || '';
    await record(session, req, labels[route] || 'Requested AI processing');
    await command('HINCRBY', key(`presence:${session.id}`), 'aiRequests', 1);
    next();
  } catch { unavailable(res); }
}
