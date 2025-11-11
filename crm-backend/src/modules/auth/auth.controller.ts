import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { redis } from '../../redis';
import { revokeSession } from './auth.service';
import * as S from './auth.service';

const JWT_SECRET = process.env.JWT_SECRET as string;
const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';
const REFRESH_TTL_SEC = 60 * 60 * 24 * 7; // 7 ngày
const sessionKey = (sid: string) => `auth:session:${sid}`;

function signAccessToken(payload: { id: number; role: 'ADMIN' | 'AGENT' }, sid: string) {
  return jwt.sign({ ...payload, sid, typ: 'access' }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}
function signRefreshToken(payload: { id: number; role: 'ADMIN' | 'AGENT' }, sid: string) {
  return jwt.sign({ ...payload, sid, typ: 'refresh' }, JWT_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

export async function login(req: Request, res: Response) {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) return res.status(400).json({ message: 'username & password required' });

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return res.status(401).json({ message: 'Username or password is not correct' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Username or password is not correct' });
  if (user.status === 'INACTIVE') return res.status(403).json({ message: 'User is inactive' });

  const payload = { id: user.id, role: user.role as 'ADMIN' | 'AGENT' };
  const sid = crypto.randomUUID();

  // Lưu phiên vào Redis
  await redis.set(sessionKey(sid), JSON.stringify({ userId: user.id, role: user.role }), 'EX', REFRESH_TTL_SEC);

  const accessToken = signAccessToken(payload, sid);
  const refreshToken = signRefreshToken(payload, sid);

  return res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, username: user.username, email: user.email, role: user.role, status: user.status },
  });
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) return res.status(400).json({ message: 'refreshToken required' });

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;
    if (decoded.typ !== 'refresh') return res.status(400).json({ message: 'Invalid token type' });

    const sid = String(decoded.sid || '');
    if (!sid) return res.status(401).json({ message: 'Invalid refresh token (no session)' });

    // Kiểm tra phiên còn tồn tại
    const sess = await redis.get(sessionKey(sid));
    if (!sess) return res.status(401).json({ message: 'Session expired' });

    // Làm mới TTL
    await redis.expire(sessionKey(sid), REFRESH_TTL_SEC);

    const accessToken = signAccessToken({ id: Number(decoded.id), role: decoded.role }, sid);
    const newRefreshToken = signRefreshToken({ id: Number(decoded.id), role: decoded.role }, sid);

    return res.json({ accessToken, refreshToken: newRefreshToken });
  } catch {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
}

export async function logout(req: Request, res: Response) {
  const auth = req.headers.authorization;
  const accessToken = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
  const refreshToken = (req.body as any)?.refreshToken as string | undefined;
  const sid = (req as any).user?.sid as string | undefined;

  const result = await revokeSession({ accessToken, refreshToken });
  if (!result.ok) return res.status(400).json({ message: 'Missing token (no sid found)' });
  return res.json({ ok: true });
}
