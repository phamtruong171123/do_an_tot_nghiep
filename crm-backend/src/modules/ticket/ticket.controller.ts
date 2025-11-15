
import { Request, Response } from "express";
import { PrismaClient, TicketPriority, TicketStatus } from "@prisma/client";
import { createTicket, listTickets, getTicket, updateTicket } from "./ticket.service";
import { findOrCreateCustomerByExternalId } from "../customer/customer.service";

const prisma = new PrismaClient();

type AuthUser = {
  id: number;
  role: "ADMIN" | "AGENT";
  sid?: string;
};

function parseUserId(req: Request): number | null {
  const raw =
    (req as any).userId ||
    (req.body as any)?.userId ||
    (req.query as any)?.userId;
  const id = Number(raw);
  if (!id || !Number.isFinite(id)) return null;
  return id;
}

// ========== CRUD TICKET cơ bản ==========


// List ticket của một user 
export async function listTicketsByUserHandler(req: Request, res: Response) {
  const authUser = (req as any).user as AuthUser | undefined;
  if (!authUser) return res.status(401).json({ message: "Unauthenticated" });

  const targetUserId = Number(req.params.userId);
  if (!targetUserId || !Number.isFinite(targetUserId)) {
    return res.status(400).json({ error: "Invalid userId" });
  }

  // AGENT chỉ được xem ticket của chính mình
  if (authUser.role !== "ADMIN" && authUser.id !== targetUserId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = Number(req.query.offset) || 0;
  const q = (req.query.q as string) || "";
  const statusParam = (req.query.status as string) || "";
  const status = (["OPEN", "PENDING", "CLOSED"] as TicketStatus[]).includes(
    statusParam as TicketStatus
  )
    ? (statusParam as TicketStatus)
    : undefined;

  try {
    const data = await listTickets({
      userId: targetUserId,
      status,
      assigneeId: targetUserId, // tất cả ticket được assign cho user này
      mine: false,              // không dùng mine ở đây
      q,
      limit,
      offset,
    });

    const now = new Date();

    return res.json({
      items: data.items.map((t) => ({
        id: t.id,
        code: t.code,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        dueAt: t.dueAt,
        isOverdue:
          !!t.dueAt &&
          (t.status === "OPEN" || t.status === "PENDING") &&
          now > t.dueAt,
        assignee: t.assignee
          ? { id: t.assignee.id, name: t.assignee.username }
          : null,
        customer: t.customer
          ? { id: t.customer.id, name: t.customer.name }
          : null,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
      total: data.total,
    });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: "Failed to list tickets by user" });
  }
}


export async function listTicketsHandler(req: Request, res: Response) {
  const authUser = (req as any).user as AuthUser | undefined;
  if (!authUser) return res.status(401).json({ message: "Unauthenticated" });

  const userId = authUser.id;

  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = Number(req.query.offset) || 0;
  const q = (req.query.q as string) || "";
  const mine = String(req.query.mine || "0") === "1";

  const statusParam = (req.query.status as string) || "";
  const status = (["OPEN", "PENDING", "CLOSED"] as TicketStatus[]).includes(
    statusParam as TicketStatus
  )
    ? (statusParam as TicketStatus)
    : undefined;

  const assigneeId = req.query.assigneeId
    ? Number(req.query.assigneeId)
    : undefined;

  try {
    const data = await listTickets({
      userId,
      status,
      assigneeId,
      mine,
      q,
      limit,
      offset,
    });

    const now = new Date();

    return res.json({
      items: data.items.map((t) => ({
        id: t.id,
        code: t.code,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        dueAt: t.dueAt,
        isOverdue:
          !!t.dueAt &&
          (t.status === "OPEN" || t.status === "PENDING") &&
          now > t.dueAt,
        assignee: t.assignee
          ? { id: t.assignee.id, name: t.assignee.username }
          : null,
        customer: t.customer
          ? { id: t.customer.id, name: t.customer.name }
          : null,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
      total: data.total,
    });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: "Failed to list tickets" });
  }
}

export async function getTicketHandler(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const t = await getTicket(id);
    if (!t) return res.status(404).json({ error: "Ticket not found" });

    const now = new Date();

    return res.json({
      id: t.id,
      code: t.code,
      subject: t.subject,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueAt: t.dueAt,
      isOverdue:
        !!t.dueAt &&
        (t.status === "OPEN" || t.status === "PENDING") &&
        now > t.dueAt,
      resolvedAt: t.resolvedAt,
      closedAt: t.closedAt,
      assignee: t.assignee
        ? { id: t.assignee.id, name: t.assignee.username }
        : null,
      createdBy: t.createdBy
        ? { id: t.createdBy.id, name: t.createdBy.username }
        : null,
      customer: t.customer
        ? {
            id: t.customer.id,
            name: t.customer.name,
            avatarUrl: t.customer.avatarUrl,
          }
        : null,
      conversationId: t.conversationId,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: "Failed to get ticket" });
  }
}

export async function createTicketHandler(req: Request, res: Response) {
  const authUser = (req as any).user as AuthUser | undefined;
  if (!authUser) return res.status(401).json({ message: "Unauthenticated" });

  const { id: userId } = authUser;

  const {
    subject,
    description,
    priority,
    conversationId,
    customerId,
    assigneeId,
  } = req.body as {
    subject?: string;
    description?: string;
    priority?: TicketPriority;
    conversationId?: string;
    customerId?: string;
    assigneeId?: number;
  };

  if (!subject || !subject.trim()) {
    return res.status(400).json({ error: "subject required" });
  }

  try {
    const ticket = await createTicket({
      subject: subject.trim(),
      description: description || null,
      priority: priority || "NORMAL",
      conversationId: conversationId || null,
      customerId: customerId || null,
      assigneeId: assigneeId ?? null,
      createdById: userId,
    });

    return res.status(201).json(ticket);
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: "Failed to create ticket" });
  }
}


