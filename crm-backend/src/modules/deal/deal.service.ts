import { PrismaClient, DealStage, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * List deals, có thể filter theo customerId
 */
export async function listDeals(params: {
  customerId?: number;  
  page?: number;
  pageSize?: number;
}) {
  const { customerId, page = 1, pageSize = 20 } = params;

  const where: Prisma.DealWhereInput = {};
  if (typeof customerId === 'number') {
    where.customerId = customerId;      
  }

  const [items, total] = await Promise.all([
    prisma.deal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
        orderBy: { activityAt: 'desc' },
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

/**
 * Tạo deal mới
 */
export async function createDeal(data: {
  customerId: number;  
  title: string;
  description?: string;
  amount?: number;
  currency?: string;
  appointmentAt?: Date;
  ownerId?: number;
}) {
  const code = 'DE-' + Date.now(); // TODO: generate code đẹp hơn nếu cần

  return prisma.deal.create({
    data: {
      code,
      title: data.title,
      description: data.description,
      customerId: data.customerId,   
      amount: data.amount,
      currency: data.currency ?? 'VND',
      appointmentAt: data.appointmentAt,
      ownerId: data.ownerId,
    },
  });
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
  }>,
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
export async function listDealActivities(
  dealId: string,
  limit = 20,
) {
  return prisma.dealActivity.findMany({
    where: { dealId },
    orderBy: { activityAt: 'desc' },
    take: limit,
    include: {
      author: { select: { id: true, fullName: true } },
    },
  });
}

/**
 * Recent deals cho 1 customer 
 */
export async function listRecentDealsForCustomer(
  customerId: number,  
  limit = 5,
) {
  return prisma.deal.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
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
