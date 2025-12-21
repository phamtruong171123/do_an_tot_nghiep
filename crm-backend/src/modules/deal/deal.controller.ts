import { Request, Response } from "express";
import * as dealService from "./deal.service";
import { JwtUser } from "../../middleware/auth";



export async function getDeals(req: Request, res: Response) {
  const { customerId, page, pageSize, search, sortBy, sortOrder, stage } = req.query;
  const user = (req as any).user as JwtUser;

  const data = await dealService.listDeals({
    customerId: customerId ? Number(customerId) : undefined,
    stage: typeof stage === "string" ? stage : undefined,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
    search: typeof search === "string" ? search.trim() : undefined,
    sortBy:
      sortBy === "amount" || sortBy === "appointmentAt" || sortBy === "createdAt"
        ? sortBy
        : undefined,
    sortOrder: sortOrder === "asc" || sortOrder === "desc" ? sortOrder : undefined,
    user: { id: user.id, role: user.role },
  });

  res.json(data);
}


export async function getDealById(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as any).user as JwtUser;
  const deal = await dealService.getDealForUser(id, { id: user.id, role: user.role });

  if (!deal) return res.status(404).json({ message: "Deal not found" });
  res.json(deal);
}

export async function postDeal(req: Request, res: Response) {
  const user = (req as any).user as JwtUser;

  const { customerId, title, description, amount, currency, appointmentAt } = req.body;

  if (!customerId || !title) {
    return res.status(400).json({ message: "customerId và title là bắt buộc" });
  }

  const deal = await dealService.createDeal({
    customerId: Number(customerId),
    title,
    description,
    amount: amount != null ? Number(amount) : undefined,
    currency,
    appointmentAt: appointmentAt ? new Date(appointmentAt) : undefined,
    ownerId: user.id,
  });

  res.status(201).json(deal);
}

export async function postDealActivity(req: Request, res: Response) {
  const userId = (req as any).user?.id as number | undefined;
  if (!userId) return res.status(401).json({ message: "Unauthenticated" });

  const { id } = req.params; // dealId
  const { content, activityAt } = req.body;

  if (!content) return res.status(400).json({ message: "content is required" });

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

  const items = await dealService.listDealActivities(id, limit ? Number(limit) : 20);
  res.json(items);
}

/**
 *
 * GET /api/customers/:customerId/recent-deals
 */
export async function getRecentDealsOfCustomer(req: Request, res: Response) {
  const { customerId } = req.params;
  const { limit } = req.query;
  const user = (req as any).user as JwtUser;

  const items = await dealService.listRecentDealsForCustomer(
    Number(customerId),
    limit ? Number(limit) : 5,
    user.role === "ADMIN" ? undefined : user.id
  );

  res.json(items);
};


export async function patchDeal(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const user = (req as any).user as { id: number; role: "ADMIN" | "AGENT" };
  const updated = await dealService.updateDealWithActivity(id, req.body, { id: user.id, role: user.role });

    return res.json(updated);
  } catch (e: any) {
    console.error(e);
    return res.status(400).json({ error: e.message || "Failed to update deal" });
  }
}

export async function requestContractApproval(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as any).user as JwtUser;

  try {
    const updated = await dealService.requestContractApproval(id, { id: user.id, role: user.role });
    return res.json(updated);
  } catch (e: any) {
    return res.status(e.statusCode || 400).json({ error: e.message || "Request approval failed" });
  }
}

export async function approveContract(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as any).user as JwtUser;

  try {
    const updated = await dealService.approveContract(id, user.id);
    return res.json(updated);
  } catch (e: any) {
    return res.status(e.statusCode || 400).json({ error: e.message || "Approve failed" });
  }
}

export async function rejectContract(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as any).user as JwtUser;
  const reason = String(req.body?.reason || "").trim();

  try {
    const updated = await dealService.rejectContract(id, user.id, reason);
    return res.json(updated);
  } catch (e: any) {
    return res.status(e.statusCode || 400).json({ error: e.message || "Reject failed" });
  }
}

