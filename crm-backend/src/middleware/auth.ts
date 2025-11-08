import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { redis } from '../redis';

const JWT_SECRET = process.env.JWT_SECRET as string;
const sessionKey = (sid: string) => `auth:session:${sid}`;

export type JwtUser = { id: number; role: 'ADMIN' | 'AGENT'; sid: string };

export async function authRequired(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing token' });

  try {
    const token = header.slice(7);
    const p: any = jwt.verify(token, JWT_SECRET);
    if (p.typ && p.typ !== 'access') return res.status(401).json({ message: 'Invalid token type' });

    const sid = String(p.sid || '');
    if (!sid) return res.status(401).json({ message: 'Invalid token (no session)' });

    // ⬇ Phiên đã bị xoá sau logout => từ chối luôn
    const exists = await redis.exists(sessionKey(sid));
    if (!exists) return res.status(401).json({ message: 'Session expired' });

    (req as any).user = { id: Number(p.id), role: p.role, sid };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export function adminOnly(req: Request, res: Response, next: NextFunction) {
  const u: JwtUser | undefined = (req as any).user;
  if (!u) return res.status(401).json({ message: 'Unauthorized' });
  if (u.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });
  return next();
}
