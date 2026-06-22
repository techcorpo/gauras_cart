// JWT helpers + request auth utilities (server-side).
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '180d';
const REFRESH_TTL_DAYS = parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '180', 10);

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, name: user.full_name },
    ACCESS_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

export function generateRefreshToken() {
  const raw = crypto.randomBytes(48).toString('hex');
  const hash = hashToken(raw);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
  return { raw, hash, expiresAt };
}

export function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

// Read the Bearer token from a Next.js request and return the decoded user, or null.
export function getAuthUser(req) {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const p = verifyAccessToken(token);
    return { id: p.sub, role: p.role, name: p.name };
  } catch {
    return null;
  }
}

// Guard helper: returns the user if role matches, else throws an object with status.
export function requireRole(req, ...roles) {
  const user = getAuthUser(req);
  if (!user) throw { status: 401, error: 'Not authenticated' };
  if (roles.length && !roles.includes(user.role)) throw { status: 403, error: 'Forbidden' };
  return user;
}
