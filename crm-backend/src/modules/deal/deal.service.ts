import { PrismaClient, DealStage, Prisma } from "@prisma/client";
import { promoteSegmentFromDeals, touchCustomerActivity } from "../customer/customerSegment.service";

export type UserCtx = { id: number; role: "ADMIN" | "AGENT"};
function httpError(statusCode: number, message: string) {
  const e: any = new Error(message);
  e.statusCode = statusCode;
  return e;
}

function toDecimal(v: any): Prisma.Decimal | null {
  if (v === null || v === undefined || v === "") return null;
  try {
    return new Prisma.Decimal(v);
  } catch {
    throw httpError(400, "Invalid decimal value");
  }
}

function isLockedStage(stage: DealStage) {
  return stage === "PENDING_CONTRACT_APPROVAL" || stage === "CONTRACT";
}


const prisma = new PrismaClient();

/**
 * List deals, có thể filter theo customerId
 */
export async function listDeals(params: {
  customerId?: number;
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: "createdAt" | "amount" | "appointmentAt";
  sortOrder?: "asc" | "desc";
  stage?: string;
  user: UserCtx;
  view?: "mine" | "pendingApproval";
}) {
  const {
    customerId,
    page = 1,
    pageSize = 20,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;



  const where: Prisma.DealWhereInput = {};
  const view=params.view || "mine";
  if(view==="pendingApproval") {
    if(params.user.role!=="ADMIN") {
      throw httpError(403, "Forbidden");
    }
    where.stage="PENDING_CONTRACT_APPROVAL";
  }else {
    where.ownerId = params.user.id;
    if(params.stage) where.stage = params.stage as DealStage;
  }

  if (typeof customerId === "number") {
    where.customerId = customerId;
  }

  if (search && search.trim() !== "") {
    const q = search.trim();
    where.OR = [
      {
        title: {
          contains: q,
        },
      },
      {
        customer: {
          name: {
            contains: q,
          },
        },
      },
      {
        code: {
          contains: q,
        }
      },
    ];
  }

  let orderBy: Prisma.DealOrderByWithRelationInput;

  switch (sortBy) {
    case "amount":
      orderBy = { amount: sortOrder };
      break;
    case "appointmentAt":
      orderBy = { appointmentAt: sortOrder };
      break;
    case "createdAt":
    default:
      orderBy = { createdAt: sortOrder };
      break;
  }

  const [items, total] = await Promise.all([
    prisma.deal.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        customer: {
          select: { id: true, name: true },
        },
        owner: {
          select: { id: true, fullName: true },
        },
      },
    }),
    prisma.deal.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

/**
 * Lấy chi tiết 1 deal
 */
export async function getDeal(id: string) {
  return prisma.deal.findUnique({
    where: { id },
    include: {
      customer: true,
      owner: {
        select: { id: true, fullName: true, email: true },
      },
      activities: {
        orderBy: { activityAt: "desc" },
        take: 20,
        include: {
          author: {
            select: { id: true, fullName: true },
          },
        },
      },
    },
  });
}

export async function getDealForUser(id: string, user: UserCtx) {
  const deal = await getDeal(id);
  if (!deal) return null;
  if (user.role !== "ADMIN" && deal.ownerId !== user.id) return null;
  return deal;
}


/**
 * Tạo deal mới
 */
export async function createDeal(data: {
  customerId: number;
  title: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  paidAmount?: number;
  costNote?:string;
  appointmentAt?: Date;
  ownerId?: number;
}) {
  const code = "DE-" + Date.now();

  const  created = await prisma.deal.create({
    data: {
      code,
      title: data.title,
      description: data.description,
      customerId: data.customerId,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      paidAmount: data.paidAmount,
      costNote: data.costNote,
      appointmentAt: data.appointmentAt,
      ownerId: data.ownerId,
    },
  });
  await touchCustomerActivity(prisma, data.customerId,  { reviveIfDropped: false });
  return created;
}

/**
 * Cập nhật deal
 */
export async function updateDeal(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    stage: DealStage;
    amount: number;
    currency: string;
    appointmentAt: Date;
    closedAt: Date | null;
    ownerId: number | null;
  }>
) {
  return prisma.deal.update({
    where: { id },
    data,
  });
}

/**
 * Thêm activity cho deal
 */
export async function addDealActivity(data: {
  dealId: string;
  authorId: number;
  content: string;
  activityAt?: Date;
}) {
  return prisma.dealActivity.create({
    data: {
      dealId: data.dealId,
      authorId: data.authorId,
      content: data.content,
      activityAt: data.activityAt ?? new Date(),
    },
    include: {
      author: {
        select: { id: true, fullName: true },
      },
    },
  });
}

/**
 * List activity của deal
 */
export async function listDealActivities(dealId: string, limit = 20) {
  return prisma.dealActivity.findMany({
    where: { dealId },
    orderBy: { activityAt: "desc" },
    take: limit,
    include: {
      author: { select: { id: true, fullName: true } },
    },
  });
}

/**
 * Recent deals cho 1 customer
 */
export async function listRecentDealsForCustomer(customerId: number, limit = 5, ownerId?: number) {
  return prisma.deal.findMany({
    where: { customerId, ...(ownerId !== undefined ? { ownerId } : {}) },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      code: true,
      title: true,
      stage: true,
      amount: true,
      appointmentAt: true,
      createdAt: true,
    },
  });
}

