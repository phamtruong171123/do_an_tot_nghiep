import { PrismaClient, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { access } from 'fs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { redis } from '../../redis';

const prisma = new PrismaClient();
const ACCESS_TTL_SECONDS = 60 * 30 *5;           // 5h
const REFRESH_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 ngày
const sessionKey = (sid: string) => `auth:session:${sid}`;

type LogoutParams = {
  sid?: string | null;
  accessToken?: string;
  refreshToken?: string;
};
function extractSid(token?: string): string | null {
  if (!token) return null;
  try {
    const p: any = jwt.verify(token,process.env.JWT_SECRET!);
    return p?.sid ?? null;
  } catch {
    return null;
  }
}

export async function logoutService(params: LogoutParams): Promise<{ ok: true } | { ok: false; reason: string }> {
  let sid = params.sid ?? null;

  if (!sid) sid = extractSid(params.accessToken);
  if (!sid) sid = extractSid(params.refreshToken);

  if (!sid) return { ok: false, reason: 'NO_SID' };

  await redis.del(sessionKey(sid));
  return { ok: true };
}

export async function login(username: string, password: string, deviceInfo?: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || user.status !== UserStatus.ACTIVE) throw new Error('INVALID_CREDENTIALS');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error('INVALID_CREDENTIALS');

  const accessToken = jwt.sign({ uid: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: ACCESS_TTL_SECONDS });
  const refreshToken = jwt.sign({ uid: user.id, sid: Date.now() }, process.env.JWT_SECRET!);
  const expiredAt = new Date(Date.now() + REFRESH_TTL_MS);

  await prisma.userSession.create({ data: { userId: user.id, refreshToken, deviceInfo, expiredAt } });

  return { accessToken, refreshToken, user: { id: user.id, username: user.username, role: user.role } };
}

export async function refresh(refreshToken: string) {
  const session = await prisma.userSession.findUnique({ where: { refreshToken } });
  if (!session || !session.isActive || session.expiredAt < new Date()) throw new Error('INVALID_SESSION');

  const payload = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.status !== UserStatus.ACTIVE) throw new Error('INVALID_SESSION');

  const accessToken = jwt.sign({ uid: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: ACCESS_TTL_SECONDS });
  return { accessToken };
}

export async function logout(refreshToken: string) {
  await prisma.userSession.update({ where: { refreshToken }, data: { isActive: false } });
}

export async function me(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, email: true, role: true, status: true, createdAt: true }
  });
}
