import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import bcrypt from 'bcryptjs';
import type { Prisma, User, UserRole, UserStatus } from '@prisma/client';

// ====== Helpers ======
function parseIntOr(val: any, def: number) {
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n : def;
}

export async function me(req: Request, res: Response) {
  const userId = Number(req.user!.id); // convert string to number
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ message: 'Not found' });
  res.json({ id: user.id, username: user.username, email: user.email, role: user.role, status: user.status });
}

// GET /api/users?page=&pageSize=&q=&role=&status=&sort=createdAt:desc
export async function listUsers(req: Request, res: Response) {
  const page = parseIntOr(req.query.page, 1);
  const pageSize = Math.min(parseIntOr(req.query.pageSize, 20), 100);
  const q = (req.query.q as string | undefined)?.trim();
  const role = (req.query.role as UserRole | undefined) || undefined;
  const status = (req.query.status as UserStatus | undefined) || undefined;

  // sort
  let sortField = 'createdAt' as keyof User;
  let sortDir: Prisma.SortOrder = 'desc';
  if (typeof req.query.sort === 'string') {
    const [f, d] = req.query.sort.split(':');
    if (['id', 'username', 'email', 'createdAt', 'updatedAt'].includes(f)) sortField = f as any;
    if (['asc', 'desc'].includes((d || '').toLowerCase())) sortDir = d.toLowerCase() as Prisma.SortOrder;
  }

  // ⚠️ MySQL không hỗ trợ 'mode: insensitive' trong Prisma filter
  // Tìm kiếm sẽ phụ thuộc collation (thường là không phân biệt hoa/thường).
  const where: Prisma.UserWhereInput = {
    AND: [
      role ? { role } : {},
      status ? { status } : {},
      q
        ? {
            OR: [
              { username: { contains: q } },
              { email: { contains: q } },
            ],
          }
        : {},
    ],
  };

  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { [sortField]: sortDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  res.json({
    items: items.map((u) => ({ id: u.id, username: u.username, email: u.email, role: u.role, status: u.status })),
    total,
    page,
    pageSize,
  });
}

export async function getUser(req: Request, res: Response) {
  const id = Number(req.params.id); //  ép number
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) return res.status(404).json({ message: 'Not found' });
  res.json({ id: u.id, username: u.username, email: u.email, role: u.role, status: u.status });
}

export async function createUser(req: Request, res: Response) {
  const { username, email, password, role = 'AGENT', status = 'ACTIVE' } = req.body as {
    username?: string;
    email?: string | null;
    password?: string;
    role?: UserRole;
    status?: UserStatus;
  };
  if (!username || !password) return res.status(400).json({ message: 'username & password required' });

  // unique checks
  const exists = await prisma.user.findFirst({
    where: { OR: [{ username }, ...(email ? [{ email }] : [])] },
    select: { id: true },
  });
  if (exists) return res.status(409).json({ message: 'username/email already exists' });

  const hash = await bcrypt.hash(password, 10);
  const created = await prisma.user.create({
    data: { username, email: email ?? null, passwordHash: hash, role, status },
  });
  res
    .status(201)
    .json({ id: created.id, username: created.username, email: created.email, role: created.role, status: created.status });
}

export async function updateUser(req: Request, res: Response) {
  const id = Number(req.params.id); //  ép number
  const { role, status, password, username, email } = req.body as Partial<{
    role: UserRole;
    status: UserStatus;
    password: string;
    username: string;
    email: string | null;
  }>;

  // unique check nếu đổi username/email
  if (username || typeof email !== 'undefined') {
    const conflict = await prisma.user.findFirst({
      where: {
        id: { not: id }, //  id là number
        OR: [
          ...(username ? [{ username }] : []),
          ...(typeof email !== 'undefined' ? [{ email: email ?? null }] : []),
        ],
      },
      select: { id: true },
    });
    if (conflict) return res.status(409).json({ message: 'username/email already exists' });
  }

  const data: Prisma.UserUpdateInput = {};
  if (role) data.role = role;
  if (status) data.status = status;
  if (username) (data as any).username = username;
  if (typeof email !== 'undefined') (data as any).email = email ?? null;
  if (password) (data as any).passwordHash = await bcrypt.hash(password, 10);

  const updated = await prisma.user.update({ where: { id }, data });
  res.json({ id: updated.id, username: updated.username, email: updated.email, role: updated.role, status: updated.status });
}

export async function deleteUser(req: Request, res: Response) {
  const id = Number(req.params.id); //  ép number
  await prisma.user.delete({ where: { id } });
  res.status(204).end();
}

// ====== Self-service ======
export async function updateMe(req: Request, res: Response) {
  const id = Number(req.user!.id); // number
  const { username, email } = req.body as { username?: string; email?: string | null };

  if (!username && typeof email === 'undefined') {
    return res.status(400).json({ message: 'nothing to update' });
  }

  const conflict = await prisma.user.findFirst({
    where: {
      id: { not: id },
      OR: [
        ...(username ? [{ username }] : []),
        ...(typeof email !== 'undefined' ? [{ email: email ?? null }] : []),
      ],
    },
    select: { id: true },
  });
  if (conflict) return res.status(409).json({ message: 'username/email already exists' });

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(username ? { username } : {}),
      ...(typeof email !== 'undefined' ? { email: email ?? null } : {}),
    },
  });

  res.json({ id: updated.id, username: updated.username, email: updated.email, role: updated.role, status: updated.status });
}

export async function changePassword(req: Request, res: Response) {
  const id = Number(req.user!.id); // number
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) return res.status(400).json({ message: 'currentPassword & newPassword required' });

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ message: 'Not found' });

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) return res.status(400).json({ message: 'Current password incorrect' });

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id }, data: { passwordHash: hash } });
  res.json({ ok: true });
}

// ====== Admin: set status ======
export async function setUserStatus(req: Request, res: Response) {
  const id = Number(req.params.id); //  ép number
  const { status } = req.body as { status?: UserStatus };
  if (!status) return res.status(400).json({ message: 'status required' });

  const updated = await prisma.user.update({ where: { id }, data: { status } });
  res.json({ id: updated.id, status: updated.status });
}