export async function updateDealWithActivity(id: string, payload: any, user: UserCtx) {
  const old = await prisma.deal.findUnique({
    where: { id },
    select: { stage: true, ownerId: true },
  });
  if (!old) throw httpError(404, "Deal not found");

  // agent chỉ sửa deal của mình
  if (user.role !== "ADMIN" && old.ownerId !== user.id) {
    throw httpError(403, "Forbidden");
  }

  // khóa khi pending/contract
  if (isLockedStage(old.stage)) {
    throw httpError(409, "Deal is locked");
  }

  // không cho tự set pending/contract bằng PATCH
  if (payload?.stage === "PENDING_CONTRACT_APPROVAL" || payload?.stage === "CONTRACT") {
    throw httpError(400, "Use approval endpoints to move to pending/contract");
  }

  const updated = await prisma.deal.update({
    where: { id },
    data: {
      title: payload.title,
      description: payload.description,
      amount: payload.amount,
      currency: payload.currency,
      stage: payload.stage as DealStage,
      appointmentAt:payload.appointmentAt,
      unitPrice: payload.unitPrice !== undefined ? toDecimal(payload.unitPrice) : undefined,
      quantity: payload.quantity !== undefined ? toDecimal(payload.quantity) : undefined,
      paidAmount: payload.paidAmount !== undefined ? toDecimal(payload.paidAmount) : undefined,
      costNote: payload.costNote !== undefined ? String(payload.costNote) : undefined,
    },
  });

  if (payload.stage && payload.stage !== old.stage) {
    await prisma.dealActivity.create({
      data: {
        dealId: id,
        authorId: user.id,
        content: `Stage changed from ${old.stage} to ${payload.stage}`,
        activityAt: new Date(),
      },
    });
  }

  return updated;
}


export async function requestContractApproval(dealId: string, user: UserCtx) {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      stage: true,
      ownerId: true,
      unitPrice: true,
      quantity: true,
      paidAmount: true,
      costNote: true,
    },
  });
  if (!deal) throw httpError(404, "Deal not found");

  if (user.role !== "ADMIN" && deal.ownerId !== user.id) throw httpError(403, "Forbidden");
  if (isLockedStage(deal.stage)) throw httpError(409, "Deal is locked");

  const unitPrice = deal.unitPrice ? new Prisma.Decimal(deal.unitPrice as any) : null;
  const quantity = deal.quantity ? new Prisma.Decimal(deal.quantity as any) : null;
  const paidAmount = deal.paidAmount ? new Prisma.Decimal(deal.paidAmount as any) : null;
  const costNote = String(deal.costNote || "").trim();

  if (!unitPrice || unitPrice.lte(0)) throw httpError(400, "Unit price is required");
  if (!quantity || quantity.lte(0)) throw httpError(400, "Quantity is required");
  if (!costNote) throw httpError(400, "Cost explanation is required");
  if (!paidAmount || paidAmount.lte(0)) throw httpError(400, "Paid amount is required");

  const goodsAmount = unitPrice.mul(quantity);

 
  // if (paidAmount.lt(goodsAmount)) {
  //   throw httpError(400, "Paid amount must be greater than or equal to goods amount");
  // }

  return prisma.deal.update({
    where: { id: dealId },
    data: {
      stage: "PENDING_CONTRACT_APPROVAL",
      approvalRequestedAt: new Date(),
      approvalRequestedById: user.id,
      approvalRejectReason: null,
    },
  });
}

export async function approveContract(dealId: string, adminId: number) {
  const deal = await prisma.deal.findUnique({ where: { id: dealId }, select: { stage: true } });
  if (!deal) throw httpError(404, "Deal not found");
  if (deal.stage !== "PENDING_CONTRACT_APPROVAL") throw httpError(409, "Deal is not pending approval");


  const updated = prisma.deal.update({
    where: { id: dealId },
    data: {
      stage: "CONTRACT",
      approvalReviewedAt: new Date(),
      approvalReviewedById: adminId,
      closedAt: new Date(),
    },
  });
  await prisma.dealActivity.create({
    data: {
      dealId: dealId,
      authorId: adminId,
      content: `Stage changed from PENDING APPROVAL to CONTRACT`,
      activityAt: new Date(),
    }
  })

  return updated;
}

export async function rejectContract(dealId: string, adminId: number, reason: string) {
  const r = String(reason || "").trim();
  if (!r) throw httpError(400, "Reject reason is required");

  const deal = await prisma.deal.findUnique({ where: { id: dealId }, select: { stage: true } });
  if (!deal) throw httpError(404, "Deal not found");
  if (deal.stage !== "PENDING_CONTRACT_APPROVAL") throw httpError(409, "Deal is not pending approval");

  const  updated =prisma.deal.update({
    where: { id: dealId },
    data: {
      stage: "NEGOTIATION",
      approvalReviewedAt: new Date(),
      approvalReviewedById: adminId,
      approvalRejectReason: r,
    },
  });

  await prisma.dealActivity.create({
    data: {
      dealId: dealId,
      authorId: adminId,
      content: `Contract rejected, reason: ${reason}, \nStage changed from PENDING APPROVAL to NEGOTIATION`,
      activityAt: new Date(),
    }
  })

  return updated;
}