export async function updateTicketHandler(req: Request, res: Response) {
  const authUser = (req as any).user as AuthUser | undefined;
  if (!authUser) return res.status(401).json({ message: "Unauthenticated" });

  const { id } = req.params;
  const { subject, description, status, priority, assigneeId } = req.body as {
    subject?: string;
    description?: string;
    status?: TicketStatus;
    priority?: TicketPriority;
    assigneeId?: number | null;
  };

  try {
    // Nếu không phải ADMIN thì chỉ được sửa ticket của mình (assignee hoặc người tạo)
    if (authUser.role !== "ADMIN") {
      const t = await prisma.ticket.findUnique({
        where: { id },
        select: { assigneeId: true, createdById: true },
      });
      if (!t) return res.status(404).json({ error: "Ticket not found" });
      if (t.assigneeId !== authUser.id && t.createdById !== authUser.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    const ticket = await updateTicket(id, {
      subject,
      description,
      status,
      priority,
      assigneeId, // cho phép ADMIN/owner đổi luôn (chuyển nhượng thì dùng API riêng bên dưới)
    });

    return res.json(ticket);
  } catch (e: any) {
    console.error(e);
    return res
      .status(400)
      .json({ error: e?.message || "Failed to update ticket" });
  }
}

// chuyển nhượng ticket cho user khác (chỉ ADMIN được dùng)
export async function assignTicketHandler(req: Request, res: Response) {
  const authUser = (req as any).user as AuthUser | undefined;
  if (!authUser) return res.status(401).json({ message: "Unauthenticated" });

  if (authUser.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin only" });
  }

  const { id } = req.params;
  const { assigneeId } = req.body as { assigneeId?: number | null };

  if (typeof assigneeId !== "number" || !Number.isFinite(assigneeId)) {
    return res.status(400).json({ error: "assigneeId must be number" });
  }

  try {
    // kiểm tra user nhận có tồn tại & đang ACTIVE
    const user = await prisma.user.findUnique({
      where: { id: assigneeId },
      select: { id: true, role: true, status: true },
    });
    if (!user) {
      return res.status(400).json({ error: "Assignee not found" });
    }
    if (user.status !== "ACTIVE") {
      return res.status(400).json({ error: "Assignee is not active" });
    }

    const ticket = await updateTicket(id, {
      assigneeId,
    });
  const result= res.json(ticket);
   return result;
  } catch (e: any) {
    console.error(e);
    return res
      .status(400)
      .json({ error: e?.message || "Failed to assign ticket" });
  }
}


// ========== Tạo ticket từ Conversation (dùng cho màn Chat) ==========

export async function createTicketFromConversationHandler(
  req: Request,
  res: Response
) {
  const authUser = (req as any).user as AuthUser | undefined;
  if (!authUser) return res.status(401).json({ message: "Unauthenticated" });

  const { id: userId } = authUser;

  const conversationId = req.params.id;
  const { subject, description, priority, assigneeId } = req.body as {
    subject?: string;
    description?: string;
    priority?: TicketPriority;
    assigneeId?: number;
  };

  if (!subject || !subject.trim()) {
    return res.status(400).json({ error: "subject required" });
  }

  try {
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        externalUserId: true,
        title: true,
        avataUrl: true,
        customerId: true,
      },
    });

    if (!conv) return res.status(404).json({ error: "Conversation not found" });

    let customerId = conv.customerId || null;

    if (!customerId && conv.externalUserId) {
      const customer = await findOrCreateCustomerByExternalId({
        externalId: conv.externalUserId,
        name: conv.title,
        avatarUrl: conv.avataUrl,
      });

      customerId = customer.id;

      await prisma.conversation.update({
        where: { id: conv.id },
        data: { customerId: customer.id },
      });
    }

    const ticket = await createTicket({
      subject: subject.trim(),
      description: description || null,
      priority: priority || "NORMAL",
      conversationId: conv.id,
      customerId,
      assigneeId: assigneeId ?? userId, // mặc định gán cho user đang login
      createdById: userId,
    });

    return res.status(201).json(ticket);
  } catch (e: any) {
    console.error(e);
    return res
      .status(500)
      .json({ error: "Failed to create ticket from conversation" });
  }
}

