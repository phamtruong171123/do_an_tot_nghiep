import { PrismaClient, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { redis } from '../../redis';

const prisma = new PrismaClient();

// ==== TTL ====
const ACCESS_TTL_SECONDS  = 60 * 60 * 5;        // 5 giờ
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 7;   // 7 ngày

// ==== Redis keys (blacklist) ====
const blRtKey = (jti: string) => `auth:blacklist:rt:${jti}`;
const blAtKey = (jti: string) => `auth:blacklist:at:${jti}`; 

// ==== Helpers ====
function signAccess(uid: number, role: string) {
 
  const jti = `${Date.now()}-${Math.random()}`;
  const token = jwt.sign(
    { uid, role, typ: 'access' },
    process.env.JWT_SECRET!,
    { expiresIn: ACCESS_TTL_SECONDS, jwtid: jti, subject: String(uid) }
  );
  return { token, jti };
}

function signRefresh(uid: number) {
  const jti = `${Date.now()}-${Math.random()}`;
  const token = jwt.sign(
    { uid, typ: 'refresh' },
    process.env.JWT_SECRET!,
    { expiresIn: REFRESH_TTL_SECONDS, jwtid: jti, subject: String(uid) }
  );
  return { token, jti };
}

function getJwtExpSeconds(token: string): number | null {
  try {
    const d: any = jwt.decode(token);
    if (!d?.exp) return null;
    return d.exp as number; // seconds since epoch
  } catch {
    return null;
  }
}

async function blacklistToken(key: string, expSec: number | null) {
  if (!expSec) return;
  const ttl = Math.max(1, expSec - Math.floor(Date.now() / 1000));
  // Use separate SET + EXPIRE to match ioredis typings
  await redis.set(key, '1');
  await redis.expire(key, ttl);
}

async function isBlacklisted(key: string) {
  return (await redis.exists(key)) === 1;
}

// ====== API ======

export type RevokeParams = {
  accessToken?: string;
  refreshToken?: string;
};

/** Thu hồi token: đưa token vào blacklist đến khi hết hạn */
export async function revokeSession(params: RevokeParams): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
   
    if (params.refreshToken) {
      const payload: any = jwt.verify(params.refreshToken, process.env.JWT_SECRET!);
      const jti = payload?.jti as string | undefined;
      if (!jti) return { ok: false, reason: 'NO_JTI' };
      const expSec = getJwtExpSeconds(params.refreshToken);
      await blacklistToken(blRtKey(jti), expSec);
    }
    // Optional: revoke luôn access hiện tại nếu truyền vào
    if (params.accessToken) {
      try {
        const p: any = jwt.verify(params.accessToken, process.env.JWT_SECRET!);
        if (p?.jti) {
          const expSec = getJwtExpSeconds(params.accessToken);
          await blacklistToken(blAtKey(p.jti), expSec);
        }
      } catch {
        // access có thể đã hết hạn, bỏ qua
      }
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: 'BLACKLIST_ERROR' };
  }
}

export async function login(username: string, password: string, deviceInfo?: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || user.status !== UserStatus.ACTIVE) throw new Error('INVALID_CREDENTIALS');

  const ok = await bcrypt.compare(password, (user as any).passwordHash);
  if (!ok) throw new Error('INVALID_CREDENTIALS');

  const a = signAccess(user.id, user.role as any);
  const r = signRefresh(user.id);
  await prisma.agentProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, online: true, userLoad: 0, lastOnlineAt: new Date() },
    update: { online: true, lastOnlineAt: new Date() },
  })

  return {
    accessToken: a.token,
    refreshToken: r.token,
    user: { id: user.id, username: user.username, role: user.role }
  };
}

export async function refresh(refreshToken: string) {
  // Verify chữ ký + hạn
  const payload: any = jwt.verify(refreshToken, process.env.JWT_SECRET!); 
  if (payload?.typ !== 'refresh') throw new Error('INVALID_TOKEN_TYPE');

  // Check blacklist
  if (payload?.jti && (await isBlacklisted(blRtKey(payload.jti)))) {
    throw new Error('TOKEN_REVOKED');
  }

  const uid = Number(payload?.uid);
  if (!uid) throw new Error('INVALID_TOKEN');

  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user || user.status !== UserStatus.ACTIVE) throw new Error('INVALID_SESSION');

  const a = signAccess(user.id, user.role as any);
  return { accessToken: a.token };
}

export async function logout(refreshToken: string, accessToken?: string) {
  const result = await revokeSession({ refreshToken, accessToken });
  if (!result.ok) throw new Error(result.reason);
}

export async function me(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, username: true, email: true, role: true, status: true, createdAt: true,
      // nếu muốn trả luôn tình trạng tác vụ/online:
      agentProfile: { select: { online: true, userLoad: true, lastOnlineAt: true } }
    }
  });
}
