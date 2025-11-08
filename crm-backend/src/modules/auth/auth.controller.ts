import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as S from './auth.service';

const JWT_SECRET = process.env.JWT_SECRET as string;

function signAccessToken(payload: { id: number; role: 'ADMIN' | 'AGENT' }) {
  return jwt.sign({ ...payload, typ: 'access' }, JWT_SECRET, { expiresIn: '15m' });
}
function signRefreshToken(payload: { id: number; role: 'ADMIN' | 'AGENT' }) {
  return jwt.sign({ ...payload, typ: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });
}

export async function login(req: Request, res: Response) {
  const { username, password } = req.body as { username?: string; password?: string };

  // chỉ kiểm tra username + password
  if (!username || !password) {
    return res.status(400).json({ message: 'username & password required' });
  }

  // username là unique -> dùng findUnique cho gọn/nhanh
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  // (tuỳ chọn) chặn user INACTIVE
  if (user.status === 'INACTIVE') {
    return res.status(403).json({ message: 'User is inactive' });
  }

  const payload = { id: user.id, role: user.role as 'ADMIN' | 'AGENT' };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

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

    // có thể kiểm tra user còn tồn tại
    const user = await prisma.user.findUnique({ where: { id: Number(decoded.id) } });
    if (!user) return res.status(401).json({ message: 'User not found' });

    const accessToken = signAccessToken({ id: user.id, role: user.role as 'ADMIN' | 'AGENT' });
    return res.json({ accessToken });
  } catch {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
}

export async function logout(req: Request, res: Response) {
  const auth = req.headers.authorization;
  const accessToken = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
  const refreshToken = (req.body as any)?.refreshToken as string | undefined;
  const sid = (req as any).user?.sid as string | undefined;

  const result = await S.logoutService({ sid, accessToken, refreshToken });
  if (!result.ok) return res.status(400).json({ message: 'Missing token (no sid found)' });

  return res.json({ ok: true });
}
