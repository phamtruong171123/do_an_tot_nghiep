import { Request, Response } from 'express';
import * as dealService from './deal.service';

export async function getDeals(req: Request, res: Response) {
  const { customerId, page, pageSize } = req.query;

  const data = await dealService.listDeals({
    customerId: customerId ? Number(customerId) : undefined,  // 👈 convert sang number
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  });

  res.json(data);
}

export async function getDealById(req: Request, res: Response) {
  const { id } = req.params;
  const deal = await dealService.getDeal(id);
  if (!deal) return res.status(404).json({ message: 'Deal not found' });
  res.json(deal);
}

export async function postDeal(req: Request, res: Response) {
  const userId = (req as any).user?.id as number | undefined;
  const { customerId, title, description, amount, currency, appointmentAt } =
    req.body;

  if (!customerId || !title) {
    return res
      .status(400)
      .json({ message: 'customerId và title là bắt buộc' });
  }

  const deal = await dealService.createDeal({
    customerId: Number(customerId),                 
    title,
    description,
    amount: amount != null ? Number(amount) : undefined,
    currency,
    appointmentAt: appointmentAt
      ? new Date(appointmentAt)
      : undefined,
    ownerId: userId,
  });

  res.status(201).json(deal);
}

export async function patchDeal(req: Request, res: Response) {
  const { id } = req.params;
  const data = req.body;

  const updated = await dealService.updateDeal(id, {
    ...data,
    amount: data.amount != null ? Number(data.amount) : undefined,
    appointmentAt: data.appointmentAt
      ? new Date(data.appointmentAt)
      : undefined,
    closedAt: data.closedAt ? new Date(data.closedAt) : undefined,
    ownerId:
      data.ownerId != null ? Number(data.ownerId) : undefined,
  });

  res.json(updated);
}

export async function postDealActivity(req: Request, res: Response) {
  const userId = (req as any).user?.id as number | undefined;
  if (!userId) return res.status(401).json({ message: 'Unauthenticated' });

  const { id } = req.params; // dealId
  const { content, activityAt } = req.body;

  if (!content) return res.status(400).json({ message: 'content is required' });

  const activity = await dealService.addDealActivity({
    dealId: id,
    authorId: userId,
    content,
    activityAt: activityAt ? new Date(activityAt) : undefined,
  });

  res.status(201).json(activity);
}

export async function getDealActivities(req: Request, res: Response) {
  const { id } = req.params;
  const { limit } = req.query;

  const items = await dealService.listDealActivities(
    id,
    limit ? Number(limit) : 20,
  );
  res.json(items);
}

/**
 *
 * GET /api/customers/:customerId/recent-deals
 */
export async function getRecentDealsOfCustomer(req: Request, res: Response) {
  const { customerId } = req.params;
  const { limit } = req.query;

  const items = await dealService.listRecentDealsForCustomer(
    Number(customerId),                
    limit ? Number(limit) : 5,
  );
  res.json(items);
}
