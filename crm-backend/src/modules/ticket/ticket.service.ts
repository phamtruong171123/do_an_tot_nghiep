import { PrismaClient, TicketPriority, TicketStatus } from "@prisma/client";

const prisma = new PrismaClient();

// Rule tính dueAt theo priority
function calcDueAt(priority: TicketPriority, base: Date = new Date()): Date {
  const d = new Date(base);
  switch (priority) {
    case "LOW":
      d.setHours(d.getHours() + 48);
      break;
    case "NORMAL":
      d.setHours(d.getHours() + 24);
      break;
    case "HIGH":
      d.setHours(d.getHours() + 8);
      break;
    case "URGENT":
      d.setHours(d.getHours() + 4);
      break;
  }
  return d;
}

// Mã ticket dạng: TCK-YYYYMMDD-0001
async function generateTicketCode() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");

  const startOfDay = new Date(y, today.getMonth(), today.getDate(), 0, 0, 0, 0);

  const countToday = await prisma.ticket.count({
    where: {
      createdAt: {
        gte: startOfDay,
      },
    },
  });

  const seq = String(countToday + 1).padStart(4, "0");
  return `TCK-${y}${m}${d}-${seq}`;
}

export type CreateTicketInput = {
  subject: string;
  description?: string | null;
  priority?: TicketPriority;
  conversationId?: string | null;
  customerId?: number | null;
  assigneeId?: number | null;
  createdById: number;
};

export async function createTicket(input: CreateTicketInput) {
  const {
    subject,
    description = null,
    priority = "NORMAL",
    conversationId = null,
    customerId = input.customerId ?? null,
    assigneeId = null,
    createdById,
  } = input;

  const now = new Date();
  const dueAt = calcDueAt(priority, now);
  const code = await generateTicketCode();

  const ticket = await prisma.ticket.create({
    data: {
      code,
      subject,
      description,
      status: "OPEN",
      priority,
      dueAt,
      conversationId,
      customerId,
      assigneeId,
      createdById,
    },
  });

  return ticket;
}

export async function listTickets(params: {
  userId: number;
  status?: TicketStatus;
  assigneeId?: number;
  mine?: boolean;
  q?: string;
  limit?: number;
  offset?: number;
}) {
  const { userId, status, assigneeId, mine, q, limit = 20, offset = 0 } = params;

  const where: any = {};

  if (status) where.status = status;
  if (typeof assigneeId === "number") where.assigneeId = assigneeId;
  if (mine) where.assigneeId = userId;
  if (q && q.trim()) {
    where.OR = [{ code: { contains: q } }, { subject: { contains: q } }];
  }

  const [items, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      include: {
        assignee: { select: { id: true, username: true } },
        customer: { select: { id: true, name: true } },
        _count: {
          select: { notes: true },
        },
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  return { items, total };
}

export async function getTicket(id: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, username: true } },
      createdBy: { select: { id: true, username: true } },
      customer: { select: { id: true, name: true, avatarUrl: true } },
      conversation: true,
    },
  });
  return ticket;
}

export type UpdateTicketInput = {
  subject?: string;
  description?: string | null;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: number | null;
};

export async function getTicketByUser(userId: number) {
  const tickets = await prisma.ticket.findMany({
    where: { assigneeId: userId },
  });
  return tickets;
}

export async function updateTicket(id: string, input: UpdateTicketInput) {
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) throw new Error("Ticket not found");

  if (ticket.status === "CLOSED") {
    throw new Error("Cannot update a closed ticket");
  }
  const data: any = { ...input };
  if (input.status === "CLOSED") {
  }
  // nếu đổi priority thì tính lại dueAt
  if (input.priority && input.priority !== ticket.priority) {
    data.dueAt = calcDueAt(input.priority, new Date());
  }

  // nếu đổi status sang CLOSED thì set closedAt
  if (input.status && input.status === "CLOSED" && !ticket.closedAt) {
    data.closedAt = new Date();
  }

  const updated = await prisma.ticket.update({
    where: { id },
    data,
    include: {
      assignee: { select: { id: true, username: true } },
      createdBy: { select: { id: true, username: true } },
      customer: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  return updated;
}
