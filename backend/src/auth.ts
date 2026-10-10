import { createHmac, timingSafeEqual } from 'node:crypto';
import { Router, type Request, type Response, type NextFunction } from 'express';

const COOKIE_NAME = 'songbook_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const isProduction = process.env.NODE_ENV === 'production';

const USERNAME = process.env.APP_USERNAME;
const PASSWORD = process.env.APP_PASSWORD;
const SECRET = process.env.SESSION_SECRET;

export function assertAuthConfigured() {
  const missing = [
    !USERNAME && 'APP_USERNAME',
    !PASSWORD && 'APP_PASSWORD',
    !SECRET && 'SESSION_SECRET',
  ].filter(Boolean);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

function sign(payload: string): string {
  return createHmac('sha256', SECRET!).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

function createToken(username: string): string {
  const payload = Buffer.from(JSON.stringify({ u: username, exp: Date.now() + SESSION_TTL_MS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string): string | null {
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;
  try {
    const { u, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (typeof u !== 'string' || typeof exp !== 'number' || exp < Date.now()) return null;
    return u;
  } catch {
    return null;
  }
}

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

function sessionUser(req: Request): string | null {
  const token = readCookie(req, COOKIE_NAME);
  return token ? verifyToken(token) : null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!sessionUser(req)) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  next();
}

// Simple in-memory brute-force protection: max failed attempts per IP per window
const MAX_FAILED_ATTEMPTS = 10;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const entry = failedAttempts.get(ip);
  if (!entry || entry.resetAt < Date.now()) return false;
  return entry.count >= MAX_FAILED_ATTEMPTS;
}

function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const entry = failedAttempts.get(ip);
  if (!entry || entry.resetAt < now) {
    failedAttempts.set(ip, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
  } else {
    entry.count++;
  }
}

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/',
};

export const authRouter = Router();

authRouter.post('/login', (req, res) => {
  const ip = req.ip ?? 'unknown';
  if (isRateLimited(ip)) {
    res.status(429).json({ message: 'Too many failed attempts. Try again later.' });
    return;
  }

  const { username, password } = req.body ?? {};
  const valid =
    typeof username === 'string' &&
    typeof password === 'string' &&
    safeEqual(username, USERNAME!) &&
    safeEqual(password, PASSWORD!);

  if (!valid) {
    recordFailedAttempt(ip);
    res.status(401).json({ message: 'Invalid username or password' });
    return;
  }

  failedAttempts.delete(ip);
  res.cookie(COOKIE_NAME, createToken(username), { ...cookieOptions, maxAge: SESSION_TTL_MS });
  res.json({ username });
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.status(204).end();
});

authRouter.get('/me', (req, res) => {
  const username = sessionUser(req);
  if (!username) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  res.json({ username });
});
