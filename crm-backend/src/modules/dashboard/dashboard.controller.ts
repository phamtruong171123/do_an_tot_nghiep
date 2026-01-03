import {Request, Response} from 'express';
import { DashboardRange, getAgentDashboard,getAdminDashboard } from "./dashboard.service";
import { JwtUser} from "../../middleware/auth";

export async function getAgentDashboardHandler(req: Request, res: Response): Promise<Response> {
  const user=(req as any).user as JwtUser|undefined;
  if(!user){
    return res.status(401).json({message: "Unauthorized"});
  }
  
  if(user.role !=="AGENT"){
    return res.status(403).json({message: "Only agent can view this dashboard"});
  }
  
  const rangeParam = (req.query.range as string) || "today";
  const range: DashboardRange = rangeParam ==="week" || rangeParam==="month" || rangeParam ==="today" ? rangeParam : "today";

  try{
    const data = await getAgentDashboard(user.id,range);
    return res.json(data);
  }catch(err){
    return res.status(500).json({message: `Error: ${err}`});
  }
}

export async function getAdminDashboardHandler(req: Request, res: Response): Promise<Response> {
  const user=(req as any).user as JwtUser|undefined;
  if(!user){
    return res.status(401).json({message: "Unauthorized"});
  }

  if(user.role !=="ADMIN"){
    return res.status(403).json({message: "Only admin can view this dashboard"});
  }

  const rangeParam = (req.query.range as string) || "today";
  const range: DashboardRange =
    rangeParam === "week" || rangeParam === "month" || rangeParam === "today"
      ? rangeParam
      : "today";

  try {
    const data = await getAdminDashboard(user.id, range);
    return res.json(data);
  } catch (err) {
    console.error("getAdminDashboard error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}