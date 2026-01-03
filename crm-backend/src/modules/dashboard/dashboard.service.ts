import { PrismaClient, DealStage, TicketStatus } from "@prisma/client";
const prisma=new PrismaClient();

export type DashboardRange="today"|"week"|"month";
export type TaskStatus="pending" |"overdue"|"done";

export interface DashboardTask {
  id:string;
  type:"deal_followup" | "ticket"|"deal_approval" | "ticket_admin";
  title:string;
  dueAt:Date | null;
  status:TaskStatus;
  sourceId:string;
  dealStage?:DealStage;
}

export interface AgentDashboardData {
  taskRange: DashboardRange;
  taskSummary: {
    total: number;
    completed: number;
    overdue: number;
  };

  tasks: DashboardTask[];
  dealChart: {
    range:"month";
    points: { date:string, contractCount: number}[];
  }
}

export interface StageSummaryItem {
  stage:DealStage;
  count:number;
}

export interface AdminDashboardData {
  taskRange:DashboardRange;
  taskSummary: {
    total: number;
    completed: number;
    overdue: number;
  };
  tasks: DashboardTask[];
  dealChart: {
    range:"month";
    points: { date:string, contractCount: number}[];
  }

  stageSummary: StageSummaryItem[];
}

function startOfDay(date:Date){
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date:Date, days:number){
  const newDate = new Date(date);
  newDate.setDate(date.getDate() + days);
  return newDate;
}

function startOfMonth(date:Date){
  return new Date(date.getFullYear(), date.getMonth() , 1);
}

function startOfNextMonth(date:Date){
  return new Date(date.getFullYear(),date.getMonth() + 1, 1);
}

export async function getAgentDashboard(
  userId:number,
  range: DashboardRange="today",
) :Promise<AgentDashboardData> {
  const now = new Date();
  const today = startOfDay(now);

  let rangeStart:Date;
  let rangeEnd:Date;
  switch(range){
    case "week":
      rangeStart = today;
      rangeEnd = addDays(today,7);
      break;
    case "month":
      rangeStart = today;
      rangeEnd=startOfNextMonth(today);
      break;
    case "today":
    default:
      rangeStart = today;
      rangeEnd = addDays(today,1);
      break;
  }

  const potentialDeals = await prisma.deal.findMany({
    where: {
      ownerId:userId,
      stage:"POTENTIAL",
      appointmentAt: {
        gte:rangeStart,
        lte: rangeEnd,
      },
    },
    include: {
      customer: true
    },
  });

  const dealTasks: DashboardTask[] = potentialDeals.map((d)=> {
    const dueAt = d.appointmentAt!;
    let status: TaskStatus = "pending";
    if(d.appointmentAt && now > d.appointmentAt){
      status="overdue";
    }
    
    return {
      id: `deal-${d.id}`,
      type: "deal_followup",
      title: `Contact customer ${d.customer?.name ?? ""} for deal ${d.title}`,
      dueAt,
      status,
      sourceId:d.id,
      dealStage:d.stage,
    }
  });
  
  const tickets = await prisma.ticket.findMany({
    where: {
      assigneeId:userId,
      status: { in: [TicketStatus.OPEN, TicketStatus.PENDING] },
      dueAt: {
        gte:rangeStart,
        lt:rangeEnd,
      },
    },
    include: {
      customer: true,
    },
  });

  const ticketTasks: DashboardTask[] = tickets.map((t) => {
    const dueAt = t.dueAt || t.createdAt;

    let status: TaskStatus = "pending";
    if (t.dueAt && now > t.dueAt) {
      status = "overdue";
    }

    return {
      id: `ticket-${t.id}`,
      type: "ticket",
      title: `Handle ticket ${t.code}: ${t.subject}`,
      dueAt,
      status,
      sourceId: t.id,
    };
  });

  const tasks :DashboardTask[] = [...dealTasks,...ticketTasks];


  const completedDeals = await prisma.deal.count({
    where: {
      ownerId:userId,
      appointmentAt: {
        gte: rangeStart,
        lte: rangeEnd,
      },
      stage: {
        not: "POTENTIAL",
      },
    },
  });

  const completedTickets =await prisma.ticket.count({
    where: {
      assigneeId:userId,
      status: TicketStatus.CLOSED,
      dueAt: {
        gte:rangeStart,
        lt:rangeEnd,
      },
    },
  });


  const overdue = tasks.filter((t) => t.status === "overdue").length;
  const completed = completedDeals + completedTickets;
  const totalTasks = tasks.length + completed;

  const taskSummary = {
    total: totalTasks,
    completed: completed,
    overdue,
  };

  const monthStart=startOfMonth(today);
  const monthEnd=startOfNextMonth(today);

  const contractDeals = await prisma.deal.findMany({
    where: {
      ownerId:userId,
      stage: "CONTRACT",
      closedAt: {
        gte:monthStart,
        lt:monthEnd,
      },
    },
    select:{
      closedAt:true,
    },
  });

  // lưu từng ngày có bn deal contract
  const byDate: Record<string, number> = {};
  for(const date of contractDeals){
    if(!date.closedAt) continue;
    const key = date.closedAt.toISOString().slice(0,10);
    byDate[key]=(byDate[key] || 0) +1;
  }

  const points = Object.keys(byDate)
    .sort()
    .map((date) => ({
      date,
      contractCount: byDate[date],
    }));

  return {
    taskRange: range,
    taskSummary,
    tasks,
    dealChart: {
      range:"month",
      points,
    }
  }
}

