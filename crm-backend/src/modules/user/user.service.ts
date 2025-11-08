import { PrismaClient, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/** Danh sách user (kèm AgentProfile) */
export async function list() {
  return prisma.user.findMany({
    include: { agentProfile: true },
    orderBy: { id: 'asc' }
  });
}

/** Đổi trạng thái ACTIVE/INACTIVE (admin) */
export async function setStatus(id: number, status: UserStatus) {
  return prisma.user.update({ where: { id }, data: { status } });
}

/** Đổi mật khẩu */
export async function changePassword(userId: number, currentPassword: string, newPassword: string) {
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u) throw new Error('NOT_FOUND');

  const ok = await bcrypt.compare(currentPassword, u.passwordHash);
  if (!ok) throw new Error('BAD_CURRENT_PASSWORD');

  const nextHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: nextHash } });
  return { ok: true };
}
