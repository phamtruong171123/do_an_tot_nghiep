import { Request, Response } from "express";
import { PrismaClient, CustomerSegment } from "@prisma/client";

const prisma = new PrismaClient();

export async function listCustomersHandler(req: Request, res: Response) {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const offset = (page - 1) * limit;
  const q = (req.query.q as string | undefined)?.trim();

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { externalId: { contains: q } },
          { email: { contains: q, mode: "insensitive" } },
          { phoneNumber: { contains: q } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      select: {
        id: true,
        externalId: true,
        name: true,
        avatarUrl: true,
        note: true,
        phoneNumber: true,
        email: true,
        segment: true,
        address: true,
        createdAt: true,
        updatedAt: true,
        conversation: {
          select: {
            id: true,
            lastMessageAt: true,
            lastMessageText: true,
            unreadCount: true,
            assignee: {
              select: { id: true, username: true, fullName: true },
            },
          },
        },
        _count: {
          select: { tickets: true },
        },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return res.json({
    items: items.map((c) => ({
      id: c.id,
      externalId: c.externalId, // PSID
      name: c.name,
      avatarUrl: c.avatarUrl,
      note: c.note,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      phoneNumber: c.phoneNumber,
      email: c.email,
      address: c.address,
      segment: c.segment,
      ticketsCount: c._count.tickets,
      conversation: c.conversation
        ? {
            id: c.conversation.id,
            lastMessageAt: c.conversation.lastMessageAt,
            lastMessageText: c.conversation.lastMessageText,
            unreadCount: c.conversation.unreadCount,
            assignee: c.conversation.assignee
              ? {
                  id: c.conversation.assignee.id,
                  username: c.conversation.assignee.username,
                  fullName: c.conversation.assignee.fullName,
                }
              : null,
          }
        : null,
    })),
    total,
    page,
    pageSize: limit,
  });
}

export async function getCustomerHandler(req: Request, res: Response) {
  const idNum = Number(req.params.id);
  if (!idNum || !Number.isFinite(idNum)) {
    return res.status(400).json({ error: "Invalid customer id" });
  }

  const c = await prisma.customer.findUnique({
    where: { id: idNum },
    include: {
      conversation: {
        include: {
          channel: true,
          assignee: {
            select: { id: true, username: true, fullName: true },
          },
        },
      },
      tickets: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          code: true,
          subject: true,
          status: true,
          priority: true,

          dueAt: true,
          createdAt: true,
          assignee: {
            select: { id: true, username: true, fullName: true },
          },
        },
      },
    },
  });

  if (!c) return res.status(404).json({ error: "Customer not found" });

  return res.json({
    id: c.id,
    externalId: c.externalId,
    name: c.name,
    avatarUrl: c.avatarUrl,
    note: c.note,
    phoneNumber: c.phoneNumber,
    email: c.email,
    address: c.address,
    segment: c.segment,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    conversation: c.conversation
      ? {
          id: c.conversation.id,
          channel: {
            id: c.conversation.channelId,
            type: c.conversation.channel.type,
            pageName: c.conversation.channel.pageName,
          },
          lastMessageAt: c.conversation.lastMessageAt,
          lastMessageText: c.conversation.lastMessageText,
          unreadCount: c.conversation.unreadCount,
          assignee: c.conversation.assignee
            ? {
                id: c.conversation.assignee.id,
                username: c.conversation.assignee.username,
                fullName: c.conversation.assignee.fullName,
              }
            : null,
        }
      : null,
    tickets: c.tickets.map((t) => ({
      id: t.id,
      code: t.code,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      dueAt: t.dueAt,
      createdAt: t.createdAt,
      assignee: t.assignee
        ? {
            id: t.assignee.id,
            username: t.assignee.username,
            fullName: t.assignee.fullName,
          }
        : null,
    })),
  });
}

export async function createCustomer(req: Request, res: Response) {
  const { name, email, phoneNumber, address, segment, note } = req.body as {
    name?: string;
    email?: string | null;
    phoneNumber?: string | null;
    address?: string | null;
    segment?: CustomerSegment | string | null;
    note?: string | null;
  };

  // 1. Validate đơn giản
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name is required" });
  }

  // 2. Chuẩn hoá segment: default = POTENTIAL, validate enum
  let segmentValue: CustomerSegment | undefined;
  if (!segment || segment === "ALL") {
    segmentValue = CustomerSegment.POTENTIAL;
  } else {
    const segStr = String(segment).toUpperCase();
    if ((Object.values(CustomerSegment) as string[]).includes(segStr)) {
      segmentValue = segStr as CustomerSegment;
    } else {
      // nếu FE gửi linh tinh
      return res.status(400).json({ error: "Invalid segment value" });
    }
  }

  try {
    const created = await prisma.customer.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phoneNumber: phoneNumber?.trim() || null,
        address: address?.trim() || null,
        segment: segmentValue,
        note: note?.trim() || null,
        // externalId, avatarUrl… nếu cần thì set thêm ở đây
      },
      select: {
        id: true,
        externalId: true,
        name: true,
        avatarUrl: true,
        note: true,
        phoneNumber: true,
        email: true,
        address: true,
        segment: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(201).json(created);
  } catch (e: any) {
    console.error("Failed to create customer", e);

    if (e.code === "P2002") {
      // unique constraint, ví dụ trùng externalId / email nếu anh set unique
      return res.status(409).json({ error: "Customer already exists" });
    }

    return res.status(500).json({ error: "Failed to create customer" });
  }
}

export async function updateCustomerHandler(req: Request, res: Response) {
  const idNum = Number(req.params.id);
  if (!idNum || !Number.isFinite(idNum)) {
    return res.status(400).json({ error: "Invalid customer id" });
  }

  const { name, note, segment, email, phoneNumber, address } = req.body as {
    name?: string | null;
    note?: string | null;
    segment?: CustomerSegment | string | null;
    email?: string | null;
    phoneNumber?: string | null;
    address?: string | null;
  };

  // chuẩn hoá segment nếu có
  let segmentData: CustomerSegment | undefined;
  if (segment !== undefined && segment !== null) {
    const segStr = String(segment).toUpperCase();
    if ((Object.values(CustomerSegment) as string[]).includes(segStr)) {
      segmentData = segStr as CustomerSegment;
    } else {
      return res.status(400).json({ error: "Invalid segment value" });
    }
  }

  try {
    const updated = await prisma.customer.update({
      where: { id: idNum },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(note !== undefined ? { note } : {}),
        ...(segmentData !== undefined ? { segment: segmentData } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(phoneNumber !== undefined ? { phoneNumber } : {}),
        ...(address !== undefined ? { address } : {}),
      },
      select: {
        id: true,
        externalId: true,
        name: true,
        avatarUrl: true,
        note: true,
        phoneNumber: true,
        email: true,
        address: true,
        segment: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json(updated);
  } catch (e: any) {
    if (e.code === "P2025") {
      return res.status(404).json({ error: "Customer not found" });
    }
    console.error(e);
    return res.status(500).json({ error: "Failed to update customer" });
  }
}