export async  function getAdminDashboard(
  userId: number,
  range:DashboardRange="today"
): Promise<AdminDashboardData>{
  const now = new Date();
  const today = startOfDay(now);

  let rangeStart: Date;
  let rangeEnd: Date;

  switch (range) {
    case "week":
      rangeStart = today;
      rangeEnd = addDays(today, 7);
      break;
    case "month":
      rangeStart = startOfMonth(today);
      rangeEnd = startOfNextMonth(today);
      break;
    case "today":
    default:
      rangeStart = today;
      rangeEnd = addDays(today, 1);
      break;
  }

  const approvalDeals = await prisma.deal.findMany({
    where: {
      stage: "PENDING_CONTRACT_APPROVAL",
    },
    include:{
      customer:true,
      owner:true,
    },
  });

  const approvalTasks: DashboardTask[] = approvalDeals.map((deal)=>{
    const dueAt= deal.approvalRequestedAt!;
    let status:TaskStatus="pending";
    //if(dueAt && now>dueAt) status="overdue";
    const customerName=deal.customer?.name?? "";
    const ownerName=deal.owner?.fullName ?? "";

    return{
      id:`approval-${deal.id}`,
      type:"deal_approval",
      title:`Review deal ${deal.title} - ${customerName} (owner: ${ownerName})`,
      dueAt,
      status,
      sourceId:deal.id,
      dealStage:deal.stage,
    };
  });

  //với admin thì tìm ticket chưa được giao việc
  const tickets =await prisma.ticket.findMany({
    where: {
      assigneeId:null,
      status: { in: [TicketStatus.OPEN, TicketStatus.PENDING] }
    },
    include:{
      customer:true,
    },
  });

  const ticketTasks: DashboardTask[] =tickets.map((ticket)=>{
    const dueAt=ticket.dueAt;
    let status:TaskStatus="pending";
    if(ticket.dueAt && now>ticket.dueAt) status="overdue";

    return{
      id:`ticket-admin-${ticket.id}`,
      type:"ticket_admin",
      title:`Assign ticket ${ticket.code}: ${ticket.subject}`,
      dueAt,
      status,
      sourceId:ticket.id,
    };
  });

  const tasks:DashboardTask[] = [...approvalTasks,...ticketTasks];

  const completedApprovals = await prisma.deal.count({
    where: {
      stage: {
        not: "PENDING_CONTRACT_APPROVAL",
      },
      approvalReviewedAt: { // deal đã được review và khác trạng thái chờ duyệt
        gte: rangeStart,
        lt:rangeEnd,
      },
    },
  });

  const completedTickets =await prisma.ticket.count({
    where: {
      status: TicketStatus.CLOSED,
      updatedAt: {
        gte:rangeStart,
        lt:rangeEnd,
      },
    },
  });

  const overdue=tasks.filter((t) => t.status === "overdue").length;
  const completed=completedApprovals+completedTickets;
  const totalTasks=tasks.length+completed;

  const taskSummary = {
    total:totalTasks,
    completed : completed,
    overdue: overdue,
  };

  const monthStart=startOfMonth(today);
  const monthEnd=startOfNextMonth(today);

  const contractDeals = await prisma.deal.findMany({
    where: {
      stage:"CONTRACT",
      closedAt:{
        gte:monthStart,
        lt:monthEnd,
      },
    },
    select:{
      closedAt: true,
    },
  });

  const byDate:Record<string, number> = {};
  for(const date of contractDeals){
    if(!date.closedAt){continue;}
    const key = date.closedAt.toISOString().slice(0,10);
    byDate[key]=(byDate[key] || 0) +1;
  }

  const points = Object.keys(byDate)
    .sort()
    .map((date) => ({
      date,
      contractCount: byDate[date],
    }));

  const stageGrouped = await prisma.deal.groupBy({
    by: ["stage"],
    _count: {_all:true},
  });

  const stageSummary: StageSummaryItem[] = stageGrouped.map((g) => ({
    stage: g.stage,
    count: g._count._all,
  }));

  return {
    taskRange:range,
    taskSummary,
    tasks,
    dealChart:{
      range:"month",
      points,
    },
    stageSummary,
  }

}